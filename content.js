// Estat de LanguageTool per cada textarea: últim resultat conegut,
// timer del debounce, i un comptador per descartar respostes obsoletes.
const languageToolState = new WeakMap();

const LANGUAGETOOL_DEBOUNCE_MS = 500;

function initTextarea(textarea) {

    if (textarea.dataset.correctorInitialized) return;
    textarea.dataset.correctorInitialized = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "corrector-wrapper";

    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(textarea);

    const overlay = document.createElement("div");
    overlay.className = "corrector-overlay";

    wrapper.insertBefore(overlay, textarea);

    languageToolState.set(textarea, { lastResults: [], timer: null, requestId: 0 });

    syncOverlay(textarea, overlay);

    textarea.addEventListener("input", () => {

        // Redibuixat immediat amb el diccionari (0ms de latència).
        redraw(textarea, overlay);

        // Petició "debounced" a LanguageTool -- no es dispara fins que
        // l'usuari para d'escriure una estona.
        scheduleLanguageToolCheck(textarea, overlay);

    });

    textarea.addEventListener("scroll", () => {

        overlay.scrollTop = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;

    });

}

// Repinta tots els subratllats: la unió dels errors del diccionari
// (calculats a l'instant) i els últims errors coneguts de LanguageTool
// (poden ser d'una crida anterior, mentre n'arriba una de nova).
function redraw(textarea, overlay) {

    syncOverlay(textarea, overlay);

    const dictErrors = findErrors(textarea.value);
    const state = languageToolState.get(textarea);
    const ltErrors = state ? state.lastResults : [];

    overlay.querySelectorAll(".corrector-underline").forEach(line => line.remove());

    [...dictErrors, ...ltErrors].forEach(error => {

        const start = getCaretCoordinates(textarea, error.start);
        const end = getCaretCoordinates(textarea, error.end);

        drawUnderline(
            overlay,
            textarea,
            error,
            start.x,
            start.y,
            end.x - start.x
        );

    });

}

function scheduleLanguageToolCheck(textarea, overlay) {

    const state = languageToolState.get(textarea);

    clearTimeout(state.timer);

    state.timer = setTimeout(async () => {

        const myRequestId = ++state.requestId;
        const textAtRequestTime = textarea.value;

        const ltErrors = await checkWithLanguageTool(textAtRequestTime);

        // Si l'usuari ha seguit escrivint mentre esperàvem la resposta,
        // aquesta ja és obsoleta -- la descartem.
        if (myRequestId !== state.requestId) return;
        if (textarea.value !== textAtRequestTime) return;

        state.lastResults = ltErrors;

        redraw(textarea, overlay);

    }, LANGUAGETOOL_DEBOUNCE_MS);

}

// Aplica la correcció d'un error dins d'un textarea i redispara
// l'anàlisi perquè es redibuixin els subratllats restants.
function applyFixTextarea(textarea, error) {

    const value = textarea.value;

    const newValue = value.slice(0, error.start) + error.correct + value.slice(error.end);

    textarea.value = newValue;

    const newCaretPos = error.start + error.correct.length;

    textarea.focus();
    textarea.setSelectionRange(newCaretPos, newCaretPos);

    textarea.dispatchEvent(new Event("input", { bubbles: true }));

}

function findErrors(text) {

    const errors = [];

    Object.entries(dictionary).forEach(([wrong, correct]) => {

        const regex = new RegExp(`\\b${wrong}\\b`, "g");

        let match;

        while ((match = regex.exec(text)) !== null) {

            errors.push({
                wrong,
                correct,
                start: match.index,
                end: match.index + wrong.length
            });

        }

    });

    return errors.sort((a, b) => a.start - b.start);

}

// Inicialització: ara al final del fitxer, un cop totes les
// funcions i variables que fa servir initTextarea ja existeixen.
document.querySelectorAll("textarea").forEach(initTextarea);