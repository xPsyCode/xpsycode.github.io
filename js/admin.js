(function () {
  const $ = (id) => document.getElementById(id);
  const buttons = ['refresh-btn', 'unlock-btn', 'reset-btn'].map($);
  let state = null;
  let busy = false;

  function setMessage(text, type) {
    $('msg').textContent = text || '';
    $('msg').className = 'msg' + (type ? ' msg-' + type : '');
  }

  function render(s) {
    state = s;
    $('room').textContent = s.finished
      ? 'Entkommen'
      : s.current_room + ' von ' + s.rooms;
    $('lock').textContent = s.locked ? 'Gesperrt' : 'Offen';
    $('lock').className = s.locked ? 'status-locked' : 'status-open';
    $('updated').textContent = new Date().toLocaleTimeString('de-DE');
    updateButtons();
  }

  function updateButtons() {
    buttons.forEach((b) => { b.disabled = busy; });
    $('unlock-btn').disabled = busy || !state || !state.locked;
  }

  async function run(request, successText) {
    if (busy) return;
    busy = true;
    updateButtons();
    setMessage('Wird geladen …');
    try {
      render(await request());
      setMessage(successText || '', successText ? 'ok' : '');
    } catch (err) {
      setMessage(window.Api.describe(err), 'error');
    } finally {
      busy = false;
      updateButtons();
    }
  }

  $('refresh-btn').addEventListener('click', () => run(window.Api.state));
  $('unlock-btn').addEventListener('click', () => run(window.Api.unlock, 'Tür wurde freigegeben.'));
  $('reset-btn').addEventListener('click', () => {
    if (!window.confirm('Spiel wirklich zurücksetzen? Die Spielerin beginnt wieder in Raum 1.')) return;
    run(window.Api.reset, 'Spiel wurde zurückgesetzt.');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run(window.Api.state);
  });

  run(window.Api.state);
})();
