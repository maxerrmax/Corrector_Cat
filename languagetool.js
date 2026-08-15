const LANGUAGETOOL_ENDPOINT = "https://api.languagetool.org/v2/check";
const LANGUAGETOOL_LANGUAGE = "ca-ES";
const LANGUAGETOOL_TIMEOUT_MS = 8000;

// Marge de seguretat per sota del límit real de l'API pública (20/min).
// NOTA: aquest comptador és per pestanya/instància del content script,
// no es comparteix entre pestanyes obertes -- és una protecció local,
// no una garantia absoluta de respectar el límit global de l'API.
const LANGUAGETOOL_MAX_REQUESTS_PER_MINUTE = 15;
const LANGUAGETOOL_RATE_WINDOW_MS = 60 * 1000;
const languageToolRequestTimestamps = [];

const LANGUAGETOOL_CACHE_MAX_ENTRIES = 50;
const languageToolCache = new Map();

function canMakeLanguageToolRequest() {

    const now = Date.now();

    while (
        languageToolRequestTimestamps.length > 0 &&
        now - languageToolRequestTimestamps[0] > LANGUAGETOOL_RATE_WINDOW_MS
    ) {
        languageToolRequestTimestamps.shift();
    }

    return languageToolRequestTimestamps.length < LANGUAGETOOL_MAX_REQUESTS_PER_MINUTE;

}

function recordLanguageToolRequest() {
    languageToolRequestTimestamps.push(Date.now());
}

function getCachedLanguageToolResult(text) {
    return languageToolCache.has(text) ? languageToolCache.get(text) : undefined;
}

function setCachedLanguageToolResult(text, result) {

    if (languageToolCache.size >= LANGUAGETOOL_CACHE_MAX_ENTRIES) {
        // Eliminem l'entrada més antiga (Map manté l'ordre d'inserció).
        const oldestKey = languageToolCache.keys().next().value;
        languageToolCache.delete(oldestKey);
    }

    languageToolCache.set(text, result);

}

// Crida l'API de LanguageTool i retorna els errors ja mapejats al format
// que fa servir la resta del projecte:
// { start, end, wrong, correct, suggestions, message, source }
async function checkWithLanguageTool(text) {

    if (!text || !text.trim()) return [];

    const cached = getCachedLanguageToolResult(text);
    if (cached !== undefined) return cached;

    if (!canMakeLanguageToolRequest()) {
        console.warn("LanguageTool: límit de peticions per minut assolit, s'omet aquesta comprovació.");
        return [];
    }

    const body = new URLSearchParams();
    body.set("text", text);
    body.set("language", LANGUAGETOOL_LANGUAGE);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LANGUAGETOOL_TIMEOUT_MS);

    let response;

    try {

        recordLanguageToolRequest();

        response = await fetch(LANGUAGETOOL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
            signal: controller.signal
        });

    } catch (err) {

        if (err.name === "AbortError") {
            console.warn("LanguageTool: la petició ha trigat massa i s'ha cancel·lat.");
        } else {
            console.warn("LanguageTool: error de xarxa", err);
        }

        return [];

    } finally {

        clearTimeout(timeoutId);

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

    const errors = data.matches

        // Descartem els avisos sense cap substitució concreta (el nostre
        // popup necessita alguna cosa aplicable per clicar).
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

    setCachedLanguageToolResult(text, errors);

    return errors;

}