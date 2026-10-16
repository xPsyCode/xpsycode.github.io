(function () {
  const CODE_LENGTH = 6;
  const LOCK_POLL_MS = 15000; // gesperrt: regelmäßig prüfen, ob der Admin freigegeben hat

  const $ = (id) => document.getElementById(id);
  const screens = ['loading', 'room', 'locked', 'end', 'error'];
  const inputs = Array.from(document.querySelectorAll('.code-inputs input'));
  const form = $('code-form');
  const button = $('open-btn');
  const msg = $('msg');

  let state = null;
  let busy = false;
  let pollTimer = null;

  // ---------- Darstellung ----------

  function show(name) {
    screens.forEach((s) => { $('screen-' + s).hidden = s !== name; });
  }

  function setScene(scene) {
    if (document.body.dataset.scene === scene) return;
    document.body.dataset.scene = scene;
    // Hintergrund sanft einblenden
    const bg = document.querySelector('.bg');
    bg.classList.remove('fade');
    void bg.offsetWidth;
    bg.classList.add('fade');
  }

  function setMessage(text, type) {
    msg.textContent = text || '';
    msg.className = 'msg' + (type ? ' msg-' + type : '');
  }

  function render(next) {
    const previousRoom = state && state.current_room;
    state = next;
    stopPolling();

    if (state.locked) {
      setScene('locked');
      show('locked');
      startPolling();
      return;
    }
    if (state.finished) {
      setScene('end');
      show('end');
      return;
    }

    const room = state.current_room;
    const info = (window.CONFIG.ROOMS || [])[room - 1] || { title: 'Raum ' + room, text: '' };
    $('room-eyebrow').textContent = 'Raum ' + room + ' von ' + state.rooms;
    $('room-title').textContent = info.title;
    $('room-text').textContent = info.text;
    if (room !== previousRoom) {
      clearInputs();
      setMessage('');
    }
    setScene('room' + room);
    show('room');
    updateButton();
  }

  function showError(err) {
    stopPolling();
    $('error-text').textContent = window.Api.describe(err);
    show('error');
  }

  // ---------- Laden / Abgleich mit dem Sheet ----------

  async function load(silent) {
    if (busy) return;
    if (!silent) show('loading');
    try {
      render(await window.Api.state());
    } catch (err) {
      if (!silent) showError(err);
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, LOCK_POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  // Beim Zurückkehren in den Tab den Stand neu holen (z. B. nach Freigabe/Reset).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state) load(true);
  });
  window.addEventListener('online', () => {
    if (!$('screen-error').hidden) load(false);
  });
  $('retry-btn').addEventListener('click', () => load(false));

  // ---------- Code-Eingabe ----------

  // Nur Buchstaben und Ziffern, immer groß.
  const sanitize = (text) => String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  function getCode() {
    return inputs.map((i) => i.value).join('');
  }

  function clearInputs() {
    inputs.forEach((i) => { i.value = ''; i.classList.remove('filled'); });
  }

  function updateButton() {
    inputs.forEach((i) => i.classList.toggle('filled', i.value !== ''));
    button.disabled = busy || getCode().length !== CODE_LENGTH;
  }

  // Verteilt Zeichen ab Feld `start` auf die folgenden Felder.
  function fillFrom(start, chars) {
    let index = start;
    for (const ch of chars) {
      if (index >= inputs.length) break;
      inputs[index].value = ch;
      index++;
    }
    const target = inputs[Math.min(index, inputs.length - 1)];
    target.focus();
    updateButton();
  }

  inputs.forEach((input, index) => {
    input.addEventListener('focus', () => input.select());

    input.addEventListener('input', () => {
      const chars = sanitize(input.value);
      if (chars.length === 0) {
        input.value = '';
        updateButton();
        return;
      }
      if (chars.length === 1) {
        input.value = chars;
        if (index < inputs.length - 1) inputs[index + 1].focus();
        updateButton();
        return;
      }
      // Mehrere Zeichen (Autofill, schnelles Tippen, Tastatur-Vorschlag)
      fillFrom(index, chars);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        e.preventDefault();
        const prev = inputs[index - 1];
        prev.value = '';
        prev.focus();
        updateButton();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputs[index - 1].focus();
      } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        e.preventDefault();
        inputs[index + 1].focus();
      } else if (e.key === 'Enter' && button.disabled) {
        e.preventDefault();
        const empty = inputs.find((i) => i.value === '');
        if (empty) empty.focus();
      }
    });

    input.addEventListener('paste', (e) => {
      const text = sanitize((e.clipboardData || window.clipboardData).getData('text'));
      if (!text) return;
      e.preventDefault();
      // Ein kompletter Code wird immer ab dem ersten Feld eingetragen.
      fillFrom(text.length >= CODE_LENGTH ? 0 : index, text);
    });
  });

  // ---------- Abschicken ----------

  function setBusy(value) {
    busy = value;
    button.classList.toggle('is-loading', value);
    button.setAttribute('aria-busy', String(value));
    inputs.forEach((i) => { i.disabled = value; });
    updateButton();
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !state) return;

    const code = getCode();
    if (code.length !== CODE_LENGTH) {
      setMessage('Bitte alle sechs Zeichen eingeben.', 'error');
      return;
    }
    if (navigator.onLine === false) {
      setMessage('Keine Internetverbindung. Dein Code wurde nicht gewertet – versuche es erneut, sobald du wieder online bist.', 'error');
      return;
    }

    setBusy(true);
    setMessage('');
    document.activeElement && document.activeElement.blur(); // Tastatur schließen

    try {
      const result = await window.Api.check(code, state.current_room);

      if (result.result === 'correct') {
        setMessage(result.finished ? 'Das letzte Schloss gibt nach …' : 'Ein Riegel gleitet zur Seite …', 'ok');
        await wait(1400);
      }
      setBusy(false);
      render(result);
      if (result.result === 'stale') {
        setMessage('Der Spielstand hat sich inzwischen geändert. Bitte prüfe den Code für diesen Raum.', 'error');
      }
    } catch (err) {
      setBusy(false);
      // Verbindungsprobleme zählen NICHT als falscher Code.
      const hint = err.kind === 'offline' ? ' Dein Code wurde nicht gewertet.' : '';
      setMessage(window.Api.describe(err) + hint, 'error');
    }
  });

  load(false);
})();
