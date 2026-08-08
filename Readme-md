# Corrector Català

Extensió de Chrome que detecta castellanismes i barbarismes habituals mentre
escrius, i mostra un subratllat vermell amb un suggerement de correcció —
similar a un corrector ortogràfic bàsic, però centrat en interferències del
castellà cap al català.

## Estat actual: MVP

Aquesta és una primera versió funcional. El motor de detecció es basa en un
**diccionari de paraules** (no és encara un model d'IA ni analitza gramàtica
o context), així que detecta paraules soltes que són castellanismes clars,
però no errors de concordança, estil o sintaxi.

## Funcionalitats

- Detecció en temps real mentre escrius.
- Funciona a `<textarea>` i a qualsevol element `contenteditable` (editors de
  Gmail, formularis, CMS, etc.).
- Subratllat vermell sota la paraula incorrecta.
- Clic sobre el subratllat → popup amb el suggeriment → clic per aplicar la
  correcció automàticament.
- Detecta elements que apareixen dinàmicament a la pàgina (SPA, editors que
  carreguen contingut més tard).

## Limitacions conegudes

- **No funciona a Google Docs, Word Online ni editors similars basats en
  canvas** (no hi ha text real accessible al DOM). Per donar-hi suport caldria
  una integració diferent via l'API oficial de Google Docs.
- No detecta errors de concordança, conjugació ni sintaxi — només paraules
  soltes presents al diccionari.
- El diccionari és manual i limitat; és fàcil que hi hagi castellanismes
  habituals que encara no detecti.

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
dictionary.js      Diccionari de castellanismes → correcció en català
content.js         Lògica per a <textarea>: detecció i gestió d'events
mirror.js          Calcula la posició (x, y) de cada caràcter dins d'un textarea
overlay.js         Dibuixa i posiciona els subratllats sobre el textarea
editable.js         Detecció i subratllat per a elements contenteditable
suggestions.js     Popup de suggeriments, compartit entre textarea i contenteditable
style.css          Estils de l'overlay, els subratllats i el popup
icons/             Icones de l'extensió (16/32/48/128 px)
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
- **`suggestions.js`** és independent de com s'ha dibuixat el subratllat:
  només necessita un `error` (paraula incorrecta + correcció) i una funció
  `onApply` que sap com aplicar el canvi a cada tipus de camp.

## Propers passos

- [ ] Ampliar el diccionari amb més castellanismes/barbarismes.
- [ ] Substituir (o complementar) el diccionari per un motor de detecció
      més avançat (model de llenguatge / anàlisi gramatical).
- [ ] Opció per ignorar/descartar un avís sense aplicar-lo.
- [ ] Suport per a Google Docs via la Docs API (fora de l'abast del content
      script actual).
- [ ] Neteja de listeners quan un element s'elimina del DOM.

## Llicència

Pendent de decidir.