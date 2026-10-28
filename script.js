'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const categories = ['Scene construction', 'Animation', 'Particles & shaders', 'Physics', 'User interface', 'Editor operations', 'Miscellaneous'];
const taskState = { category: 'all', difficulty: 'all', search: '', limit: 6, data: [] };
const resultState = { type: 'coding', harness: 'all', sort: 'overall', ascending: false, expanded: false, data: [] };
let dialogOpener;

async function readData(path) {
  // File previews cannot fetch JSON; use the exact generated snapshot locally.
  if (window.location.protocol === 'file:' && window.UNITYBENCH_OFFLINE?.[path]) {
    return window.UNITYBENCH_OFFLINE[path];
  }
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
  return response.json();
}

function renderCategories() {
  const counts = Object.fromEntries(categories.map(category => [category, taskState.data.filter(task => task.category === category).length]));
  $('#category-filters').innerHTML = `<button class="active" data-category="all" aria-pressed="true">All skills <span>${taskState.data.length}</span></button>` + categories.map(category => `<button data-category="${escapeHTML(category)}" aria-pressed="false">${escapeHTML(category)} <span>${counts[category]}</span></button>`).join('');
}

function taskMeta(task) {
  return `<span class="category">${escapeHTML(task.category)}</span><span aria-hidden="true">·</span><span class="difficulty ${task.difficulty.toLowerCase()}">${escapeHTML(task.difficulty)}</span><span>${task.tests} tests</span>`;
}

function renderTasks() {
  const { category, difficulty, search, limit, data } = taskState;
  const query = search.trim().toLocaleLowerCase();
  const filtered = data.filter(task => (category === 'all' || task.category === category) && (difficulty === 'all' || task.difficulty === difficulty) && (!query || `${task.id} ${task.title} ${task.category} ${task.goal}`.toLocaleLowerCase().includes(query)));
  const shown = filtered.slice(0, limit);
  $('#task-count').textContent = filtered.length ? `SHOWING ${shown.length} OF ${filtered.length} TASKS` : 'NO MATCHING TASKS';
  $('#task-grid').innerHTML = shown.length ? shown.map(task => `<article class="task-card"><button class="task-card-button" data-task-id="${task.id}" aria-label="Compare initial and golden reference: ${escapeHTML(task.title)}"><div class="task-image"><img src="${task.golden}" alt="Golden reference: ${escapeHTML(task.title)}" width="640" height="360" loading="lazy" decoding="async"><span class="task-id">TASK ${task.id}</span><span class="task-image-hint">INITIAL ↔ GOLDEN</span></div><div class="task-meta">${taskMeta(task)}</div><h3><span class="card-arrow" aria-hidden="true">↗</span>${escapeHTML(task.title)}</h3><p class="task-goal">${escapeHTML(task.goal)}</p></button></article>`).join('') : '<div class="empty-state"><p>No tasks match these filters.</p><button class="text-link" id="reset-tasks">Reset filters ↺</button></div>';
  $('#load-more').hidden = limit >= filtered.length;
  $$('#category-filters button').forEach(button => {
    const active = button.dataset.category === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function openTask(id, opener) {
  const task = taskState.data.find(item => item.id === id);
  if (!task) return;
  dialogOpener = opener;
  $('#dialog-category').textContent = `TASK ${task.id} / ${task.category.toUpperCase()}`;
  $('#dialog-title').textContent = task.title;
  $('#dialog-goal').textContent = task.goal;
  $('#dialog-meta').innerHTML = taskMeta(task);
  $('#compare-golden').src = task.golden;
  $('#compare-golden').alt = `Golden reference: ${task.title}`;
  $('#compare-initial').src = task.initial;
  $('#compare-initial').alt = `Initial project: ${task.title}`;
  $('#compare-range').value = 50;
  $('#comparison').style.setProperty('--split', '50%');
  $('#task-dialog').showModal();
  $('#task-dialog').scrollTop = 0;
  document.body.classList.add('modal-open');
}

$('#category-filters').addEventListener('click', event => {
  const button = event.target.closest('button[data-category]');
  if (!button) return;
  taskState.category = button.dataset.category;
  taskState.limit = 6;
  renderTasks();
});
$('#task-search').addEventListener('input', event => {
  taskState.search = event.target.value;
  taskState.limit = 6;
  renderTasks();
});
$('#difficulty-filter').addEventListener('change', event => {
  taskState.difficulty = event.target.value;
  taskState.limit = 6;
  renderTasks();
});
$('#load-more').addEventListener('click', () => {
  const previous = taskState.limit;
  taskState.limit += 6;
  renderTasks();
  // Keep keyboard navigation at the first newly revealed task.
  const nextCard = $$('.task-card-button')[previous];
  if (nextCard) nextCard.focus({ preventScroll: true });
});
$('#task-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-task-id]');
  if (button) openTask(button.dataset.taskId, button);
  if (event.target.closest('#reset-tasks')) {
    Object.assign(taskState, { category: 'all', difficulty: 'all', search: '', limit: 6 });
    $('#task-search').value = '';
    $('#difficulty-filter').value = 'all';
    renderTasks();
    $('#task-search').focus();
  }
});
$('#compare-range').addEventListener('input', event => $('#comparison').style.setProperty('--split', `${event.target.value}%`));
$('#close-dialog').addEventListener('click', () => $('#task-dialog').close());
$('#task-dialog').addEventListener('click', event => {
  if (event.target !== $('#task-dialog')) return;
  const bounds = event.target.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
});
$('#task-dialog').addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
});

function updateHarnesses() {
  const list = [...new Set(resultState.data.filter(row => resultState.type === 'all' || row.type === resultState.type).map(row => row.harness))];
  $('#result-harness').innerHTML = '<option value="all">All harnesses</option>' + list.map(harness => `<option value="${escapeHTML(harness)}">${escapeHTML(harness)}</option>`).join('');
  resultState.harness = 'all';
}

function renderResults() {
  const { type, harness, sort, ascending, expanded, data } = resultState;
  const filtered = data.filter(row => (type === 'all' || row.type === type) && (harness === 'all' || row.harness === harness));
  filtered.sort((a, b) => {
    if (a[sort] === null && b[sort] === null) return b.overall - a.overall;
    if (a[sort] === null) return 1;
    if (b[sort] === null) return -1;
    return (ascending ? a[sort] - b[sort] : b[sort] - a[sort]) || b.overall - a.overall;
  });
  const shown = expanded ? filtered : filtered.slice(0, 8);
  const bestOverall = Math.max(...filtered.map(row => row.overall));
  const number = value => value === null ? '—' : value.toFixed(2);
  $('#results-body').innerHTML = shown.map((row, index) => `<tr${row.overall === bestOverall ? ' class="first-place"' : ''}><td>${String(index + 1).padStart(2, '0')}</td><td><span class="model-name">${escapeHTML(row.model)}</span><span class="harness-name">${escapeHTML(row.harness)}</span></td><td class="score-cell">${number(row.overall)}<span class="score-track" aria-hidden="true"><i style="--score:${row.overall}%"></i></span></td><td>${number(row.easy)}</td><td>${number(row.medium)}</td><td>${number(row.hard)}</td><td>${row.cost === null ? '—' : `$${number(row.cost)}`}</td><td>${number(row.time)}</td></tr>`).join('');
  $('#result-count').textContent = `SHOWING ${shown.length} OF ${filtered.length} CONFIGURATIONS`;
  const expandButton = $('#show-all-results');
  expandButton.hidden = filtered.length <= 8;
  expandButton.innerHTML = expanded ? 'Show top 8 <span aria-hidden="true">↑</span>' : `View all ${filtered.length} results <span aria-hidden="true">↓</span>`;
  expandButton.setAttribute('aria-expanded', String(expanded));
  $$('th [data-sort]').forEach(button => {
    const active = button.dataset.sort === sort;
    const title = { overall: 'Overall', easy: 'Easy', medium: 'Medium', hard: 'Hard', cost: 'Cost / task', time: 'Min / task' }[button.dataset.sort];
    button.innerHTML = title + (active ? ` <span aria-hidden="true">${ascending ? '↑' : '↓'}</span>` : '');
    button.setAttribute('aria-label', `Sort by ${title}${active ? (ascending ? ', currently ascending' : ', currently descending') : ''}`);
    const th = button.closest('th');
    if (active) th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
    else th.removeAttribute('aria-sort');
  });
}

$('#result-type').addEventListener('change', event => {
  resultState.type = event.target.value;
  updateHarnesses();
  renderResults();
});
$('#result-harness').addEventListener('change', event => {
  resultState.harness = event.target.value;
  renderResults();
});
$$('th [data-sort]').forEach(button => button.addEventListener('click', () => {
  const field = button.dataset.sort;
  resultState.ascending = field === resultState.sort ? !resultState.ascending : field === 'cost' || field === 'time';
  resultState.sort = field;
  renderResults();
}));
$('#show-all-results').addEventListener('click', () => {
  resultState.expanded = !resultState.expanded;
  renderResults();
});

$('#copy-citation').addEventListener('click', async () => {
  const button = $('#copy-citation');
  try {
    await navigator.clipboard.writeText($('#bibtex').textContent);
    button.textContent = 'Copied ✓';
    $('#copy-status').textContent = 'BibTeX copied to clipboard.';
    setTimeout(() => { button.innerHTML = 'Copy <span aria-hidden="true">⧉</span>'; }, 2500);
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#bibtex'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    $('#copy-status').textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
  }
});

const menuButton = $('.menu-toggle');
function closeMenu() {
  $('.site-header').classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  $('.site-header').classList.toggle('menu-open', expanded);
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
});
$$('.site-header nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.site-header nav a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-10% 0px -65% 0px' });
  $$('.site-header nav a').forEach(link => { const section = $(link.hash); if (section) observer.observe(section); });
}

readData('assets/tasks.json').then(data => {
  taskState.data = data;
  renderCategories();
  renderTasks();
}).catch(error => {
  console.error(error);
  $('#task-count').textContent = 'TASK DATA COULD NOT BE LOADED';
  $('#task-grid').innerHTML = '<p class="error-state">Task data is unavailable. Please <a href="https://arxiv.org/pdf/2610.35980" target="_blank" rel="noopener">browse the paper appendix</a> or reload the page. For local previews, serve this folder over HTTP as described in README.md.</p>';
});
readData('assets/results.json').then(data => {
  resultState.data = data;
  updateHarnesses();
  renderResults();
}).catch(error => {
  console.error(error);
  $('#result-count').textContent = 'RESULT DATA COULD NOT BE LOADED';
  $('#results-body').innerHTML = '<tr><td colspan="8">Results are unavailable. Please refer to Table 3 in the paper.</td></tr>';
});
