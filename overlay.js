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

    // Busca (o crea) el span de text, sense tocar les underlines existents
    let textLayer = overlay.querySelector(".corrector-text");
    if (!textLayer) {
        textLayer = document.createElement("span");
        textLayer.className = "corrector-text";
        overlay.appendChild(textLayer);
    }
    textLayer.textContent = textarea.value;
}

function drawUnderline(overlay, x, y, width) {

    const style = getComputedStyle(overlay);

    // line-height en píxels (amb fallback si vingués com "normal")
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;

    const underline = document.createElement("div");

    underline.className = "corrector-underline";

    underline.style.left = `${x}px`;
    // y és el punt SUPERIOR de la línia de text; sumem el line-height
    // (menys uns px) perquè la ratlla quedi enganxada sota el text,
    // no a l'inici de la línia.
    underline.style.top = `${y + lineHeight - 2}px`;
    underline.style.width = `${width}px`;

    overlay.appendChild(underline);

}