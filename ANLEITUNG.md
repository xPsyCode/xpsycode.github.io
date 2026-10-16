# Escape-Room – Einrichtung Schritt für Schritt

> **Wichtig:** Die Codes stehen **nur** im Google Sheet – niemals in einer Datei in diesem
> Repository. Das Repository ist öffentlich, jede Datei darin kann gelesen werden.

## Was liegt wo?

| Datei | Zweck |
|---|---|
| `index.html` | Das Spiel (für die Spielerin) |
| `res/admin.html` | Versteckte Admin-Seite (nirgends verlinkt) |
| `config.js` | **Hier kommt die Apps-Script-URL rein** (und die Raumtexte) |
| `css/style.css`, `js/*.js` | Aussehen und Logik |
| `img/` | Hintergrundbilder `room1.jpg`, `room2.jpg`, `room3.jpg`, `end.jpg` |
| `apps-script/Code.gs` | Backend-Code zum Einfügen in Google Apps Script |

Fehlen die Bilder, erscheint automatisch ein dunkler Farbverlauf.
Am besten Bilder im Hochformat, ca. 1080 × 1920 Pixel und unter 500 KB.

---

## 1. Google Sheet anlegen und befüllen

1. Öffne <https://sheets.google.com> und lege eine **leere Tabelle** an (Name egal, z. B. „Escape-Room“).
2. Unten links das erste Tabellenblatt per Doppelklick umbenennen in **`codes`** (genau so, klein geschrieben).
3. In `codes` eintragen:

   | | A | B |
   |---|---|---|
   | **1** | room | code |
   | **2** | 1 | *Code für Raum 1* |
   | **3** | 2 | *Code für Raum 2* |
   | **4** | 3 | *Code für Raum 3* |

   Tipp: Besteht ein Code nur aus Ziffern oder beginnt er mit 0, vorher Spalte B markieren
   und **Format → Zahl → Nur Text** wählen, damit Google nichts „umrechnet“.
4. Unten auf **+** klicken, neues Blatt anlegen und **`state`** nennen. Eintragen:

   | | A | B |
   |---|---|---|
   | **1** | current_room | locked |
   | **2** | 1 | 0 |

## 2. Apps Script einfügen und als Web App bereitstellen

1. In der Tabelle oben im Menü: **Erweiterungen → Apps Script**.
2. Im Editor den vorhandenen Inhalt von `Code.gs` komplett löschen.
3. Den Inhalt der Datei `apps-script/Code.gs` aus diesem Repository hineinkopieren und **speichern** (Disketten-Symbol).
4. Oben rechts **Bereitstellen → Neue Bereitstellung**.
5. Beim Zahnrad neben „Typ auswählen“ **Web-App** wählen.
6. Einstellen:
   - **Ausführen als:** *Ich*
   - **Zugriff:** *Jeder*
7. **Bereitstellen** klicken. Google fragt nach Berechtigungen: Konto wählen →
   bei „Google hat diese App nicht überprüft“ auf **Erweitert → … öffnen (unsicher)** → **Zulassen**.
   (Das ist normal – es ist ja dein eigenes Skript.)
8. Die angezeigte **Web-App-URL** kopieren (endet auf `/exec`).

Test: Die URL im Browser öffnen und `?action=state` anhängen. Du solltest etwas sehen wie
`{"ok":true,"current_room":1,"locked":0,"rooms":3,"finished":false}`.

> Änderst du später den Skript-Code, musst du unter **Bereitstellen → Bereitstellungen verwalten →
> Bearbeiten (Stift) → Version: Neue Version → Bereitstellen** eine neue Version veröffentlichen.
> Die URL bleibt dabei gleich.

## 3. URL in `config.js` eintragen

Öffne `config.js` und ersetze `HIER_DIE_WEB_APP_URL_EINFUEGEN` durch deine URL:

```js
API_URL: 'https://script.google.com/macros/s/AKfy…/exec',
```

Die Anführungszeichen müssen stehen bleiben. Hier kannst du auch Titel und Texte der Räume ändern.

## 4. Auf GitHub hochladen und GitHub Pages aktivieren

1. Alle Dateien dieses Ordners ins Repository hochladen (auf github.com: **Add file → Upload files**,
   Ordner hineinziehen, **Commit changes**). Eigene Hintergrundbilder in den Ordner `img/` legen.
2. Im Repository: **Settings → Pages**.
3. Unter **Build and deployment → Source**: *Deploy from a branch*, Branch **main**, Ordner **/ (root)** → **Save**.
4. Nach 1–2 Minuten ist die Seite erreichbar unter `https://<benutzername>.github.io/`.
   Die Admin-Seite: `https://<benutzername>.github.io/res/admin.html` – Link am besten nur als Lesezeichen auf deinem Handy speichern.

## 5. Auf dem Smartphone testen

Tipp: Lass das Google Sheet während der Tests auf dem Laptop offen – du siehst live, wie sich `state` ändert.

1. **Richtiger Code:** Spiel auf dem Handy öffnen, Code von Raum 1 eingeben → „Öffnen“.
   Es erscheint Raum 2, im Sheet steht `current_room = 2`.
   Prüfe dabei: Fokus springt weiter, Backspace springt zurück, Einfügen eines kopierten Codes füllt alle Felder.
2. **Keine Verbindung:** Flugmodus an, Code abschicken → Hinweis „Keine Internetverbindung“,
   im Sheet ändert sich **nichts**. Flugmodus wieder aus.
3. **Falscher Code:** Absichtlich falschen Code eingeben → Sperr-Meldung.
   Seite neu laden → Sperr-Meldung bleibt. Im Sheet: `locked = 1`.
4. **Freigabe vom zweiten Gerät:** Auf einem anderen Handy/Laptop `…/res/admin.html` öffnen →
   Status „Gesperrt“ → **Freigeben**. Das Spiel-Handy zeigt innerhalb von ca. 15 Sekunden
   (oder sofort nach Neuladen / Zurückwechseln in den Browser) wieder den Raum.
5. **Reset:** Auf der Admin-Seite **Spiel zurücksetzen** → bestätigen. Das Spiel beginnt wieder in Raum 1.

Vor dem echten Spiel: einmal **Spiel zurücksetzen** drücken.

## Hinweise

- Die Admin-Seite ist nur versteckt, nicht passwortgeschützt. Wer die Adresse kennt, kann freigeben oder zurücksetzen –
  die Codes kann aber niemand auslesen, die bleiben im Sheet.
- Fehlermeldung „Tab … fehlt“ oder „Spalte … fehlt“: Namen im Sheet genau prüfen (klein geschrieben, keine Leerzeichen).
- Fehlermeldung „Keine Verbindung zum Server“, obwohl Internet da ist: Bei der Bereitstellung muss
  **Zugriff: Jeder** eingestellt sein, und die URL in `config.js` muss auf `/exec` enden.
