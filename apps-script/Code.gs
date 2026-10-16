/**
 * Escape-Room – Backend (Google Apps Script, bereitgestellt als Web App)
 *
 * Erwartete Tabs im Google Sheet:
 *   codes:  room | code           (eine Zeile pro Raum)
 *   state:  current_room | locked (Werte in Zeile 2)
 *
 * Aufruf (nur GET):
 *   ?action=state                    → aktueller Stand (ohne Codes)
 *   ?action=check&code=XXX[&room=N]  → Code für den aktuellen Raum prüfen
 *   ?action=unlock                   → Sperre aufheben
 *   ?action=reset                    → Spiel zurücksetzen
 *
 * Die Codes verlassen dieses Skript nie – sie werden nur hier verglichen.
 */

const CODES_SHEET = 'codes';
const STATE_SHEET = 'state';

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || 'state').trim().toLowerCase();

  // Verhindert, dass sich gleichzeitige Anfragen gegenseitig überschreiben.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return respond_({ ok: false, error: 'Server ausgelastet, bitte erneut versuchen.' });
  }

  try {
    switch (action) {
      case 'state':
        return respond_(publicState_(readState_()));
      case 'check':
        return respond_(checkCode_(params.code, params.room));
      case 'unlock':
        writeState_({ locked: 0 });
        return respond_(publicState_(readState_()));
      case 'reset':
        writeState_({ current_room: 1, locked: 0 });
        return respond_(publicState_(readState_()));
      default:
        return respond_({ ok: false, error: 'Unbekannte Aktion: ' + action });
    }
  } catch (err) {
    return respond_({ ok: false, error: String((err && err.message) || err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Prüft einen Code gegen den aktuellen Raum.
 * result: 'correct' | 'wrong' | 'locked' | 'finished' | 'stale'
 */
function checkCode_(rawCode, rawRoom) {
  const state = readState_();

  if (state.locked) return withResult_(state, 'locked');
  if (state.current_room > countRooms_()) return withResult_(state, 'finished');

  // Der Browser schickt mit, für welchen Raum er den Code hält. Passt das nicht
  // (z. B. doppelt abgeschickt oder zwischendurch zurückgesetzt), wird nicht geprüft.
  if (rawRoom !== undefined && rawRoom !== '' && Number(rawRoom) !== state.current_room) {
    return withResult_(state, 'stale');
  }

  const input = normalize_(rawCode);
  if (!input) return { ok: false, error: 'Kein Code übermittelt.' };

  const expected = readCodes_()[state.current_room];
  if (!expected) {
    throw new Error('Kein Code für Raum ' + state.current_room + ' im Tab "' + CODES_SHEET + '".');
  }

  if (input === expected) {
    state.current_room += 1;
    writeState_({ current_room: state.current_room });
    return withResult_(state, 'correct');
  }

  state.locked = 1;
  writeState_({ locked: 1 });
  return withResult_(state, 'wrong');
}

// ---------- Sheet-Zugriff ----------

function sheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Tab "' + name + '" fehlt im Google Sheet.');
  return sh;
}

/** Liefert { spaltenname: spaltennummer } anhand der Kopfzeile. */
function headerColumns_(sh, names) {
  const lastCol = sh.getLastColumn();
  const header = lastCol > 0
    ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); })
    : [];
  const cols = {};
  names.forEach(function (name) {
    const idx = header.indexOf(name);
    if (idx < 0) throw new Error('Spalte "' + name + '" fehlt im Tab "' + sh.getName() + '".');
    cols[name] = idx + 1;
  });
  return cols;
}

function readState_() {
  const sh = sheet_(STATE_SHEET);
  const cols = headerColumns_(sh, ['current_room', 'locked']);
  const room = Number(sh.getRange(2, cols.current_room).getValue()) || 1;
  const locked = Number(sh.getRange(2, cols.locked).getValue()) === 1 ? 1 : 0;
  return { current_room: room, locked: locked };
}

function writeState_(changes) {
  const sh = sheet_(STATE_SHEET);
  const cols = headerColumns_(sh, ['current_room', 'locked']);
  Object.keys(changes).forEach(function (key) {
    sh.getRange(2, cols[key]).setValue(changes[key]);
  });
  SpreadsheetApp.flush();
}

/** { raumnummer: CODE } – wird nur intern zum Vergleichen genutzt. */
function readCodes_() {
  const sh = sheet_(CODES_SHEET);
  const cols = headerColumns_(sh, ['room', 'code']);
  const rows = sh.getDataRange().getValues().slice(1);
  const codes = {};
  rows.forEach(function (row) {
    const room = Number(row[cols.room - 1]);
    const code = normalize_(row[cols.code - 1]);
    if (room && code) codes[room] = code;
  });
  return codes;
}

function countRooms_() {
  return Object.keys(readCodes_()).length;
}

// ---------- Hilfsfunktionen ----------

/** Großschreibung egal, Leerzeichen entfernen. */
function normalize_(value) {
  return String(value == null ? '' : value).toUpperCase().replace(/\s+/g, '');
}

function publicState_(state) {
  const rooms = countRooms_();
  return {
    ok: true,
    current_room: state.current_room,
    locked: state.locked,
    rooms: rooms,
    finished: state.current_room > rooms,
  };
}

function withResult_(state, result) {
  const out = publicState_(state);
  out.result = result;
  return out;
}

function respond_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
