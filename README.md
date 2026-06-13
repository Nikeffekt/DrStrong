# Stronger

> Evidenzbasierte Supplement-Empfehlungen, getrieben von KI.

Stronger ist eine Web-App, die personalisierte Nahrungsergänzungs-Empfehlungen
auf wissenschaftlicher Basis bietet. Die App nutzt eine kuratierte Wissensbasis
mit 25 Wirkstoffen, eine KI-gestützte Beratung und einen Empfehlungs-Algorithmus,
der Quiz-Antworten in einen passenden Supplement-Stack übersetzt.

---

## 🎯 Projektstand

Diese Version (v3) ist ein frischer Start mit "Dark Lab Aesthetic" Design,
inspiriert von einem Doctor-Strong-Konzept.

**Was funktioniert:**
- ✅ Linke Sidebar mit 5 Hauptbereichen (Profil, Quiz, Stack, Wissen, Shop)
- ✅ Bottom-Leiste mit 11 USPs (smooth scrollbar, Mausrad + Touch + Trackpad)
- ✅ Modulare Code-Struktur, vorbereitet auf Wachstum
- ✅ Daten-Loader für zentrale Wissensbasis und einzelne Wirkstoff-Dateien

**Was als Nächstes kommt:**
- ⏳ Daten-Dateien aus altem Repo kopieren (wirkstoffe-wissen.json, produkte.json, wirkstoffe/*.json)
- ⏳ Doctor-Strong-Charakter als zentrales Bild
- ⏳ KI-Chat-Integration
- ⏳ Echte Screens (Profil, Quiz, Stack, Wissen, Shop)
- ⏳ Empfehlungs-Engine
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
├── index.html                         App-Einstiegspunkt
├── README.md
├── .gitignore
│
├── scripts/                           Alle JavaScript-Dateien
│   ├── main.js                        Init der App, ruft Module auf
│   ├── state.js                       Globaler App-State
│   ├── navigation.js                  Screen-Wechsel-Logik
│   │
│   ├── core/                          Kernfunktionalität
│   │   ├── konstanten.js              App-weite Konstanten, Mappings
│   │   └── helpers.js                 Generische Utility-Funktionen
│   │
│   ├── data/                          Daten-Loader und -Verwaltung
│   │   ├── produkte-loader.js         Lädt produkte.json
│   │   ├── wirkstoffe-loader.js       Lädt Wirkstoff-Daten (zentral + on-demand)
│   │   └── normalisierung.js          Datenbereinigung
│   │
│   ├── engine/                        Empfehlungs-Logik (kommt)
│   ├── screens/                       Logik pro Screen (kommt)
│   ├── chat/                          KI-Chat-Module (kommt)
│   │
│   └── ui/                            UI-Komponenten und Interaktionen
│       ├── sidebar.js                 Sidebar-Klick-Handler
│       └── usp-bar.js                 USP-Leiste Scroll-Verhalten
│
├── styles/                            CSS modular (alle via @import in main.css)
│   ├── main.css                       Sammeldatei
│   │
│   ├── base/                          Foundation
│   │   ├── tokens.css                 Design-Variablen
│   │   ├── reset.css                  Reset & Body
│   │   ├── fonts.css                  Font-Definitionen (Platzhalter)
│   │   └── animations.css             Globale Keyframes
│   │
│   ├── layout/                        Layout-Strukturen
│   │   ├── app.css                    App-Grid
│   │   ├── sidebar.css                Sidebar
│   │   ├── content.css                Content-Bereich
│   │   └── usp-bar.css                USP-Leiste
│   │
│   ├── components/                    Wiederverwendbare UI-Elemente
│   │   └── nav-item.css               Nav-Item-Komponente
│   │
│   ├── screens/                       Pro Screen ein File (kommt)
│   └── chat/                          KI-Chat-Styles (kommt)
│
├── data/                              Daten (JSON)
│   ├── wirkstoffe-wissen.json         Wissensbasis (zentrale Übersicht)
│   ├── produkte.json                  Produkt-Datenbank
│   │
│   ├── wirkstoffe/                    Detail-Dateien pro Wirkstoff
│   │   ├── kreatin.json               (kopieren aus altem Repo)
│   │   ├── magnesium.json
│   │   └── ...
│   │
│   ├── meta/                          Metadaten und Mappings (kommen)
│   └── schemas/                       JSON-Schemas zur Dokumentation
│
└── assets/
    ├── images/
    │   ├── banner/
    │   └── icons/
    └── fonts/                         Lokale Fonts (falls gewünscht)
```

---

## 📦 Daten kopieren aus altem Repo

Bevor die App ohne Warnungen läuft, müssen die Daten ins neue Repo:

1. **`data/wirkstoffe-wissen.json`** – Zentrale Wissensbasis
2. **`data/produkte.json`** – Produkt-Datenbank
3. **`data/wirkstoffe/*.json`** – Einzelne Wirkstoff-Detail-Dateien (Kreatin, Magnesium, etc.)

Solange die Dateien fehlen, gibt's `console.warn`-Meldungen, aber die App
crasht nicht.

---

## 🎨 Design-System

Alle Design-Variablen sind in `styles/base/tokens.css` zentralisiert.

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

- **Space Grotesk** (Display) — Logo, Headlines
- **Inter** (Body) — Fließtext
- **JetBrains Mono** (Mono) — Captions, Status

---

## 🔧 Script-Ladereihenfolge

In `index.html` werden die Skripte in dieser Reihenfolge geladen:

```
1. core/konstanten.js + helpers.js
2. state.js
3. data/normalisierung.js + produkte-loader.js + wirkstoffe-loader.js
4. ui/sidebar.js + usp-bar.js
5. navigation.js
6. main.js (ruft alle init() auf)
```

Jedes Modul exportiert ein Objekt auf `window` (z.B. `window.Sidebar`) mit
einer `init()`-Methode. `main.js` ruft die Inits beim Laden auf.

---

## 🤖 KI-Integration (geplant)

Die App wird Claude (Anthropic) als KI-Berater nutzen. Anbindung über
Cloudflare Worker:

- Proxy URL: `https://stronger-proxy.stronger-supplements.workers.dev`
- Module sind vorbereitet in `scripts/chat/`:
  - `ki-chat.js` (Chat-Logik)
  - `ki-keywords.js` (Wirkstoff-/Themen-Erkennung)
  - `ki-context-loader.js` (Smart Context Loading)
  - `ki-system-prompt.js` (System-Prompt-Aufbau)
  - `ki-markdown.js` (Markdown-Rendering)

---

## 📝 Nächste Schritte

1. **Daten aus altem Repo kopieren** (wirkstoffe-wissen.json, produkte.json, wirkstoffe/*.json)
2. **Doctor-Strong-Charakter einbauen**
3. **KI-Chat aktivieren**
4. **Profil-Screen bauen**
5. **Quiz-Screen bauen** (Empfehlungs-Algorithmus)
6. **Stack-Screen bauen**
7. **Wissen-Screen** (Wirkstoff-Detail-Dateien anzeigen)
8. **Shop-Screen**
9. **Supabase-Integration**

---

## 👤 Autor

Niko Schubert · 2026

---

## 📄 Lizenz

Privat. Alle Rechte vorbehalten.
