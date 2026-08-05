let mirror = null;

function createMirror() {

    if (mirror) return mirror;

    mirror = document.createElement("div");

    mirror.style.position = "absolute";
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

    const rect = marker.getBoundingClientRect();

    marker.remove();

    return {
        x: rect.left,
        y: rect.top
    };

}