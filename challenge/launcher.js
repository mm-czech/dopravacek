const SAVE = 'dopravacek.medvedi-vyprava.v1';
let frame = null;

function launch(fresh = false) {
  if (frame) return;
  frame = document.createElement('iframe');
  frame.id = 'expedition-frame';
  frame.title = 'Medvědí výprava';
  frame.src = `challenge/index.html${fresh ? '?new=1' : ''}`;
  document.body.append(frame);
}

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
  if (event.data?.type === 'medvedi-vyprava-close') {
    frame.remove();
    frame = null;
    addTile();
  }
});

function addTile() {
  const row = document.querySelector('.start-screen:not([hidden]) .mode-tiles');
  if (!row || row.querySelector('.mode-expedition')) return;
  let saved = false;
  try { saved = localStorage.getItem(SAVE) !== null; } catch { /* Private browsing can disable storage. */ }
  const tile = document.createElement('div');
  tile.className = 'mode-tile mode-expedition';
  const picture = document.createElement('div');
  picture.className = 'mode-picture';
  picture.innerHTML = `<svg viewBox="0 0 120 120" role="img" aria-label="Medvídek s mincí" xmlns="http://www.w3.org/2000/svg">
    <circle cx="31" cy="30" r="16" fill="#9b633e"/><circle cx="79" cy="30" r="16" fill="#9b633e"/>
    <circle cx="55" cy="56" r="43" fill="#ae7448"/><ellipse cx="55" cy="73" rx="25" ry="18" fill="#e7b986"/>
    <circle cx="40" cy="51" r="4" fill="#352a25"/><circle cx="70" cy="51" r="4" fill="#352a25"/>
    <ellipse cx="55" cy="67" rx="6" ry="4" fill="#352a25"/><path d="M48 76q7 9 14 0" fill="none" stroke="#352a25" stroke-width="3" stroke-linecap="round"/>
    <circle cx="91" cy="88" r="23" fill="#df951f" stroke="#a96b12" stroke-width="5"/>
    <circle cx="91" cy="88" r="17" fill="#ffcf57"/><path d="M84 96V80h10l3 4-3 4h-10m0 0h10l3 4-3 4H84" fill="none" stroke="#91601b" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;
  const title = document.createElement('h2');
  title.className = 'mode-title';
  title.textContent = 'Medvědí výprava';
  const description = document.createElement('div');
  description.className = 'mode-text';
  description.textContent = 'Rozvážej, vydělávej mince a rozsvěcuj města.';
  const buttons = document.createElement('div');
  buttons.className = 'mode-buttons';
  if (saved) {
    const resume = document.createElement('button');
    resume.type = 'button';
    resume.className = 'btn btn-play';
    resume.textContent = 'Hrát dál';
    resume.addEventListener('click', () => launch());
    buttons.append(resume);
  }
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'btn btn-new';
  start.textContent = 'Nová hra';
  start.addEventListener('click', () => {
    if (!saved || confirm('Začít novou Medvědí výpravu? Dosavadní výprava se smaže.')) launch(true);
  });
  buttons.append(start);
  tile.append(picture, title, description, buttons);
  row.append(tile);
}

new MutationObserver(addTile).observe(document.getElementById('app'), {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden']});
addTile();
