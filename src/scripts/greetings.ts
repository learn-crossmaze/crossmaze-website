// Festival greetings: when the bar is showing (components/Greetings.astro decided while the page loaded that
// today is a special day), load the card, the words and the pop-up. On other days nothing more is loaded.
const bar = document.getElementById('greet-bar');
const raw = document.getElementById('greet-data')?.textContent;
if (bar && !bar.hidden && raw) {
  import('../greetings/ui').then(({ setUpBar }) => setUpBar(bar, JSON.parse(raw)));
}
