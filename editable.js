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
    // Mateix ajust que a overlay.js: caixa més alta per poder clicar-la
    // bé, mantenint la vora inferior al mateix lloc visual d'abans.
    underline.style.top = `${rect.bottom - 8}px`;
    underline.style.width = `${rect.width}px`;

    underline.addEventListener("click", () => {
        const clickRect = underline.getBoundingClientRect();
        showSuggestionPopup(clickRect, error, () => applyFixEditable(el, error));
    });

    layer.appendChild(underline);

}

// Aplica la correcció substituint el text dins el Range corresponent,
// i redispara "input" perquè es recalculin els errors restants.
function applyFixEditable(el, error) {

    const range = createRangeForOffsets(el, error.start, error.end);

    if (!range) return;

    range.deleteContents();
    range.insertNode(document.createTextNode(error.correct));

    // Fusiona nodes de text adjacents perquè els offsets futurs
    // (getTextNodesInfo) es mantinguin consistents.
    el.normalize();

    el.dispatchEvent(new Event("input", { bubbles: true }));

}

function highlightErrors(el, ownerId) {

    const text = getFlatText(el);
    const errors = findErrors(text);

    clearUnderlinesFor(ownerId);

    errors.forEach(error => {

        const range = createRangeForOffsets(el, error.start, error.end);

        if (!range) return;

        Array.from(range.getClientRects()).forEach(rect => {
            drawUnderlineFixed(rect, ownerId, error, el);
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

    window.addEventListener("scroll", scheduleHighlight, true);
    window.addEventListener("resize", scheduleHighlight);

    highlightErrors(el, ownerId);

}

function scanForEditables(root = document) {

    root.querySelectorAll('[contenteditable="true"], [contenteditable=""]')
        .forEach(initEditable);

}

scanForEditables();

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