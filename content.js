document.querySelectorAll("textarea").forEach(initTextarea);

function initTextarea(textarea) {

    if (textarea.dataset.correctorInitialized) return;
    textarea.dataset.correctorInitialized = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "corrector-wrapper";

    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(textarea);

    const overlay = document.createElement("div");
    overlay.className = "corrector-overlay";

    wrapper.insertBefore(overlay, textarea);

    syncOverlay(textarea, overlay);

    textarea.addEventListener("input", () => {

        const errors = findErrors(textarea.value);

        console.log(errors);

        if (errors.length > 0) {

            errors.forEach(error => {

                const coords = getCaretCoordinates(textarea, error.start);

                console.log(error.wrong, coords);

            });

        }

        syncOverlay(textarea, overlay);

    });

    textarea.addEventListener("scroll", () => {

        overlay.scrollTop = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;

    });

}

function findErrors(text) {

    const errors = [];

    Object.entries(dictionary).forEach(([wrong, correct]) => {

        const regex = new RegExp(`\\b${wrong}\\b`, "g");

        let match;

        while ((match = regex.exec(text)) !== null) {

            errors.push({
                wrong,
                correct,
                start: match.index,
                end: match.index + wrong.length
            });

        }

    });

    return errors.sort((a, b) => a.start - b.start);

}