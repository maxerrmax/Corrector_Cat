# Corrector Català

Extensió de Chrome que detecta errors gramaticals i ortogràfics en català
mentre escrius, i mostra un subratllat vermell amb un suggeriment de
correcció. La detecció es fa amb [LanguageTool](https://languagetool.org),
un motor de correcció obert i mantingut activament, amb un conjunt extens
de regles específiques per al català.

## Estat actual:

Versió funcional amb LanguageTool com a únic motor de detecció. Una primera
versió feia servir un diccionari propi de castellanismes com a resposta
instantània, però es va eliminar en favor de LanguageTool un cop es va
confirmar que cobria els mateixos casos amb més precisió i sense mantenir
un diccionari manual a part.

## Funcionalitats

- Detecció mentre escrius, amb un petit retard ("debounce" d'uns 500ms
  després de parar d'escriure, per no saturar l'API).
- Funciona a `<textarea>` i a qualsevol element `contenteditable` (editors
  de Gmail, formularis, CMS, etc.).
- Subratllat vermell sota el tram de text amb error, amb un lleuger efecte
  en passar-hi el ratolí per sobre per indicar que és clicable.
- Clic sobre el subratllat → popup amb el missatge d'explicació i tots els
  suggeriments de LanguageTool (no només el primer) → clic per aplicar-lo.
- **Ignorar un avís**: botó al popup per descartar un error concret; deixa
  de subratllar-se a totes les ocurrències d'aquella mateixa paraula/regla
  a partir d'aquell moment (viu només mentre la pestanya és oberta, no es
  desa entre sessions).
- El popup s'ajusta automàticament si sortiria tallat per la vora de la
  finestra, i apareix amb una petita transició en lloc de sec.
- Cache local i límit propi de peticions per minut, per no saturar l'API
  pública de LanguageTool.
- Detecta elements que apareixen dinàmicament a la pàgina (SPA, editors que
  carreguen contingut més tard).

## Limitacions conegudes

- **No funciona a Google Docs, Word Online ni editors similars basats en
  canvas** (no hi ha text real accessible al DOM). Per donar-hi suport
  caldria una integració diferent via l'API oficial de Google Docs.
- Depèn de connexió a internet i de la disponibilitat de l'API pública de
  LanguageTool (`api.languagetool.org`) — sense connexió, no hi ha detecció.
- El primer subratllat de qualsevol frase triga el temps del debounce més
  la latència de xarxa (no és instantani, com sí que ho era el diccionari
  antic).
- El límit de peticions per minut es porta per pestanya, no compartit entre
  totes les pestanyes obertes — en ús normal no hauria de notar-se.
- Els avisos ignorats no persisteixen: en recarregar la pàgina, tornen a
  aparèixer.

## Instal·lació (mode desenvolupador)

1. Obre `chrome://extensions` al navegador.
2. Activa el **Mode desenvolupador** (interruptor a dalt a la dreta).
3. Clica **Carrega l'extensió sense empaquetar** (*Load unpacked*).
4. Selecciona la carpeta d'aquest projecte.
5. Per poder provar-la en fitxers locals (`file://`), entra als **Detalls**
   de l'extensió i activa **Permet l'accés a les URL de fitxers**.

## Estructura del projecte

```
manifest.json     Configuració de l'extensió (Manifest V3)
languagetool.js   Crida a l'API de LanguageTool, amb cache, timeout i throttling
ignore.js         Gestió dels avisos ignorats per l'usuari (en memòria)
content.js        Lògica per a <textarea>: debounce i gestió d'events
mirror.js         Calcula la posició (x, y) de cada caràcter dins d'un textarea
overlay.js        Dibuixa i posiciona els subratllats sobre el textarea
editable.js       Detecció i subratllat per a elements contenteditable
suggestions.js    Popup de suggeriments (amb ignorar), compartit entre textarea i contenteditable
style.css         Estils de l'overlay, els subratllats i el popup
icons/            Icones de l'extensió (16/32/48/128 px)
```

## Com funciona (resum tècnic)

- **`textarea`**: com que el text d'un `<textarea>` no és accessible via
  posicions de píxel de manera nativa, es fa servir un element "mirall"
  invisible (`mirror.js`) amb els mateixos estils, per calcular on cau
  exactament cada caràcter. Un `<div>` transparent superposat (`overlay.js`)
  dibuixa els subratllats en aquesta posició.
- **`contenteditable`**: com que el text ja és directament al DOM, es fa
  servir l'API natiu `Range` per localitzar-lo i `getClientRects()` per
  obtenir-ne la posició real en pantalla — no cal cap mirall.
- **`languagetool.js`** és independent de com es dibuixa el subratllat:
  rep un text pla i retorna errors en un format comú
  (`{ start, end, wrong, correct, suggestions, message, ruleId }`), que
  tant `content.js` com `editable.js` saben pintar.
- **`ignore.js`** identifica cada error per la combinació `ruleId + wrong`
  (no per posició exacta), perquè ignorar-lo un cop l'ignori a totes les
  ocurrències d'aquella mateixa combinació dins del mateix text.
- **`suggestions.js`** tampoc sap res de `textarea` ni `contenteditable`:
  només necessita un `error` i dues funcions (`onApply`, `onIgnore`) que
  saben com aplicar el canvi o marcar-lo com a ignorat a cada tipus de camp.

## Propers passos

- [ ] Persistir els avisos ignorats entre sessions (per exemple amb
      `chrome.storage`), no només en memòria.
- [ ] Suport per a Google Docs via la Docs API (fora de l'abast del content
      script actual).
- [ ] Neteja de listeners quan un element s'elimina del DOM.
- [ ] Autoallotjar LanguageTool si mai cal escalar a molts usuaris.
- [ ] Captures de pantalla reals per a la fitxa de la Chrome Web Store.

## Llicència

Pendent de decidir.