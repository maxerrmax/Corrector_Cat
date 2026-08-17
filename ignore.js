// Errors que l'usuari ha decidit ignorar. Viu només mentre la pestanya
// és oberta -- es reinicia en recarregar la pàgina (no persisteix).
const ignoredErrorKeys = new Set();

// Identifiquem un error per paraula + regla de LanguageTool (no per
// posició exacta), perquè ignorar-lo un cop l'ignori a totes les
// ocurrències d'aquella mateixa combinació, no només aquella posició.
function ignoreKeyFor(error) {
    return `${error.ruleId || ""}:::${error.wrong}`;
}

function isErrorIgnored(error) {
    const result = ignoredErrorKeys.has(ignoreKeyFor(error));
    return result;
}

function ignoreError(error) {
    ignoredErrorKeys.add(ignoreKeyFor(error));
}