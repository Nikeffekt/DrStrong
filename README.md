# Stronger

> Evidenzbasierte Supplement-Empfehlungen, getrieben von KI.

Stronger ist eine Web-App, die personalisierte Nahrungsergänzungs-Empfehlungen
auf wissenschaftlicher Basis bietet. Die App nutzt eine kuratierte Wissensbasis
mit 25 Wirkstoffen, eine KI-gestützte Beratung (Claude/Anthropic) und einen
Empfehlungs-Algorithmus, der Quiz-Antworten in einen passenden Supplement-Stack
übersetzt.

---

## 🎯 Projektstand

Diese Version ("Dr.Strong") ist ein frischer Start mit Dark Lab Aesthetic
Design und einer modularen Code-Struktur.

**Was funktioniert:**
- ✅ Linke Sidebar mit 5 Hauptbereichen (Profil, Quiz, Stack, Wissen, Shop)
- ✅ Bottom-Leiste mit 11 USPs (smooth scrollbar)
- ✅ Modulare Code-Struktur (IIFE-Pattern)
- ✅ Daten-Loader für Wissensbasis und einzelne Wirkstoff-Dateien
- ✅ Wissensbasis und Produktdaten geladen

**Was ALS REFERENZ schon im Repo liegt (Code aus altem Projekt, integration nötig):**

*Engine (Empfehlungs-Logik):*
- 📦 `scripts/engine/empfehlungen.js` – Stack-Berechnung aus Quiz-Antworten
- 📦 `scripts/engine/overlaps.js` – Doppel-Erkennung (z.B. Multi + Einzel-Vitamine)
- 📦 `scripts/engine/personalisierung.js` – Profil-basierte Alternativ-Auswahl

*Screens (Quiz + Profil):*
- 📦 `scripts/screens/quiz.js` – komplette Quiz-Logik
- 📦 `scripts/screens/profil.js` – Profil-Screen mit Stack-Anzeige
- 📦 `styles/screens/quiz.css` – Quiz-Styles (altes Design)
- 📦 `styles/screens/profil.css` – Profil-Styles (altes Design)

*KI:*
- 📦 `scripts/chat/ki-chat.js` – KI-Chat-Logik
- 📦 `scripts/chat/ki-system-prompt.js` – System-Prompt-Aufbau
- 📦 `styles/chat/ki-chat.css` – Chat-Styles (altes Design)

Diese Dateien sind aktiv aus dem alten Projekt übernommen und funktionieren
**eigenständig**, aber sie sind noch **nicht ins v3-System integriert**. Sie
müssen Stück für Stück zu IIFE-Modulen umgebaut und an das v3-Design
angepasst werden.

**Wichtig:** Die Engine-Logik (Quiz → Stack) ist **funktional** und basiert
auf der vorhandenen Wissensbasis. Die wird nicht weggeworfen, sondern in v3
integriert.

**Was als Nächstes kommt:**
- ⏳ Doctor-Strong-Charakter als zentrales Bild
- ⏳ KI-Chat in v3 integrieren
- ⏳ Quiz-Screen ins v3-Design migrieren (Logik aus quiz.js übernehmen)
- ⏳ Profil-Screen ins v3-Design migrieren (Logik aus profil.js übernehmen)
- ⏳ Engine-Module zu IIFE umbauen und einbinden
- ⏳ Supabase-Integration

---

## 🚀 Lokal starten

```bash
cd stronger
python3 -m http.server 8080
```

Browser: <http://localhost:8080>

---

## 📁 Projektstruktur

```
stronger/
├── index.html
├── README.md
├── .gitignore
│
├── scripts/                           Alle JavaScript-Dateien
│   ├── main.js                        Init der App, ruft Module auf
│   ├── state.js                       Globaler App-State
│   ├── navigation.js                  Screen-Wechsel-Logik
│   │
│   ├── core/                          Kernfunktionalität
│   │   ├── konstanten.js
│   │   └── helpers.js
│   │
│   ├── data/                          Daten-Loader
│   │   ├── produkte-loader.js
│   │   ├── wirkstoffe-loader.js
│   │   └── normalisierung.js
│   │
│   ├── engine/                        (leer, kommt – KI-getrieben)
│   │
│   ├── ui/                            UI-Module
│   │   ├── sidebar.js
│   │   └── usp-bar.js
│   │
│   ├── screens/                       (leer, kommt)
│   │
│   └── chat/                          ⚠️ ALTE KI-MODULE (refactoring nötig)
│       ├── ki-chat.js
│       └── ki-system-prompt.js
│
├── styles/                            CSS modular (via @import in main.css)
│   ├── main.css
│   │
│   ├── base/
│   │   ├── tokens.css
│   │   ├── reset.css
│   │   ├── fonts.css
│   │   └── animations.css
│   │
│   ├── layout/
│   │   ├── app.css
│   │   ├── sidebar.css
│   │   ├── content.css
│   │   └── usp-bar.css
│   │
│   ├── components/
│   │   └── nav-item.css
│   │
│   ├── screens/                       (leer, kommt)
│   │
│   └── chat/                          ⚠️ ALTES KI-STYLING (anpassung nötig)
│       └── ki-chat.css
│
├── data/                              Daten (JSON)
│   ├── wirkstoffe-wissen.json         Wissensbasis (25 Wirkstoffe)
│   ├── produkte.json                  Produkt-Datenbank
│   │
│   ├── wirkstoffe/                    Detail-Dateien pro Wirkstoff
│   │   └── (kopierst du aus altem Repo)
│   │
│   ├── meta/                          (leer, kommt)
│   │
│   └── schemas/
│       └── wirkstoffe-wissen-SCHEMA.md  Schema-Dokumentation
│
└── assets/
    ├── images/
    │   ├── banner/                    Banner-Bilder (für später)
    │   │   ├── banner1.jpg
    │   │   ├── banner2.jpg
    │   │   ├── banner3.jpg
    │   │   └── banner4.jpg
    │   └── icons/                     (leer)
    └── fonts/                         (leer)
```

---

## 🔧 Refactoring-Plan

Die Dateien in `scripts/chat/` sind aus dem alten Projekt übernommen und nutzen
**globale Funktionen** statt das IIFE-Module-Pattern von v3.

**Status:** Funktional als Referenz, aber **noch nicht aktiv eingebunden** in `index.html`.

### Wenn ein Modul refactored wird:

1. Datei zu IIFE-Pattern umbauen:
   ```javascript
   window.KiChat = (function () {
     'use strict';
     // ... Logik ...
     return { init: init, senden: senden };
   })();
   ```

2. Script-Tag in `index.html` aktivieren

3. In `main.js` den Init-Aufruf ergänzen

4. Testen, dass die Logik weiterhin funktioniert

### Hinweis zur Empfehlungs-Engine

Die klassische Empfehlungs-Engine (Quiz → Algorithmus → Stack) aus dem alten
Projekt wird in v3 nicht übernommen. Stattdessen soll die KI die Empfehlungen
direkt aus dem Chat-Dialog heraus generieren. Saubererer Ansatz, bessere
Anpassung an die Wissensbasis.

---

## 🎨 Design-System

Alle Design-Variablen in `styles/base/tokens.css`.

### Farbpalette

| Token              | Wert                       | Verwendung                 |
|--------------------|----------------------------|----------------------------|
| `--bg-deepest`     | `#060809`                  | Tiefster Hintergrund       |
| `--bg-base`        | `#0A0F0A`                  | App-Hintergrund            |
| `--bg-sidebar`     | `#0D1410`                  | Sidebar, USP-Bar           |
| `--bg-elevated`    | `#131A14`                  | Karten, Panels             |
| `--mint`           | `#4ADE80`                  | Hauptakzent                |
| `--text-1`         | `#E8EDE8`                  | Primärtext                 |
| `--text-2`         | `rgba(232,237,232,0.6)`    | Sekundärtext               |
| `--text-3`         | `rgba(232,237,232,0.32)`   | Tertiärtext (Captions)     |

### Schriften

- **Space Grotesk** — Display (Logo, Headlines)
- **Inter** — Body (Fließtext)
- **JetBrains Mono** — Captions, Status

---

## 🤖 KI-Integration

Cloudflare Worker als Proxy zur Anthropic API:

- **Proxy URL:** `https://stronger-proxy.stronger-supplements.workers.dev`
- **Konfiguriert in:** `scripts/core/konstanten.js`

Aktuell vorhanden:
- `scripts/chat/ki-chat.js` – Chat-Logik (alt, refactoring nötig)
- `scripts/chat/ki-system-prompt.js` – System-Prompt mit Wissensbasis

Noch fehlend (aus bot-upgrade-v2 zu kopieren):
- `ki-keywords.js` – Wirkstoff-/Themen-Erkennung
- `ki-context-loader.js` – Smart Context Loading
- `ki-markdown.js` – Markdown-Rendering der Bot-Antworten

---

## 📝 Nächste Schritte

1. **Wirkstoff-Detail-Dateien kopieren** in `data/wirkstoffe/` (kreatin.json, magnesium.json, etc.)
2. **Doctor-Strong-Charakter einbauen** als zentrales Bild
3. **KI-Chat aktivieren** (ki-chat.js refactoren und einbinden)
4. **Profil-Screen** als ersten echten Screen bauen
5. **KI-gestützte Empfehlungs-Logik** entwickeln (statt klassische Engine)
6. **Wissen-Screen** (Wirkstoff-Detail-Dateien anzeigen)
7. **Supabase-Integration** (User-Accounts, Persistierung)

---

## 👤 Autor

Niko Schubert · 2026

---

## 📄 Lizenz

Privat. Alle Rechte vorbehalten.
