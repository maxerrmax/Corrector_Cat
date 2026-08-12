function syncOverlay(textarea, overlay) {

    const style = getComputedStyle(textarea);

    overlay.style.font = style.font;
    overlay.style.padding = style.padding;
    overlay.style.lineHeight = style.lineHeight;
    overlay.style.letterSpacing = style.letterSpacing;
    overlay.style.textAlign = style.textAlign;

    overlay.style.whiteSpace = "pre-wrap";
    overlay.style.overflowWrap = "break-word";

    let textLayer = overlay.querySelector(".corrector-text");
    if (!textLayer) {
        textLayer = document.createElement("span");
        textLayer.className = "corrector-text";
        overlay.appendChild(textLayer);
    }
    textLayer.textContent = textarea.value;
}

// error: { wrong, correct, start, end }
function drawUnderline(overlay, textarea, error, x, y, width) {

    const style = getComputedStyle(overlay);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;

    const underline = document.createElement("div");
    underline.className = "corrector-underline";

    underline.style.left = `${x}px`;
    // La caixa ara és més alta (per poder-la clicar bé), però mantenim
    // el mateix punt visual on queia la línia abans (vora inferior).
    underline.style.top = `${y + lineHeight - 8}px`;
    underline.style.width = `${width}px`;

    underline.addEventListener("click", () => {
        const rect = underline.getBoundingClientRect();
        showSuggestionPopup(rect, error, (chosenText) => applyFixTextarea(textarea, error, chosenText));
    });

    overlay.appendChild(underline);

}