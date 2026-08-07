let editableCounter = 0;
let overlayLayer = null;

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

// Recorre els nodes de text de l'element i retorna, per cadascun,
// l'offset de caràcter global on comença i acaba dins del "text pla".
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

// Text pla construït EXACTAMENT amb el mateix criteri que getTextNodesInfo,
// perquè els índexs de findErrors coincideixin amb els nodes reals del DOM.
function getFlatText(el) {

    return getTextNodesInfo(el).map(info => info.node.textContent).join("");

}

// Converteix un rang [start, end) de caràcters en un Range real del DOM.
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

function drawUnderlineFixed(rect, ownerId) {

    const layer = getOverlayLayer();

    const underline = document.createElement("div");
    underline.className = "corrector-underline";
    underline.dataset.owner = ownerId;

    // position:fixed perquè getClientRects() ja retorna coordenades
    // relatives al viewport - no cal cap conversió com amb el mirall.
    underline.style.position = "fixed";
    underline.style.left = `${rect.left}px`;
    underline.style.top = `${rect.bottom - 2}px`;
    underline.style.width = `${rect.width}px`;

    layer.appendChild(underline);

}

function highlightErrors(el, ownerId) {

    const text = getFlatText(el);
    const errors = findErrors(text);

    clearUnderlinesFor(ownerId);

    errors.forEach(error => {

        const range = createRangeForOffsets(el, error.start, error.end);

        if (!range) return;

        // Un error pot ocupar més d'una línia visual -> pot generar
        // més d'un rectangle. Els dibuixem tots.
        Array.from(range.getClientRects()).forEach(rect => {
            drawUnderlineFixed(rect, ownerId);
        });

    });

}

function initEditable(el) {

    if (el.dataset.correctorInitialized) return;
    el.dataset.correctorInitialized = "true";

    const ownerId = `ce-${editableCounter++}`;
    el.dataset.correctorId = ownerId;

    let scheduled = false;

    const scheduleHighlight = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            highlightErrors(el, ownerId);
        });
    };

    el.addEventListener("input", scheduleHighlight);

    // Com que fem servir position:fixed, cal redibuixar quan l'element
    // es mou dins la pàgina (scroll de la finestra o d'un contenidor pare).
    window.addEventListener("scroll", scheduleHighlight, true);
    window.addEventListener("resize", scheduleHighlight);

    highlightErrors(el, ownerId);

}

function scanForEditables(root = document) {

    root.querySelectorAll('[contenteditable="true"], [contenteditable=""]')
        .forEach(initEditable);

}

// Detecció inicial
scanForEditables();

// Molts editors web (Gmail, formularis dinàmics...) insereixen el
// contenteditable més tard, un cop carregada la pàgina.
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