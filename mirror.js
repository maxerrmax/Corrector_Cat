let mirror = null;

function createMirror() {

    if (mirror) return mirror;

    mirror = document.createElement("div");

    mirror.style.position = "absolute";
    // Fixem una posició coneguda i fora de pantalla, en lloc de deixar-lo
    // caure a la posició estàtica (que pot acabar a qualsevol lloc del document)
    mirror.style.top = "0";
    mirror.style.left = "0";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";

    document.body.appendChild(mirror);

    return mirror;

}

function copyStyles(textarea) {

    createMirror();

    const style = getComputedStyle(textarea);

    mirror.style.font = style.font;
    mirror.style.padding = style.padding;
    mirror.style.border = style.border;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.letterSpacing = style.letterSpacing;
    mirror.style.boxSizing = style.boxSizing;
    mirror.style.width = textarea.offsetWidth + "px";

}

function getCaretCoordinates(textarea, position) {

    createMirror();
    copyStyles(textarea);

    mirror.textContent = textarea.value.substring(0, position);

    const marker = document.createElement("span");
    marker.textContent = "|";

    mirror.appendChild(marker);

    // Coordenades del marker RELATIVES al propi mirall, no al viewport.
    // Com que el mirall té el mateix padding/border/font que el textarea,
    // el seu cantó superior esquerre coincideix amb el del textarea (i,
    // per tant, amb el de l'overlay, que hi està alineat amb inset:0).
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    marker.remove();

    return {
        x: markerRect.left - mirrorRect.left,
        y: markerRect.top - mirrorRect.top
    };

}