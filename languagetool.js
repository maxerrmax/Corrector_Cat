const LANGUAGETOOL_ENDPOINT = "https://api.languagetool.org/v2/check";
const LANGUAGETOOL_LANGUAGE = "ca-ES";

// Crida l'API de LanguageTool i retorna els errors ja mapejats al mateix
// format que fa servir findErrors() del diccionari:
// { start, end, wrong, correct, suggestions, message, source }
//
// De moment és una funció "solta" -- encara no està connectada a cap
// event ni fa debounce (això arriba al Dia 3). Aquí només volem
// confirmar que la crida i el mapeig funcionen correctament.
async function checkWithLanguageTool(text) {

    if (!text || !text.trim()) return [];

    const body = new URLSearchParams();
    body.set("text", text);
    body.set("language", LANGUAGETOOL_LANGUAGE);

    let response;

    try {

        response = await fetch(LANGUAGETOOL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString()
        });

    } catch (err) {

        // Error de xarxa (sense connexió, domini bloquejat, etc.)
        console.warn("LanguageTool: error de xarxa", err);
        return [];

    }

    if (!response.ok) {
        console.warn("LanguageTool: resposta no OK", response.status);
        return [];
    }

    let data;

    try {
        data = await response.json();
    } catch (err) {
        console.warn("LanguageTool: resposta no és JSON vàlid", err);
        return [];
    }

    if (!data.matches) return [];

    return data.matches

        // De moment descartem els avisos sense cap substitució concreta
        // (el nostre popup necessita alguna cosa aplicable per clicar).
        .filter(match => match.replacements && match.replacements.length > 0)

        .map(match => {

            const suggestions = match.replacements.map(r => r.value);

            return {
                start: match.offset,
                end: match.offset + match.length,
                wrong: text.slice(match.offset, match.offset + match.length),
                correct: suggestions[0],
                suggestions,
                message: match.message,
                source: "languagetool"
            };

        });

}