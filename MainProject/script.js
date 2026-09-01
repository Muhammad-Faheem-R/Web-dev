// =========================================
// 1. SELECT ELEMENTS
// =========================================
const searchInput = document.getElementById('searchInput');
const languageFilter = document.getElementById('languageFilter');
const sortBy = document.getElementById('sortBy');
const searchBtn = document.getElementById('searchBtn');
const statusMessage = document.getElementById('statusMessage');

const resultsTab = document.getElementById('resultsTab');
const bookmarksTab = document.getElementById('bookmarksTab');
const bookmarkCountEl = document.getElementById('bookmarkCount');
const tabButtons = document.querySelectorAll('.tab-btn');

const chartSection = document.getElementById('chartSection');
const chartCanvas = document.getElementById('languageChart');

const cardTemplate = document.getElementById('repoCardTemplate');

let chartInstance = null; // holds the current Chart.js chart so we can destroy/redraw it

// =========================================
// 2. LOCAL STORAGE HELPERS (bookmarks + notes)
// We store one object in localStorage keyed by repo id:
// { id, name, url, description, language, stars, forks, updated, note }
// localStorage only stores strings, so we JSON.stringify/parse.
// =========================================
const STORAGE_KEY = 'github-explorer-bookmarks';

function getBookmarks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function isBookmarked(id) {
  return Boolean(getBookmarks()[id]);
}

function toggleBookmark(repo) {
  const bookmarks = getBookmarks();

  if (bookmarks[repo.id]) {
    delete bookmarks[repo.id]; // already bookmarked -> remove it
  } else {
    bookmarks[repo.id] = { ...repo, note: '' }; // not bookmarked -> add it
  }

  saveBookmarks(bookmarks);
  updateBookmarkCount();
}

function saveNote(id, note) {
  const bookmarks = getBookmarks();
  if (bookmarks[id]) {
    bookmarks[id].note = note;
    saveBookmarks(bookmarks);
  }
}

function updateBookmarkCount() {
  bookmarkCountEl.textContent = Object.keys(getBookmarks()).length;
}

// =========================================
// 3. FETCH REPOS FROM THE GITHUB API
// GitHub's search endpoint: GET /search/repositories?q=...&sort=...&order=desc
// No auth token is required for basic use, but unauthenticated requests
// are rate-limited (about 10 requests/minute), which is fine for this demo.
// =========================================
async function fetchRepos(query, language, sort) {
  // Build the search query string GitHub expects.
  // e.g. "react language:javascript" or just "stars:>10000" for a default browse.
  let q = query.trim() || 'stars:>10000';
  if (language) q += ` language:${language}`;

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=18`;

  const response = await fetch(url);

  if (!response.ok) {
    // GitHub returns 403 when the unauthenticated rate limit is hit
    if (response.status === 403) {
      throw new Error('Rate limit reached. Wait a minute and try again.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items; // array of repo objects
}

// =========================================
// 4. RENDER RESULTS
// =========================================
function repoToPlainObject(repo) {
  // We only keep the fields we actually use — GitHub's raw response
  // has dozens of fields we don't need.
  return {
    id: repo.id,
    name: repo.full_name,
    url: repo.html_url,
    description: repo.description || 'No description provided.',
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updated: new Date(repo.updated_at).toLocaleDateString()
  };
}

function createRepoCard(repo) {
  // Clone the <template> from the HTML instead of building a big
  // HTML string in JS — easier to read and edit either file.
  const node = cardTemplate.content.cloneNode(true);

  const nameLink = node.querySelector('.repo-name');
  nameLink.textContent = repo.name;
  nameLink.href = repo.url;

  node.querySelector('.repo-description').textContent = repo.description;
  node.querySelector('.repo-language').textContent = `🧩 ${repo.language}`;
  node.querySelector('.stars-count').textContent = repo.stars.toLocaleString();
  node.querySelector('.forks-count').textContent = repo.forks.toLocaleString();
  node.querySelector('.repo-updated').textContent = `Updated ${repo.updated}`;

  const bookmarkBtn = node.querySelector('.bookmark-btn');
  bookmarkBtn.classList.toggle('bookmarked', isBookmarked(repo.id));
  bookmarkBtn.textContent = isBookmarked(repo.id) ? '★' : '☆';
  bookmarkBtn.addEventListener('click', () => {
    toggleBookmark(repo);
    bookmarkBtn.classList.toggle('bookmarked');
    bookmarkBtn.textContent = bookmarkBtn.classList.contains('bookmarked') ? '★' : '☆';
    renderBookmarksTab(); // keep the bookmarks tab in sync immediately
  });

  const noteBox = node.querySelector('.repo-note');
  const bookmarks = getBookmarks();
  noteBox.value = bookmarks[repo.id] ? bookmarks[repo.id].note : '';
  // Save the note as the user types, but only if this repo is bookmarked
  // (no point storing a note for something not saved).
  noteBox.addEventListener('input', () => {
    if (isBookmarked(repo.id)) {
      saveNote(repo.id, noteBox.value);
    }
  });

  return node;
}

function renderResults(repos) {
  resultsTab.innerHTML = '';

  if (repos.length === 0) {
    resultsTab.innerHTML = '<p class="empty-state">No repositories found. Try a different search.</p>';
    return;
  }

  repos.forEach((repo) => {
    resultsTab.appendChild(createRepoCard(repo));
  });
}

function renderBookmarksTab() {
  bookmarksTab.innerHTML = '';
  const bookmarks = Object.values(getBookmarks());

  if (bookmarks.length === 0) {
    bookmarksTab.innerHTML = '<p class="empty-state">No bookmarks yet. Click the ☆ on any repo to save it here.</p>';
    return;
  }

  bookmarks.forEach((repo) => {
    bookmarksTab.appendChild(createRepoCard(repo));
  });
}

// =========================================
// 5. CHART: language distribution of the current results
// =========================================
function renderChart(repos) {
  // Count how many repos use each language
  const counts = {};
  repos.forEach((repo) => {
    counts[repo.language] = (counts[repo.language] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  // Destroy the previous chart before drawing a new one, otherwise
  // Chart.js will stack multiple charts on the same canvas.
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Repos',
        data: values,
        backgroundColor: '#2563eb'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  chartSection.hidden = repos.length === 0;
}

// =========================================
// 6. SEARCH FLOW
// =========================================
async function runSearch() {
  statusMessage.textContent = 'Loading...';
  statusMessage.classList.remove('error');

  try {
    const rawRepos = await fetchRepos(searchInput.value, languageFilter.value, sortBy.value);
    const repos = rawRepos.map(repoToPlainObject);

    renderResults(repos);
    renderChart(repos);
    statusMessage.textContent = `${repos.length} repositories found.`;
  } catch (err) {
    statusMessage.textContent = err.message;
    statusMessage.classList.add('error');
    resultsTab.innerHTML = '';
    chartSection.hidden = true;
  }
}

searchBtn.addEventListener('click', runSearch);

// Also allow pressing Enter inside the search box
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch();
});

// =========================================
// 7. TABS (Results vs Bookmarks)
// =========================================
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const isResults = btn.dataset.tab === 'results';
    resultsTab.classList.toggle('hidden', !isResults);
    bookmarksTab.classList.toggle('hidden', isResults);
    chartSection.hidden = !isResults || resultsTab.children.length === 0;

    if (!isResults) renderBookmarksTab();
  });
});

// =========================================
// 8. INITIAL LOAD
// Runs a default search so the page isn't empty on first open.
// =========================================
updateBookmarkCount();
runSearch();