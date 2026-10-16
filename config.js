// Zentrale Einstellungen für Spiel und Admin-Seite.
window.CONFIG = {
  // URL der Google-Apps-Script-Web-App (endet auf /exec).
  // Das ist die EINZIGE Stelle, an der sie eingetragen wird.
  API_URL: 'HIER_DIE_WEB_APP_URL_EINFUEGEN',

  // Texte der Räume (Reihenfolge = Raum 1, 2, 3). Codes gehören NICHT hierher!
  ROOMS: [
    {
      title: 'Die Bibliothek',
      text: 'Staub liegt auf den Regalen. Irgendwo zwischen den Seiten wartet das erste Geheimnis.',
    },
    {
      title: 'Das Laboratorium',
      text: 'Glas klirrt, Flüssigkeiten schimmern im Halbdunkel. Die nächste Tür verlangt sechs Zeichen.',
    },
    {
      title: 'Die Krypta',
      text: 'Kerzen flackern über kaltem Stein. Nur noch eine Tür trennt dich von der Freiheit.',
    },
  ],
};
