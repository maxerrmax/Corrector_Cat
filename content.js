console.log("AI Corrector extension loaded!");

document.addEventListener("input", (event) => {
    const element = event.target;

    // textarea
    if (element.tagName === "TEXTAREA") {
        console.log("TEXTAREA:", element.value);
    }

    // contenteditable
    if (element.isContentEditable) {
        console.log("CONTENTEDITABLE:", element.innerText);
    }
});