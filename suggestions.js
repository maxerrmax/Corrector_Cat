let activePopup = null;

function closeSuggestionPopup() {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
}

// Tanca el popup si es clica fora seu. Comprovem que el punt de clic
// NO estigui dins del popup (en comptes de confiar en stopPropagation,
// que pot donar problemes de timing entre fase de captura i bombolla).
document.addEventListener("click", (e) => {
    if (activePopup && !activePopup.contains(e.target)) {
        closeSuggestionPopup();
    }
}, true);

// rect: un DOMRect (viewport-relative) prop del qual mostrar el popup.
// error: { wrong, correct, start, end }
// onApply: funció sense arguments que aplica la correcció real
function showSuggestionPopup(rect, error, onApply) {

    closeSuggestionPopup();

    const popup = document.createElement("div");
    popup.className = "corrector-popup";

    const suggestion = document.createElement("button");
    suggestion.type = "button";
    suggestion.className = "corrector-suggestion";
    suggestion.textContent = error.correct;

    suggestion.addEventListener("click", () => {
        onApply();
        closeSuggestionPopup();
    });

    popup.appendChild(suggestion);
    document.body.appendChild(popup);

    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 4}px`;

    activePopup = popup;

}