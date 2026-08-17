let activePopup = null;

const MAX_SUGGESTIONS_SHOWN = 5;
const POPUP_VIEWPORT_MARGIN = 8;

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

// Ajusta la posició del popup perquè no quedi tallat per la vora de la
// finestra -- s'ha de cridar DESPRÉS d'inserir-lo al DOM, un cop en
// coneixem la mida real.
function clampPopupToViewport(popup, rect) {

    const popupRect = popup.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 4;

    if (left + popupRect.width > window.innerWidth - POPUP_VIEWPORT_MARGIN) {
        left = window.innerWidth - popupRect.width - POPUP_VIEWPORT_MARGIN;
    }

    if (left < POPUP_VIEWPORT_MARGIN) {
        left = POPUP_VIEWPORT_MARGIN;
    }

    if (top + popupRect.height > window.innerHeight - POPUP_VIEWPORT_MARGIN) {
        // No hi cap a sota -> el posem a sobre de la línia en comptes.
        top = rect.top - popupRect.height - 4;
    }

    if (top < POPUP_VIEWPORT_MARGIN) {
        top = POPUP_VIEWPORT_MARGIN;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

}

// rect: un DOMRect (viewport-relative) prop del qual mostrar el popup.
// error: { wrong, correct, start, end, suggestions?, message? }
// onApply: funció que rep el text triat i aplica la correcció real.
// onIgnore: funció sense arguments que marca l'error com a ignorat.
function showSuggestionPopup(rect, error, onApply, onIgnore) {

    closeSuggestionPopup();

    const popup = document.createElement("div");
    popup.className = "corrector-popup";

    if (error.message) {
        const message = document.createElement("div");
        message.className = "corrector-message";
        message.textContent = error.message;
        popup.appendChild(message);
    }

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

    if (onIgnore) {

        const ignoreButton = document.createElement("button");
        ignoreButton.type = "button";
        ignoreButton.className = "corrector-ignore";
        ignoreButton.textContent = "Ignora aquest avís";

        ignoreButton.addEventListener("click", () => {
            onIgnore();
            closeSuggestionPopup();
        });

        popup.appendChild(ignoreButton);

    }

    document.body.appendChild(popup);

    // Posició inicial abans de conèixer la mida real del popup...
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 4}px`;

    // ...i ajustem un cop ja està al DOM i sabem les seves dimensions.
    clampPopupToViewport(popup, rect);

    // Transició d'entrada: comencem amb opacity 0 (definit al CSS) i
    // afegim la classe "visible" un frame després perquè el navegador
    // pugui animar la transició en lloc d'aplicar-la instantàniament.
    requestAnimationFrame(() => {
        popup.classList.add("corrector-popup-visible");
    });

    activePopup = popup;

}