// Zentrale Einstellungen für Spiel und Admin-Seite.
window.CONFIG = {
  // URL der Google-Apps-Script-Web-App (endet auf /exec).
  // Das ist die EINZIGE Stelle, an der sie eingetragen wird.
  API_URL: 'https://script.google.com/macros/s/AKfycbyWVZ26ReQIVcM4byd85A9Bs1j7ban4iEKuGktyDZd603YojW3zlWksCXSgvHxK9Ystxw/exec',

  // Texte der Räume (Reihenfolge = Raum 1, 2, 3). Codes gehören NICHT hierher!
  ROOMS: [
    {
      title: 'Das Arbeitszimmer',
      text: 'Die Standuhr schweigt, das Tagebuch liegt aufgeschlagen. Hinter dir ist die Tür ins Schloss gefallen. Sechs Zeichen trennen dich vom nächsten Raum.',
    },
    {
      title: 'Das Kinderzimmer',
      text: 'Eine Kerze brennt, obwohl niemand hier ist. Vier Puppen sitzen still auf ihrer Bank, und eine von ihnen beobachtet dich. Ein Fehler, und du bleibst bei ihnen.',
    },
    {
      title: 'Der Speisesaal',
      text: 'Acht Plätze sind gedeckt. Sieben Stühle sind leer, einer wartet auf dich. Nur noch eine Tür trennt dich von der Freiheit.',
    },
  ],
};
