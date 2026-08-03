const dictionary = {
    "Aixo": "Això",
    "provaa": "prova",
    "cotxee": "cotxe",
    "adioos": "adéu"
};

function checkText(text) {

    const words = text.split(/\s+/);

    words.forEach(word => {

        const cleanWord = word.replace(/[.,!?;:()]/g, "");

        if (dictionary[cleanWord]) {
            console.log(
                `❌ ${cleanWord} → ✅ ${dictionary[cleanWord]}`
            );
        }

    });

}

document.addEventListener("input", (event) => {

    if (event.target.tagName === "TEXTAREA") {

        checkText(event.target.value);

    }

    if (event.target.isContentEditable) {

        checkText(event.target.innerText);

    }

});