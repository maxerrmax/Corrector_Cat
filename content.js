const textareas = document.querySelectorAll("textarea");
const editables = document.querySelectorAll("[contenteditable='true']");

const elements = [...textareas, ...editables];

elements.forEach(element => {

    element.addEventListener("input", () => {

        const text = getText(element);

        const errors = findErrors(text);

        console.log(errors);

    });

});

function getText(element) {

    if (element.tagName.toLowerCase() === "textarea") {
        return element.value;
    }

    return element.innerText;
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