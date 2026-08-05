function syncOverlay(textarea, overlay) {

    const style = getComputedStyle(textarea);

    // Copiar els estils necessaris
    overlay.style.font = style.font;
    overlay.style.padding = style.padding;
    overlay.style.lineHeight = style.lineHeight;
    overlay.style.letterSpacing = style.letterSpacing;
    overlay.style.textAlign = style.textAlign;

    overlay.style.whiteSpace = "pre-wrap";
    overlay.style.overflowWrap = "break-word";

    // Copiar el text
    overlay.textContent = textarea.value;
}