let activePopup = null;

const MAX_SUGGESTIONS_SHOWN = 5;

function closeSuggestionPopup() {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
}

document.addEventListener("click", (e) => {
    if (activePopup && !activePopup.contains(e.target)) {
        closeSuggestionPopup();
    }
}, true);

// rect: un DOMRect (viewport-relative) prop del qual mostrar el popup.
// error: { wrong, correct, start, end, suggestions?, message? }
// onApply: funció que rep el text triat i aplica la correcció real.
function showSuggestionPopup(rect, error, onApply) {

    closeSuggestionPopup();

    const popup = document.createElement("div");
    popup.className = "corrector-popup";

    // El diccionari no té "message"; LanguageTool sí -- quan hi és,
    // expliquem per què és un error abans dels suggeriments.
    if (error.message) {
        const message = document.createElement("div");
        message.className = "corrector-message";
        message.textContent = error.message;
        popup.appendChild(message);
    }

    // El diccionari només té "correct" (un sol suggeriment). LanguageTool
    // pot tenir-ne diversos a "suggestions". Fem servir el que hi hagi.
    const suggestions = (error.suggestions && error.suggestions.length > 0)
        ? error.suggestions
        : [error.correct];

    suggestions.slice(0, MAX_SUGGESTIONS_SHOWN).forEach(suggestionText => {

        const button = document.createElement("button");
        button.type = "button";
        button.className = "corrector-suggestion";
        button.textContent = suggestionText;

        button.addEventListener("click", () => {
            onApply(suggestionText);
            closeSuggestionPopup();
        });

        popup.appendChild(button);

    });

    document.body.appendChild(popup);

    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 4}px`;

    activePopup = popup;

}