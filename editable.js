let editableCounter = 0;
let overlayLayer = null;

// Estat de LanguageTool per cada element contenteditable.
// NOTA: LANGUAGETOOL_DEBOUNCE_MS ja està declarat a content.js -- com que
// tots els content scripts comparteixen el mateix àmbit global, no cal
// (ni es pot) tornar-lo a declarar aquí. content.js s'ha de carregar
// abans que editable.js al manifest.json perquè això funcioni.
const languageToolStateEditable = new WeakMap();

function getOverlayLayer() {

    if (overlayLayer) return overlayLayer;

    overlayLayer = document.createElement("div");
    overlayLayer.id = "corrector-editable-layer";
    overlayLayer.style.position = "fixed";
    overlayLayer.style.top = "0";
    overlayLayer.style.left = "0";
    overlayLayer.style.width = "0";
    overlayLayer.style.height = "0";
    overlayLayer.style.pointerEvents = "none";
    overlayLayer.style.zIndex = "2147483647";

    document.body.appendChild(overlayLayer);

    return overlayLayer;

}

function getTextNodesInfo(el) {

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

    const nodesInfo = [];
    let offset = 0;
    let node;

    while ((node = walker.nextNode())) {

        const length = node.textContent.length;

        nodesInfo.push({ node, start: offset, end: offset + length });

        offset += length;

    }

    return nodesInfo;

}

function getFlatText(el) {

    return getTextNodesInfo(el).map(info => info.node.textContent).join("");

}

function createRangeForOffsets(el, start, end) {

    const nodesInfo = getTextNodesInfo(el);

    const range = document.createRange();

    let startSet = false;
    let endSet = false;

    for (const info of nodesInfo) {

        if (!startSet && start >= info.start && start <= info.end) {
            range.setStart(info.node, start - info.start);
            startSet = true;
        }

        if (!endSet && end >= info.start && end <= info.end) {
            range.setEnd(info.node, end - info.start);
            endSet = true;
        }

        if (startSet && endSet) break;

    }

    if (!startSet || !endSet) return null;

    return range;

}

function clearUnderlinesFor(ownerId) {

    getOverlayLayer()
        .querySelectorAll(`.corrector-underline[data-owner="${ownerId}"]`)
        .forEach(line => line.remove());

}

// error: { wrong, correct, start, end }
function drawUnderlineFixed(rect, ownerId, error, el) {

    const layer = getOverlayLayer();

    const underline = document.createElement("div");
    underline.className = "corrector-underline";
    underline.dataset.owner = ownerId;

    underline.style.position = "fixed";
    underline.style.left = `${rect.left}px`;
    underline.style.top = `${rect.bottom - 10}px`;
    underline.style.width = `${rect.width}px`;

    underline.addEventListener("click", () => {
        const clickRect = underline.getBoundingClientRect();
        showSuggestionPopup(clickRect, error, (chosenText) => applyFixEditable(el, error, chosenText));
    });

    layer.appendChild(underline);

}

// Aplica la correcció substituint el text dins el Range corresponent,
// i redispara "input" perquè LanguageTool torni a analitzar el text.
// chosenText: quin dels suggeriments s'ha clicat.
function applyFixEditable(el, error, chosenText) {

    const replacement = chosenText !== undefined ? chosenText : error.correct;

    const range = createRangeForOffsets(el, error.start, error.end);

    if (!range) return;

    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));

    el.normalize();

    el.dispatchEvent(new Event("input", { bubbles: true }));

}

// Repinta tots els subratllats amb els últims errors coneguts de
// LanguageTool (pot ser un array buit fins que arriba la primera resposta).
function redrawEditable(el, ownerId) {

    const state = languageToolStateEditable.get(el);
    const ltErrors = state ? state.lastResults : [];

    clearUnderlinesFor(ownerId);

    ltErrors.forEach(error => {

        const range = createRangeForOffsets(el, error.start, error.end);

        if (!range) return;

        Array.from(range.getClientRects()).forEach(rect => {
            drawUnderlineFixed(rect, ownerId, error, el);
        });

    });

}

function scheduleLanguageToolCheckEditable(el, ownerId) {

    const state = languageToolStateEditable.get(el);

    clearTimeout(state.timer);

    state.timer = setTimeout(async () => {

        const myRequestId = ++state.requestId;
        const textAtRequestTime = getFlatText(el);

        const ltErrors = await checkWithLanguageTool(textAtRequestTime);

        // Descartem la resposta si l'usuari ha seguit escrivint mentre
        // esperàvem, o si el text ha canviat per altres motius.
        if (myRequestId !== state.requestId) return;
        if (getFlatText(el) !== textAtRequestTime) return;

        state.lastResults = ltErrors;

        redrawEditable(el, ownerId);

    }, LANGUAGETOOL_DEBOUNCE_MS);

}

function initEditable(el) {

    if (el.dataset.correctorInitialized) return;
    el.dataset.correctorInitialized = "true";

    const ownerId = `ce-${editableCounter++}`;
    el.dataset.correctorId = ownerId;

    languageToolStateEditable.set(el, { lastResults: [], timer: null, requestId: 0 });

    let scheduled = false;

    const scheduleRedraw = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            redrawEditable(el, ownerId);
        });
    };

    el.addEventListener("input", () => {
        scheduleRedraw();
        scheduleLanguageToolCheckEditable(el, ownerId);
    });

    // Com que fem servir position:fixed, cal redibuixar quan l'element
    // es mou dins la pàgina (scroll de la finestra o d'un contenidor pare).
    window.addEventListener("scroll", scheduleRedraw, true);
    window.addEventListener("resize", scheduleRedraw);

    redrawEditable(el, ownerId);

}

function scanForEditables(root = document) {

    root.querySelectorAll('[contenteditable="true"], [contenteditable=""]')
        .forEach(initEditable);

}

const editableObserver = new MutationObserver(mutations => {

    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.matches?.('[contenteditable="true"], [contenteditable=""]')) {
                initEditable(node);
            }
            scanForEditables(node);
        });
    });

});

editableObserver.observe(document.body, { childList: true, subtree: true });

// Inicialització: al final del fitxer, un cop tot ja està declarat.
scanForEditables();