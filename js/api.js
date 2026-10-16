// Verbindung zum Google-Apps-Script-Backend (nur GET-Requests, vermeidet CORS-Preflight).
window.Api = (function () {
  const TIMEOUT_MS = 20000;

  class ApiError extends Error {
    constructor(kind, detail) {
      super(detail || kind);
      this.kind = kind; // config | offline | timeout | network | server
      this.detail = detail;
    }
  }

  async function call(params) {
    const base = window.CONFIG && window.CONFIG.API_URL;
    if (!base || !/^https:\/\//.test(base)) throw new ApiError('config');
    if (navigator.onLine === false) throw new ApiError('offline');

    const url = new URL(base);
    Object.keys(params).forEach((key) => url.searchParams.set(key, params[key]));
    url.searchParams.set('_', Date.now()); // kein Caching

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url.toString(), { cache: 'no-store', redirect: 'follow', signal: controller.signal });
    } catch (err) {
      if (err.name === 'AbortError') throw new ApiError('timeout');
      throw new ApiError(navigator.onLine === false ? 'offline' : 'network');
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) throw new ApiError('server', 'HTTP ' + res.status);
    let data;
    try {
      data = await res.json();
    } catch (err) {
      throw new ApiError('server', 'Ungültige Antwort vom Server.');
    }
    if (!data || !data.ok) throw new ApiError('server', (data && data.error) || 'Unbekannter Fehler.');
    return data;
  }

  function describe(err) {
    switch (err && err.kind) {
      case 'config':
        return 'Der Spielserver ist noch nicht eingerichtet (URL in config.js fehlt).';
      case 'offline':
        return 'Keine Internetverbindung. Prüfe WLAN oder mobile Daten und versuche es erneut.';
      case 'timeout':
        return 'Der Server antwortet nicht. Bitte versuche es gleich noch einmal.';
      case 'network':
        return 'Keine Verbindung zum Server. Bitte versuche es gleich noch einmal.';
      case 'server':
        return 'Fehler im Spielserver: ' + err.detail;
      default:
        return 'Unbekannter Fehler. Bitte versuche es erneut.';
    }
  }

  return {
    state: () => call({ action: 'state' }),
    check: (code, room) => call({ action: 'check', code: code, room: room }),
    unlock: () => call({ action: 'unlock' }),
    reset: () => call({ action: 'reset' }),
    describe: describe,
  };
})();
