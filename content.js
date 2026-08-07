document.querySelectorAll("textarea").forEach(initTextarea);

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

    syncOverlay(textarea, overlay);

    textarea.addEventListener("input", () => {

        syncOverlay(textarea, overlay);

        const errors = findErrors(textarea.value);

        overlay.querySelectorAll(".corrector-underline").forEach(line => line.remove());

        errors.forEach(error => {

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

    });

    textarea.addEventListener("scroll", () => {

        overlay.scrollTop = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;

    });

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