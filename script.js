// MultipleFiles/blackbox-output-code-FADKB5U9YW.js

document.addEventListener('DOMContentLoaded', function() {
  // Favorit disimpan di localStorage agar tidak hilang saat refresh.
  // Selalu disimpan sebagai string supaya konsisten dengan data-match-id (atribut DOM).
  let favoriteMatches = JSON.parse(localStorage.getItem('favoriteMatches') || '[]').map(String);
  function saveFavorites() {
    localStorage.setItem('favoriteMatches', JSON.stringify(favoriteMatches));
  }

  // Musim API sepak bola = tahun MULAI musim (mis. musim 2025/26 -> 2025).
  // Sebelum Juli pakai tahun sebelumnya, agar klasemen/statistik musim berjalan tidak kosong.
  function getApiSeason(d = new Date()) {
    return d.getMonth() < 6 ? d.getFullYear() - 1 : d.getFullYear();
  }
  const RAPIDAPI_KEY = 'a8a1396ba677c3cfd78902590f729d9b'; // Ganti dengan kunci RapidAPI Anda yang sebenarnya
  const RAPIDAPI_HOST = 'v3.football.api-sports.io';

  // URL dasar untuk WordPress REST API Anda
  const WORDPRESS_API_BASE_URL = 'https://layarbola21.net/wp-json/wp/v2'; // Ganti dengan URL situs WordPress Anda yang sebenarnya

  // --- NEW: Routing Variables ---
  let currentPage = 'home'; // Default page tracker
  let currentNewsSlug = null; // To store news slug for URL consistency
  // --- END NEW ---

  // --- NEW: ID Liga Indonesia untuk di-pin di atas ---
  const INDONESIAN_LEAGUE_IDS = [274, 275]; // Liga 1 dan Liga 2 Indonesia

  const PRIORITY_LEAGUE_ORDER = [
    274, // Liga 1 Indonesia
    275, // Liga 2 Indonesia
    39,  // Premier League
    140, // La Liga
    135, // Serie A
    78,  // Bundesliga
    2    // Champions League
  ]
  
  async function fetchDataFromRapidAPI(endpoint, params = {}) {
    if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_HERE' || !RAPIDAPI_KEY) {
      console.warn('Peringatan: Kunci RapidAPI belum diganti. Harap masukkan kunci API Anda yang sebenarnya.');
      return null;
    }

    const url = `https://${RAPIDAPI_HOST}/${endpoint}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    };

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    try {
      const response = await fetch(fullUrl, options);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errors ? Object.values(errorData.errors).join(', ') : `HTTP error! status: ${response.status}`;
        throw new Error(`Error fetching data from RapidAPI (${fullUrl}): ${errorMessage}`);
      }
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error fetching data from RapidAPI:', error);
      return null;
    }
  }

  // --- START: Perubahan untuk WordPress Posts ---

  async function fetchWordPressPosts(params = {}) {
    const url = `${WORDPRESS_API_BASE_URL}/posts`;
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();
      return posts;
    } catch (error) {
      console.error('Error fetching WordPress posts:', error);
      return [];
    }
  }

  async function fetchWordPressPostDetail(postId) {
    const url = `${WORDPRESS_API_BASE_URL}/posts/${postId}?_embed`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const post = await response.json();
      return post;
    } catch (error) {
      console.error(`Error fetching WordPress post detail for ID ${postId}:`, error);
      return null;
    }
  }

  async function fetchWordPressTermDetail(taxonomy, termId) {
    const url = `${WORDPRESS_API_BASE_URL}/${taxonomy}/${termId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const term = await response.json();
      return term;
    } catch (error) {
      console.error(`Error fetching WordPress term detail for ID ${termId}:`, error);
      return null;
    }
  }

  // --- END: Perubahan untuk WordPress Posts ---

  // --- MODIFIED: eventData with links ---
  const eventData = [{
    img: "https://layarbola21.net/iklan/a.jpg",
    title: "Event Tebak Skor Berhadiah!",
    alt: "Ilustrasi tebak skor",
    link: "https://supervegas88ne.com/registration?refC=LAY84682" // Contoh link Telegram
  }, {
    img: "https://layarbola21.net/iklan/b.jpg",
    title: "Ikuti Fantasy League Musim Ini!",
    alt: "Ilustrasi fantasy league",
    link: "https://supervegas88ne.com/registration?refC=LAY84682" // Contoh link website
  }, {
    img: "https://layarbola21.net/iklan/c.jpg",
    title: "Kuis Sepakbola Berhadiah Menarik",
    alt: "Ilustrasi kuis sepakbola",
    link: "https://supervegas88ne.com/registration?refC=LAY84682" // Contoh link website
  }];
  // --- END MODIFIED ---

  // --- MODIFIED: Comments storage using localStorage ---
  let comments = JSON.parse(localStorage.getItem('appComments')) || {};

  function saveComments() {
    localStorage.setItem('appComments', JSON.stringify(comments));
  }
  // --- END MODIFIED ---

  let currentDate = new Date();

  // --- NEW: Routing Functions ---
  function navigateTo(path, state = {}, replace = false) {
    const currentPath = window.location.pathname + window.location.search;
    const newPath = path.startsWith('/') ? path : `/${path}`;

    if (newPath !== currentPath) {
      if (replace) {
        window.history.replaceState(state, '', newPath);
      } else {
        window.history.pushState(state, '', newPath);
      }
    }
    handleRouteChange(newPath);
  }

  async function handleRouteChange(fullPath) {
    hideAllMainContent();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';

    currentNewsSlug = null; // Reset news slug on route change

    const url = new URL(window.location.origin + fullPath);
    const pathParts = url.pathname.split('/').filter(part => part !== '');
    const page = pathParts[0] || 'home';
    const subPage = pathParts[1]; // e.g., news slug, league slug, team slug
    const itemId = pathParts[2]; // e.g., news ID, league ID, team ID, match ID

    currentPage = page; // Update current page tracker

    // Logic to display page based on path
    if (page === 'home') {
      showHomePageContent();
      updateNav('home-link');
    } else if (page === 'standings') {
      showAllStandings();
      updateNav('standings-link');
    } else if (page === 'news') {
      if (itemId) { // e.g., /news/some-news-title/123
        await showNewsDetail(itemId); // itemId is the WordPress post ID
        currentNewsSlug = subPage; // Store the slug for URL consistency
      } else {
        showNewsPage();
      }
      updateNav('news-link');
    } else if (page === 'events') {
      showEventPage();
      updateNav('event-link');
    } else if (page === 'player') { // Changed from 'transfers' to 'player'
      if (itemId) { // e.g., /player/lionel-messi/12345
        await showPlayerDetail(itemId, url.searchParams.get('season'));
      } else {
        showPlayerPage();
      }
      updateNav('player-link'); // Changed from 'transfer-link' to 'player-link'
    } else if (page === 'league' && itemId) { // e.g., /league/premier-league/39
      await showLeagueSchedule(itemId); // itemId is the league ID
    } else if (page === 'team' && itemId) { // e.g., /team/manchester-united/33
      await showTeamDetail(itemId); // itemId is the team ID
    } else if (page === 'match' && itemId) { // e.g., /match/man-utd-vs-liverpool/12345
      const leagueId = url.searchParams.get('league');
      if (leagueId) {
        await showMatchDetail(itemId, leagueId);
      } else {
        // Fallback if league ID is not in URL, try to get it from match data
        const apiMatchDetails = await fetchDataFromRapidAPI('fixtures', { id: itemId });
        if (apiMatchDetails && apiMatchDetails.length > 0) {
          await showMatchDetail(itemId, apiMatchDetails[0].league.id);
        } else {
          console.error('League ID not found for match detail. Redirecting to home.');
          navigateTo('home', {}, true); // Redirect to home if match detail fails
        }
      }
    } else {
      // Default to home if path is not recognized
      showHomePageContent();
      updateNav('home-link');
    }
    window.scrollTo(0, 0); // Scroll to top on page change
  }

  // Event listener for browser's back/forward buttons
  window.addEventListener('popstate', (event) => {
    handleRouteChange(window.location.pathname + window.location.search);
  });
  // --- END NEW ---

  // Modifikasi fungsi renderNews
  async function renderNews(containerSelector, limit = 6) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"></div><p>Memuat berita...</p>';

    const posts = await fetchWordPressPosts({
      per_page: limit,
      _embed: true
    });

    if (!posts || posts.length === 0) {
      container.innerHTML = `<div class="no-matches">Tidak ada berita ditemukan.</div>`;
      return;
    }

    container.innerHTML = posts.map(post => {
      const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://placehold.co/600x400/cccccc/969696?text=No+Image';
      const postDate = new Date(post.date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...';

      return `
        <div class="news-card" data-news-id="${post.id}" data-news-slug="${post.slug}">
            <img src="${featuredImage}" alt="${post.title.rendered}" class="news-img">
            <div class="news-content">
                <h3>${post.title.rendered}</h3>
                <p>${excerpt}</p>
                <div class="news-date">${postDate}</div>
            </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('click', () => {
        const newsId = card.getAttribute('data-news-id');
        const newsSlug = card.getAttribute('data-news-slug');
        navigateTo(`news/${newsSlug}/${newsId}`);
      });
    });
  }

  function renderEvents(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.innerHTML = eventData.map(event => `
                  <div class="event-card">
                      <img src="${event.img}" alt="${event.alt}" class="event-img">
                      <div class="event-content">
                          <h3>${event.title}</h3>
                      </div>
                  </div>
              `).join('');
  }

  function updateFavoriteCount() {
    const favoriteCountElements = document.querySelectorAll('.favorite-count');
    favoriteCountElements.forEach(element => {
      element.textContent = favoriteMatches.length;
    });
  }

  function updateNews() {
    console.log("Fungsi updateNews tidak lagi digunakan dengan data statis.");
  }

// Modifikasi fungsi createMatchElement untuk menambahkan icon live
function createMatchElement(match, leagueId) {
    const matchRow = document.createElement('div');
    matchRow.className = 'match-row';
    matchRow.setAttribute('data-match-id', match.id);
    matchRow.setAttribute('data-league-id', leagueId);

    let timeClass = '';
    if (match.status === 'live') {
      timeClass = 'live';
    } else if (match.status === 'finished') {
      timeClass = 'finished';
    }

    // Generate live URL slug
    const team1Slug = match.team1.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const team2Slug = match.team2.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const liveUrl = `https://live.layarbola21.org/${team1Slug}-vs-${team2Slug}.html`;

    matchRow.innerHTML = `
                  <div class="match-time ${timeClass}">${match.time}</div>
                  <div class="match-teams">
                      <div class="team">
                          <div class="team-name">
                              <img src="${match.team1.logo}" alt="${match.team1.name}" class="team-badge">
                              ${match.team1.name}
                          </div>
                          <div class="score">${match.team1.score}</div>
                      </div>
                      <div class="team">
                          <div class="team-name">
                              <img src="${match.team2.logo}" alt="${match.team2.name}" class="team-badge">
                              ${match.team2.name}
                          </div>
                          <div class="score">${match.team2.score}</div>
                      </div>
                  </div>
                  <div class="match-actions">
                      ${match.status === 'live' ? `
                      <a href="${liveUrl}" class="match-action live-stream" title="Tonton Live Streaming" target="_blank">
                          <i class="fas fa-play-circle"></i>
                      </a>
                      ` : ''}
                      <div class="match-action standings" title="Klasemen Liga" data-league-id="${leagueId}">
                          <i class="fas fa-trophy"></i>
                      </div>
                      <div class="match-action favorite ${favoriteMatches.includes(String(match.id)) ? 'active' : ''}" title="Tambahkan ke Favorit">
                          <i class="${favoriteMatches.includes(String(match.id)) ? 'fas' : 'far'} fa-star"></i>
                      </div>
                  </div>
              `;
    return matchRow;
}

  function createLeagueElement(leagueId, leagueData, matchesToShow) {
    if (matchesToShow.length === 0) return null;

    const leagueContainer = document.createElement('div');
    leagueContainer.className = 'league-container';
    const leagueHeader = document.createElement('div');
    // Mulai dalam keadaan tertutup (konsisten dengan match-container yang tersembunyi).
    leagueHeader.className = 'league-header collapsed';
    leagueHeader.innerHTML = `
                  <div class="league-title">
                      <img src="${leagueData.logo}" alt="${leagueData.name}" style="${leagueId === 2 ? 'width: 20px; height: 20px;' : ''}">
                      <span>${leagueData.country ? leagueData.country.toUpperCase() + ' || ' : ''}${leagueData.name}</span>
                  </div>
                  <i class="fas fa-chevron-down league-toggle"></i>
              `;

    const matchContainer = document.createElement('div');
    matchContainer.className = 'match-container';
    matchesToShow.forEach(match => {
      const matchElement = createMatchElement(match, leagueId);
      matchContainer.appendChild(matchElement);
    });

    leagueContainer.appendChild(leagueHeader);
    leagueContainer.appendChild(matchContainer);
    return leagueContainer;
  }

  async function renderMatches(tabId) {
    const tabContent = document.getElementById(tabId);
    if (!tabContent) return;

    tabContent.innerHTML = '<div class="loading-spinner"></div><p>Memuat pertandingan...</p>';
    let hasMatches = false;

    const dateFormatted = currentDate.toISOString().split('T')[0];

    const allMatchesFromAPI = await fetchDataFromRapidAPI('fixtures', {
      date: dateFormatted
    });

    if (!allMatchesFromAPI || allMatchesFromAPI.length === 0) {
      tabContent.innerHTML = `
            <div class="no-matches">
                <i class="far fa-clock" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h3>Tidak ada pertandingan</h3>
                <p>Tidak ada pertandingan yang sesuai dengan filter ini pada tanggal ini</p>
            </div>
        `;
      return;
    }

    const groupedMatches = {};
    allMatchesFromAPI.forEach(apiMatch => {
      const leagueId = apiMatch.league.id;
      if (!groupedMatches[leagueId]) {
        groupedMatches[leagueId] = {
          name: apiMatch.league.name,
          logo: apiMatch.league.logo,
          country: apiMatch.league.country,
          matches: []
        };
      }

      let status = 'scheduled';
      let time = '';
      const fixtureStatus = apiMatch.fixture.status.short;

      if (['HT', '1H', '2H', 'ET', 'P', 'BT'].includes(fixtureStatus)) {
        status = 'live';
        time = apiMatch.fixture.status.elapsed ? `${apiMatch.fixture.status.elapsed}'` : 'Live';
      } else if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'INT', 'WO'].includes(fixtureStatus)) {
        status = 'finished';
        time = fixtureStatus;
      } else {
        const matchDate = new Date(apiMatch.fixture.date);
        time = matchDate.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      const match = {
        id: apiMatch.fixture.id,
        time: time,
        status: status,
        team1: {
          name: apiMatch.teams.home.name,
          logo: apiMatch.teams.home.logo,
          score: apiMatch.goals.home !== null ? apiMatch.goals.home : '-'
        },
        team2: {
          name: apiMatch.teams.away.name,
          logo: apiMatch.teams.away.logo,
          score: apiMatch.goals.away !== null ? apiMatch.goals.away : '-'
        },
        date: new Date(apiMatch.fixture.date),
        details: null
      };
      groupedMatches[leagueId].matches.push(match);
    });

    tabContent.innerHTML = '';
    
    // --- PERUBAHAN PENTING: Urutkan liga, Liga Indonesia di atas ---
    // Buat array dari kunci liga
    const leagueKeys = Object.keys(groupedMatches);
    
    // Urutkan berdasarkan prioritas: Liga Indonesia pertama, lalu liga lainnya
    leagueKeys.sort((a, b) => {
      const idA = parseInt(a);
      const idB = parseInt(b);

      const indexA = PRIORITY_LEAGUE_ORDER.indexOf(idA);
      const indexB = PRIORITY_LEAGUE_ORDER.indexOf(idB);

      // Jika dua-duanya ada di PRIORITY LIST
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // Jika hanya A yang prioritas → A di atas
      if (indexA !== -1) return -1;

      // Jika hanya B yang prioritas → B di atas
      if (indexB !== -1) return 1;

      // Sisanya → sort normal (opsional: by country atau name)
      return groupedMatches[a].name.localeCompare(groupedMatches[b].name);
    });
    
    leagueKeys.forEach(leagueId => {
      const leagueData = groupedMatches[leagueId];
      let filteredMatches = [];

      if (tabId === 'all') {
        filteredMatches = leagueData.matches;
      } else if (tabId === 'live') {
        filteredMatches = leagueData.matches.filter(match => match.status === 'live');
      } else if (tabId === 'finished') {
        filteredMatches = leagueData.matches.filter(match => match.status === 'finished');
      } else if (tabId === 'scheduled') {
        filteredMatches = leagueData.matches.filter(match => match.status === 'scheduled');
      }

      const leagueElement = createLeagueElement(leagueId, leagueData, filteredMatches);
      if (leagueElement) {
        tabContent.appendChild(leagueElement);
        hasMatches = true;
      }
    });

    if (!hasMatches) {
      tabContent.innerHTML = `
            <div class="no-matches">
                <i class="far fa-clock" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h3>Tidak ada pertandingan</h3>
                <p>Tidak ada pertandingan yang sesuai dengan filter ini pada tanggal ini</p>
            </div>
        `;
    }
  }

  async function showLeagueStandings(leagueId) {
    const modal = document.getElementById('standings-modal');
    const modalContent = document.getElementById('modal-league-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = '<div class="loading-spinner"></div><p>Memuat klasemen...</p>';
    modal.style.display = 'block';

    const currentYear = getApiSeason();
    const apiStandings = await fetchDataFromRapidAPI('standings', {
      league: leagueId,
      season: currentYear
    });

    if (!apiStandings || apiStandings.length === 0 || !apiStandings[0].league || !apiStandings[0].league.standings || apiStandings[0].league.standings.length === 0) {
      modalContent.innerHTML = `<div class="no-matches">Data klasemen belum tersedia untuk liga ini.</div>`;
      return;
    }

    const standings = apiStandings[0].league.standings[0];
    const leagueInfo = apiStandings[0].league;

    modalContent.innerHTML = `
            <div class="modal-league-header">
                <img src="${leagueInfo.logo}" alt="${leagueInfo.name}">
                <h2>Klasemen ${leagueInfo.name}</h2>
            </div>
            <div class="standings-table-wrapper">
              <table class="standings-table">
                  <thead>
                      <tr>
                          <th>#</th>
                          <th style="text-align: left;">Tim</th>
                          <th>M</th>
                          <th>M</th>
                          <th>S</th>
                          <th>K</th>
                          <th>G</th>
                          <th>P</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${standings.map(team => `
                          <tr>
                              <td>${team.rank}</td>
                              <td class="team-cell">
                                  <img src="${team.team.logo}" alt="${team.team.name}">
                                  ${team.team.name}
                              </td>
                              <td>${team.all.played}</td>
                              <td>${team.all.win}</td>
                              <td>${team.all.draw}</td>
                              <td>${team.all.lose}</td>
                              <td>${team.goalsDiff !== undefined ? team.goalsDiff : (team.all.goals.for - team.all.goals.against)}</td>
                              <td>
                                  <strong>${team.points}</strong>
                              </td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
            </div>
        `;
  }

  async function showAllStandings() {
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    let standingsPage = document.getElementById('standings-all-page');

    if (!mainContent || !standingsPage) return; // Removed sidebar check as it's handled by hideAllMainContent

    hideAllMainContent();
    sidebar.style.display = 'none';

    standingsPage.classList.add('active');
    standingsPage.innerHTML = `
            <div class="card">
                <div class="section-title">
                    <span>
                        <i class="fas fa-trophy"></i> Klasemen Liga
                    </span>
                </div>
                <div id="all-standings-content" style="padding: 15px;">
                    <div class="loading-spinner"></div><p>Memuat semua klasemen...</p>
                </div>
            </div>
        `;

    const allStandingsContent = document.getElementById('all-standings-content');
    const currentYear = getApiSeason();

    // --- PERUBAHAN: Tambahkan Liga Indonesia di atas ---
    const predefinedLeagueIds = [
      274, // Liga 1 Indonesia - DI ATAS
      275, // Liga 2 Indonesia - DI ATAS
      39, // Premier League
      140, // La Liga
      135, // Serie A
      78, // Bundesliga
      2, // Champions League (Group Stage)
    ];

    allStandingsContent.innerHTML = '';

    for (const leagueId of predefinedLeagueIds) {
      const apiStandings = await fetchDataFromRapidAPI('standings', {
        league: leagueId,
        season: currentYear
      });

      if (apiStandings && apiStandings.length > 0 && apiStandings[0].league && apiStandings[0].league.standings && apiStandings[0].league.standings.length > 0) {
        const standings = apiStandings[0].league.standings[0];
        const leagueInfo = apiStandings[0].league;

        const leagueSection = document.createElement('div');
        leagueSection.className = 'standings-league';
        leagueSection.innerHTML = `
                    <div class="standings-league-header">
                        <img src="${leagueInfo.logo}" alt="${leagueInfo.name}">
                        <h3>${leagueInfo.name}</h3>
                    </div>
                    <div class="standings-table-wrapper">
                      <table class="standings-table">
                          <thead>
                              <tr>
                                  <th>#</th>
                                  <th style="text-align: left;">Tim</th>
                                  <th>M</th>
                                  <th>M</th>
                                  <th>S</th>
                                  <th>K</th>
                                  <th>G</th>
                                  <th>P</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${standings.map(team => `
                                  <tr>
                                      <td>${team.rank}</td>
                                      <td class="team-cell">
                                          <img src="${team.team.logo}" alt="${team.team.name}">
                                          ${team.team.name}
                                      </td>
                                      <td>${team.all.played}</td>
                                      <td>${team.all.win}</td>
                                      <td>${team.all.draw}</td>
                                      <td>${team.all.lose}</td>
                                      <td>${team.goalsDiff !== undefined ? team.goalsDiff : (team.all.goals.for - team.all.goals.against)}</td>
                                      <td>
                                          <strong>${team.points}</strong>
                                      </td>
                                  </tr>
                              `).join('')}
                          </tbody>
                      </table>
                    </div>
                `;
        allStandingsContent.appendChild(leagueSection);
      } else {
        const leagueNamePlaceholder = `Liga ID ${leagueId}`;
        allStandingsContent.innerHTML += `<div class="no-matches" style="margin-top: 20px;">Data klasemen untuk ${leagueNamePlaceholder} belum tersedia.</div>`;
      }
    }
  }

  async function renderMatchesForDate(containerElement, leagueId, date, title, limit = null, teamId = null) {
    if (!containerElement) return 0;

    containerElement.innerHTML = `<div class="loading-spinner"></div><p>Memuat ${title.toLowerCase()}...</p>`;

    const dateFormatted = date.toISOString().split('T')[0];
    const params = {
      season: getApiSeason(),
      date: dateFormatted
    };
    if (leagueId) params.league = leagueId;
    if (teamId) params.team = teamId;

    const apiFixtures = await fetchDataFromRapidAPI('fixtures', params);

    containerElement.innerHTML = '';

    if (!apiFixtures || apiFixtures.length === 0) {
      containerElement.innerHTML = `<div class="no-matches">Tidak ada pertandingan ${title.toLowerCase()} untuk ${teamId ? 'tim ini' : 'liga ini'}.</div>`;
      return 0;
    }

    const matchesToRender = limit ? apiFixtures.slice(0, limit) : apiFixtures;

    matchesToRender.forEach(apiMatch => {
      let status = 'scheduled';
      let time = '';
      const fixtureStatus = apiMatch.fixture.status.short;

      if (['HT', '1H', '2H', 'ET', 'P', 'BT'].includes(fixtureStatus)) {
        status = 'live';
        time = apiMatch.fixture.status.elapsed ? `${apiMatch.fixture.status.elapsed}'` : 'Live';
      } else if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'INT', 'WO'].includes(fixtureStatus)) {
        status = 'finished';
        time = fixtureStatus;
      } else {
        const matchDate = new Date(apiMatch.fixture.date);
        time = matchDate.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      const match = {
        id: apiMatch.fixture.id,
        time: time,
        status: status,
        team1: {
          name: apiMatch.teams.home.name,
          logo: apiMatch.teams.home.logo,
          score: apiMatch.goals.home !== null ? apiMatch.goals.home : '-'
        },
        team2: {
          name: apiMatch.teams.away.name,
          logo: apiMatch.teams.away.logo,
          score: apiMatch.goals.away !== null ? apiMatch.goals.away : '-'
        },
        date: new Date(apiMatch.fixture.date),
        details: null
      };
      containerElement.appendChild(createMatchElement(match, apiMatch.league.id));
    });

    return apiFixtures.length;
  }

  async function showLeagueSchedule(leagueId) {
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');

    if (!mainContent) return; // Removed sidebar check as it's handled by hideAllMainContent

    hideAllMainContent();
    sidebar.style.display = 'none';

    let leagueSchedulePage = document.getElementById('league-schedule-page');
    if (!leagueSchedulePage) {
      leagueSchedulePage = document.createElement('div');
      leagueSchedulePage.id = 'league-schedule-page';
      leagueSchedulePage.className = 'standings-page';
      mainContent.appendChild(leagueSchedulePage);
    }
    leagueSchedulePage.innerHTML = '';
    leagueSchedulePage.classList.add('active');

    const apiLeagueInfo = await fetchDataFromRapidAPI('leagues', {
      id: leagueId
    });
    const leagueData = apiLeagueInfo && apiLeagueInfo.length > 0 ? apiLeagueInfo[0].league : {
      name: `Liga ID ${leagueId}`,
      logo: 'https://via.placeholder.com/24x24/cccccc/969696?text=?'
    };

    // --- NEW: Update URL with league slug ---
    const leagueSlug = leagueData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const currentPath = window.location.pathname;
    const expectedPath = `/league/${leagueSlug}/${leagueId}`;
    if (currentPath !== expectedPath) {
      navigateTo(expectedPath, { leagueId: leagueId, leagueSlug: leagueSlug }, true);
    }
    // --- END NEW ---

    const backButtonHeader = document.createElement('div');
    backButtonHeader.className = 'match-detail-header';
    backButtonHeader.style.marginBottom = '20px';
    backButtonHeader.innerHTML = `<button class="back-button"><i class="fas fa-arrow-left"></i> Kembali ke Beranda</button>`;
    leagueSchedulePage.appendChild(backButtonHeader);
    backButtonHeader.querySelector('.back-button')?.addEventListener('click', () => navigateTo('home'));

    const today = new Date();
    const todayCard = document.createElement('div');
    todayCard.className = 'card';
    todayCard.innerHTML = `
            <div class="section-title">
                <span>
                    <img src="${leagueData.logo}" alt="${leagueData.name}" style="width: 24px; height: 24px; margin-right: 10px;"> Jadwal ${leagueData.name} Hari Ini
                </span>
            </div>
            <div id="league-matches-today-content"></div>
            <div id="view-all-today-matches-container" style="text-align: center; padding: 10px;"></div>
        `;
    leagueSchedulePage.appendChild(todayCard);

    const leagueMatchesTodayContent = document.getElementById('league-matches-today-content');
    const totalTodayMatches = await renderMatchesForDate(leagueMatchesTodayContent, leagueId, today, 'Hari Ini', 10);

    if (totalTodayMatches > 10) {
      const viewAllTodayContainer = document.getElementById('view-all-today-matches-container');
      if (viewAllTodayContainer) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'more-matches-btn';
        viewAllButton.textContent = 'Lihat Seluruh Jadwal Hari Ini';
        viewAllButton.addEventListener('click', async () => {
          await renderMatchesForDate(leagueMatchesTodayContent, leagueId, today, 'Hari Ini', null);
          viewAllTodayContainer.style.display = 'none';
        });
        viewAllTodayContainer.appendChild(viewAllButton);
      }
    }

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowCard = document.createElement('div');
    tomorrowCard.className = 'card';
    tomorrowCard.innerHTML = `
            <div class="section-title">
                <span>
                    <i class="fas fa-calendar-alt"></i> Jadwal ${leagueData.name} Besok
                </span>
            </div>
            <div id="league-matches-tomorrow-content"></div>
        `;
    leagueSchedulePage.appendChild(tomorrowCard);
    await renderMatchesForDate(document.getElementById('league-matches-tomorrow-content'), leagueId, tomorrow, 'Besok');

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayCard = document.createElement('div');
    yesterdayCard.className = 'card';
    yesterdayCard.innerHTML = `
            <div class="section-title">
                <span>
                    <i class="fas fa-calendar-check"></i> Hasil ${leagueData.name} Kemarin
                </span>
            </div>
            <div id="league-matches-yesterday-content"></div>
        `;
    leagueSchedulePage.appendChild(yesterdayCard);
    await renderMatchesForDate(document.getElementById('league-matches-yesterday-content'), leagueId, yesterday, 'Kemarin');

    const newsCardOnSchedule = document.createElement('div');
    newsCardOnSchedule.className = 'card';
    newsCardOnSchedule.innerHTML = `
           <div class="section-title">
              <span>
                  <i class="fas fa-newspaper"></i> Berita Terkini
              </span>
          </div>
          <div class="news-grid" id="schedule-news-grid"></div>
          <div class="more-news-container">
              <button class="more-news-btn">Berita Lainnya &gt;</button>
          </div>
      `;
    leagueSchedulePage.appendChild(newsCardOnSchedule);
    renderNews('#schedule-news-grid');
  }

  async function showLeaguesByCountry(countryName) {
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');

    if (!mainContent) return; // Removed sidebar check

    hideAllMainContent();
    sidebar.style.display = 'none';

    let countryLeaguesPage = document.getElementById('country-leagues-page');
    if (!countryLeaguesPage) {
      countryLeaguesPage = document.createElement('div');
      countryLeaguesPage.id = 'country-leagues-page';
      countryLeaguesPage.className = 'standings-page';
      mainContent.appendChild(countryLeaguesPage);
    }
    countryLeaguesPage.innerHTML = '';
    countryLeaguesPage.classList.add('active');

    const countryLeaguesHeader = document.createElement('div');
    countryLeaguesHeader.className = 'card';
    countryLeaguesHeader.innerHTML = `
            <div class="section-title">
                <span>
                    <i class="fas fa-globe"></i> Liga di ${countryName}
                </span>
            </div>
            <div id="country-leagues-list" class="league-list" style="padding: 0;">
                <div class="loading-spinner"></div><p>Memuat liga...</p>
            </div>
        `;
    countryLeaguesPage.appendChild(countryLeaguesHeader);

    const countryLeaguesList = document.getElementById('country-leagues-list');
    if (!countryLeaguesList) return;

    const apiLeagues = await fetchDataFromRapidAPI('leagues', {
      country: countryName
    });

    countryLeaguesList.innerHTML = '';

    if (!apiLeagues || apiLeagues.length === 0) {
      countryLeaguesList.innerHTML = `<div class="no-matches"><h3>Tidak ada liga ditemukan untuk negara ini.</h3></div>`;
    } else {
      apiLeagues.forEach(apiLeague => {
        const leagueItem = document.createElement('div');
        leagueItem.className = 'league-item';
        leagueItem.style.borderBottom = '1px solid #eee';
        leagueItem.setAttribute('data-league-id', apiLeague.league.id);
        leagueItem.innerHTML = `
                <img src="${apiLeague.league.logo}" alt="${apiLeague.league.name}">
                <span>${apiLeague.league.name}</span>
            `;
        countryLeaguesList.appendChild(leagueItem);
      });
    }
  }

  async function showMatchDetail(matchId, leagueId) {
    hideAllMainContent();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';

    const matchDetailElement = document.getElementById('match-detail-page');
    if (!matchDetailElement) {
      console.error(`Match detail page element not found.`);
      return;
    }

    matchDetailElement.innerHTML = `
        <div class="match-detail-header">
            <button class="back-button"><i class="fas fa-arrow-left"></i> Kembali</button>
        </div>
        <div class="loading-spinner"></div><p>Memuat detail pertandingan...</p>
    `;
    matchDetailElement.classList.add('active');
    matchDetailElement.querySelector('.back-button')?.addEventListener('click', () => navigateTo('home'));

    const apiMatchDetails = await fetchDataFromRapidAPI('fixtures', {
      id: matchId
    });

    if (!apiMatchDetails || apiMatchDetails.length === 0) {
      matchDetailElement.innerHTML = `
            <div class="match-detail-header">
                <button class="back-button"><i class="fas fa-arrow-left"></i> Kembali</button>
            </div>
            <div class="no-matches">Detail pertandingan tidak tersedia.</div>
        `;
      matchDetailElement.querySelector('.back-button')?.addEventListener('click', () => navigateTo('home'));
      return;
    }

    const selectedMatch = apiMatchDetails[0];

    // --- NEW: Update URL with match slug and league ID in query ---
    const homeTeamName = selectedMatch.teams.home.name;
    const awayTeamName = selectedMatch.teams.away.name;
    const matchSlug = `${homeTeamName.toLowerCase().replace(/\s+/g, '-')}-vs-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`;
    const currentPath = window.location.pathname + window.location.search;
    const expectedPath = `/match/${matchSlug}/${matchId}?league=${leagueId}`;
    if (currentPath !== expectedPath) {
      navigateTo(expectedPath, { matchId: matchId, leagueId: leagueId, matchSlug: matchSlug }, true);
    }
    // --- END NEW ---

    // PERF: 5 endpoint ini saling independen -> ambil paralel (sebelumnya berurutan).
    const [statsApiData, h2hApiData, oddsApiData, lineupsApiData, eventsApiData] = await Promise.all([
      fetchDataFromRapidAPI('fixtures/statistics', { fixture: matchId }),
      fetchDataFromRapidAPI('fixtures/head2head', {
        h2h: `${selectedMatch.teams.home.id}-${selectedMatch.teams.away.id}`,
        last: 5
      }),
      fetchDataFromRapidAPI('odds', { fixture: matchId, bookmaker: 1 }),
      fetchDataFromRapidAPI('fixtures/lineups', { fixture: matchId }),
      fetchDataFromRapidAPI('fixtures/events', { fixture: matchId })
    ]);

    const matchDate = new Date(selectedMatch.fixture.date);
    const formattedDate = matchDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = matchDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let matchStatusText = '';
    let matchStatusClass = '';
    const fixtureStatusShort = selectedMatch.fixture.status.short;
    const fixtureStatusLong = selectedMatch.fixture.status.long;

    if (['HT', '1H', '2H', 'ET', 'P', 'BT'].includes(fixtureStatusShort)) {
      matchStatusText = selectedMatch.fixture.status.elapsed ? `Live ${selectedMatch.fixture.status.elapsed}'` : 'Live';
      matchStatusClass = 'live';
    } else if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'INT', 'WO'].includes(fixtureStatusShort)) {
      matchStatusText = fixtureStatusLong;
      matchStatusClass = 'finished';
    } else {
      matchStatusText = fixtureStatusLong;
      matchStatusClass = 'scheduled';
    }

    matchDetailElement.innerHTML = `
        <div class="match-detail-header">
            <button class="back-button"><i class="fas fa-arrow-left"></i> Kembali</button>
            <div class="match-datetime-status">
                <p class="match-date-display">${formattedDate}, ${formattedTime}</p>
                <p class="match-round-display">${selectedMatch.league.round || 'N/A'}</p> <!-- NEW: Match Round -->
            </div>
            <div class="match-info">
                <div class="team-detail">
                    <img src="${selectedMatch.teams.home.logo}" alt="${selectedMatch.teams.home.name}">
                    <h3>${selectedMatch.teams.home.name}</h3>
                </div>
                <div class="match-score-container">
                    <div class="match-score">${selectedMatch.goals.home !== null ? selectedMatch.goals.home : '-'} - ${selectedMatch.goals.away !== null ? selectedMatch.goals.away : '-'}</div>
                    <div class="match-status ${matchStatusClass}">${matchStatusText}</div>
                </div>
                <div class="team-detail">
                    <img src="${selectedMatch.teams.away.logo}" alt="${selectedMatch.teams.away.name}">
                    <h3>${selectedMatch.teams.away.name}</h3>
                </div>
            </div>
            <div class="match-venue">
                <i class="fas fa-map-marker-alt"></i>
                <span>${selectedMatch.fixture.venue.name || 'N/A'}, ${selectedMatch.fixture.venue.city || 'N/A'}</span>
            </div>
        </div>

        <div class="tab-container match-detail-tabs">
            <div class="tab active" data-tab="lineups-tab">Lineup</div>
            <div class="tab" data-tab="stats-tab">Statistik</div>
            <div class="tab" data-tab="odds-tab">Odds</div>
            <div class="tab" data-tab="predictions-tab">Prediksi</div>
            <div class="tab" data-tab="h2h-tab">H2H</div>
            <div class="tab" data-tab="events-tab">Events</div>
        </div>

        <div class="tab-content active" id="lineups-tab"></div>
        <div class="tab-content" id="stats-tab"></div>
        <div class="tab-content" id="odds-tab"></div>
        <div class="tab-content" id="predictions-tab"></div>
        <div class="tab-content" id="h2h-tab"></div>
        <div class="tab-content" id="events-tab"></div>
    `;

    matchDetailElement.querySelector('.back-button')?.addEventListener('click', () => navigateTo('home'));

    renderPlayers(lineupsApiData, selectedMatch.teams.home.name, selectedMatch.teams.away.name);
    renderStats(statsApiData, selectedMatch.teams.home.name, selectedMatch.teams.away.name);
    renderOdds(oddsApiData);
    renderMatchPredictions(null, selectedMatch.teams.home.name, selectedMatch.teams.away.name);
    renderH2H(h2hApiData, selectedMatch.teams.home.name, selectedMatch.teams.away.name);
    renderMatchEvents(eventsApiData, selectedMatch.teams.home.name, selectedMatch.teams.away.name);

    initMatchDetailTabs();
    window.scrollTo(0, 0);
  }

  function renderH2H(h2hApiData, team1Name, team2Name) {
    const h2hContent = document.getElementById(`h2h-tab`);
    if (!h2hContent) return;

    if (h2hApiData && h2hApiData.length > 0) {
      h2hContent.innerHTML = `
                      <div class="featured-content">
                          <div class="featured-item">
                              <h4>Riwayat Pertemuan</h4>
                              <div class="ranking-list">
                                  ${h2hApiData.map(h => `
                                      <div class="ranking-item">
                                          <span class="ranking-name">${new Date(h.fixture.date).toLocaleDateString('id-ID')}</span>
                                          <span class="ranking-value">${h.teams.home.name} ${h.goals.home} - ${h.goals.away} ${h.teams.away.name}</span>
                                      </div>
                                  `).join('')}
                              </div>
                          </div>
                      </div>`;
    } else {
      h2hContent.innerHTML = `<div class="no-matches">Data Head2Head belum tersedia.</div>`;
    }
  }

  function renderStats(statsApiData, team1Name, team2Name) {
    const statsContent = document.getElementById(`stats-tab`);
    if (!statsContent) return;

    if (statsApiData && statsApiData.length > 0) {
      const homeStats = statsApiData.find(s => s.team.name === team1Name)?.statistics || [];
      const awayStats = statsApiData.find(s => s.team.name === team2Name)?.statistics || [];

      const getStatValue = (statsArray, type) => {
        const stat = statsArray.find(s => s.type === type);
        return stat ? (stat.value !== null ? stat.value : '-') : '-';
      };

      const stats = {
        possession: {
          team1: getStatValue(homeStats, 'Ball Possession'),
          team2: getStatValue(awayStats, 'Ball Possession')
        },
        shots: {
          team1: getStatValue(homeStats, 'Total Shots'),
          team2: getStatValue(awayStats, 'Total Shots')
        },
        shotsOnTarget: {
          team1: getStatValue(homeStats, 'Shots on Goal'),
          team2: getStatValue(awayStats, 'Shots on Goal')
        },
        fouls: {
          team1: getStatValue(homeStats, 'Fouls'),
          team2: getStatValue(awayStats, 'Fouls')
        },
        corners: {
          team1: getStatValue(homeStats, 'Corner Kicks'),
          team2: getStatValue(awayStats, 'Corner Kicks')
        }
      };

      statsContent.innerHTML = `
                      <div class="featured-content">
                          <div class="featured-item">
                              <h4>Statistik Pertandingan</h4>
                              <div class="ranking-list">
                                  <div class="ranking-item">
                                      <span class="ranking-name">Penguasaan Bola</span>
                                      <span class="ranking-value">${stats.possession.team1} - ${stats.possession.team2}</span>
                                  </div>
                                  <div class="ranking-item">
                                      <span class="ranking-name">Tendangan</span>
                                      <span class="ranking-value">${stats.shots.team1} - ${stats.shots.team2}</span>
                                  </div>
                                  <div class="ranking-item">
                                      <span class="ranking-name">Tendangan ke Gawang</span>
                                      <span class="ranking-value">${stats.shotsOnTarget.team1} - ${stats.shotsOnTarget.team2}</span>
                                  </div>
                                  <div class="ranking-item">
                                      <span class="ranking-name">Pelanggaran</span>
                                      <span class="ranking-value">${stats.fouls.team1} - ${stats.fouls.team2}</span>
                                  </div>
                                  <div class="ranking-item">
                                      <span class="ranking-name">Tendangan Sudut</span>
                                      <span class="ranking-value">${stats.corners.team1} - ${stats.corners.team2}</span>
                                  </div>
                              </div>
                          </div>
                      </div>`;
    } else {
      statsContent.innerHTML = `<div class="no-matches">Data Statistik belum tersedia.</div>`;
    }
  }

  function renderOdds(oddsApiData) {
    const oddsContent = document.getElementById(`odds-tab`);
    if (!oddsContent) return;

    if (oddsApiData && oddsApiData.length > 0 && oddsApiData[0].bookmakers && oddsApiData[0].bookmakers.length > 0) {
      const bookmaker = oddsApiData[0].bookmakers[0];
      const matchWinnerOdds = bookmaker.bets.find(b => b.name === 'Match Winner');
      const overUnderOdds = bookmaker.bets.find(b => b.name === 'Goals Over/Under');

      let win1 = '-',
        draw = '-',
        win2 = '-';
      if (matchWinnerOdds) {
        win1 = matchWinnerOdds.values.find(v => v.value === 'Home')?.odd || '-';
        draw = matchWinnerOdds.values.find(v => v.value === 'Draw')?.odd || '-';
        win2 = matchWinnerOdds.values.find(v => v.value === 'Away')?.odd || '-';
      }

      let over2_5 = '-',
        under2_5 = '-';
      if (overUnderOdds) {
        over2_5 = overUnderOdds.values.find(v => v.value === 'Over 2.5')?.odd || '-';
        under2_5 = overUnderOdds.values.find(v => v.value === 'Under 2.5')?.odd || '-';
      }

      oddsContent.innerHTML = `
                      <div class="odds-container">
                          <div class="odd-item">
                              <div class="odd-title">Menang Tuan Rumah</div>
                              <div class="odd-value">${win1}</div>
                          </div>
                          <div class="odd-item">
                              <div class="odd-title">Seri</div>
                              <div class="odd-value">${draw}</div>
                          </div>
                          <div class="odd-item">
                              <div class="odd-title">Menang Tandang</div>
                              <div class="odd-value">${win2}</div>
                          </div>
                          <div class="odd-item">
                              <div class="odd-title">Over 2.5 Gol</div>
                              <div class="odd-value">${over2_5}</div>
                          </div>
                          <div class="odd-item">
                              <div class="odd-title">Under 2.5 Gol</div>
                              <div class="odd-value">${under2_5}</div>
                          </div>
                      </div>`;
    } else {
      oddsContent.innerHTML = `<div class="no-matches">Data Odds belum tersedia.</div>`;
    }
  }

  function renderPlayers(lineupsApiData, team1Name, team2Name) {
    const playersContent = document.getElementById(`lineups-tab`);
    if (!playersContent) return;

    if (lineupsApiData && lineupsApiData.length > 0) {
      const homeLineup = lineupsApiData.find(l => l.team.name === team1Name);
      const awayLineup = lineupsApiData.find(l => l.team.name === team2Name);

      const getPlayersHtml = (lineup) => {
        if (!lineup || !lineup.startXI || lineup.startXI.length === 0) {
          return '<p>Data pemain belum tersedia.</p>';
        }

        const coachPhoto = lineup.coach?.photo || 'https://placehold.co/60x60/cccccc/969696?text=C';
        const coachName = lineup.coach?.name || '-';

        return `
                <div class="player-list-section">
                    <h4>Starting XI</h4>
                    <div class="player-grid">
                        ${lineup.startXI.map(p => `
                            <div class="player-card">
                                <img src="${p.player.photo || 'https://placehold.co/60x60/cccccc/969696?text=P'}" alt="${p.player.name}" class="player-photo">
                                <div class="player-number">${p.player.number || ''}</div>
                                <div class="player-name">${p.player.name}</div>
                                <div class="player-position">${p.player.pos || ''}</div>
                            </div>`).join('')}
                    </div>
                </div>
                <div class="player-list-section" style="margin-top: 20px;">
                    <h4>Cadangan</h4>
                    <div class="player-grid">
                        ${lineup.substitutes.map(p => `
                            <div class="player-card substitute">
                                <img src="${p.player.photo || 'https://placehold.co/60x60/cccccc/969696?text=P'}" alt="${p.player.name}" class="player-photo">
                                <div class="player-number">${p.player.number || ''}</div>
                                <div class="player-name">${p.player.name}</div>
                                <div class="player-position">${p.player.pos || ''}</div>
                            </div>`).join('')}
                    </div>
                </div>
                <div class="coach-section" style="margin-top: 20px;">
                    <h4>Pelatih</h4>
                    <p style="display: flex; align-items: center;">
                        <img src="${coachPhoto}" alt="${coachName}" class="player-photo" style="width: 40px; height: 40px; margin-right: 10px;">
                        ${coachName}
                    </p>
                </div>
                `;
      };

      playersContent.innerHTML = `
                      <div class="team-lineup-container">
                          <div class="team-lineup-card">
                              <h3>${team1Name}</h3>
                              ${getPlayersHtml(homeLineup)}
                          </div>
                          <div class="team-lineup-card">
                              <h3>${team2Name}</h3>
                              ${getPlayersHtml(awayLineup)}
                          </div>
                      </div>`;
    } else {
      playersContent.innerHTML = `<div class="no-matches">Data Pemain & Pelatih belum tersedia.</div>`;
    }
  }

  function renderMatchPredictions(predictionsData, team1Name, team2Name) {
    const predictionsContent = document.getElementById(`predictions-tab`);
    if (!predictionsContent) return;

    predictionsContent.innerHTML = `
                      <div class="featured-content">
                          <div class="featured-item">
                              <h4>Prediksi Skor (Simulasi)</h4>
                              <p style="font-size: 24px; font-weight: bold; color: #1e3c72;">2 - 1</p>
                              <h4 style="margin-top: 15px;">Pemenang Diprediksi</h4>
                              <p style="font-size: 18px; font-weight: bold; color: #4caf50;">${team1Name}</p>
                              <h4 style="margin-top: 15px;">Tingkat Kepercayaan</h4>
                              <p style="font-size: 16px; font-weight: bold; color: #4caf50;">High</p>
                          </div>
                          <div class="featured-item">
                              <h4>Analisis Prediksi (Simulasi)</h4>
                              <p>Berdasarkan performa kandang dan rekor pertemuan terakhir, ${team1Name} diprediksi akan memenangkan pertandingan ini dengan selisih tipis. ${team2Name} diharapkan memberikan perlawanan sengit.</p>
                          </div>
                      </div>`;
  }

  function renderMatchEvents(eventsApiData, homeTeamName, awayTeamName) {
    const eventsContent = document.getElementById('events-tab');
    if (!eventsContent) return;

    if (!eventsApiData || eventsApiData.length === 0) {
      eventsContent.innerHTML = `<div class="no-matches">Data Events belum tersedia.</div>`;
      return;
    }

    eventsApiData.sort((a, b) => a.time.elapsed - b.time.elapsed);

    let eventsHtml = `
        <div class="match-events-container">
            <h4>Jalannya Pertandingan</h4>
            <div class="events-list">
    `;

    eventsApiData.forEach(event => {
      let iconClass = '';
      let eventDescription = '';
      let teamName = event.team.name;
      let isHomeTeam = teamName === homeTeamName;

      switch (event.type) {
        case 'Goal':
          iconClass = 'fas fa-futbol event-goal';
          eventDescription = `<strong>${event.player.name}</strong> mencetak gol!`;
          if (event.assist.name) {
            eventDescription += ` (Assist oleh ${event.assist.name})`;
          }
          break;
        case 'Card':
          if (event.detail === 'Yellow Card') {
            iconClass = 'fas fa-square event-yellow-card';
            eventDescription = `Kartu Kuning untuk <strong>${event.player.name}</strong>`;
          } else if (event.detail === 'Red Card') {
            iconClass = 'fas fa-square event-red-card';
            eventDescription = `Kartu Merah untuk <strong>${event.player.name}</strong>`;
          }
          break;
        case 'Subst':
          iconClass = 'fas fa-exchange-alt event-substitution';
          eventDescription = `Pergantian pemain: <strong>${event.player.name}</strong> keluar, <strong>${event.assist.name}</strong> masuk.`;
          break;
        default:
          iconClass = 'fas fa-info-circle event-info';
          eventDescription = `${event.detail} oleh <strong>${event.player.name}</strong>`;
      }

      eventsHtml += `
            <div class="event-item ${isHomeTeam ? 'home-event' : 'away-event'}">
                <div class="event-time">${event.time.elapsed}'</div>
                <div class="event-content">
                    <i class="${iconClass} event-icon"></i>
                    <span class="event-description">${eventDescription}</span>
                </div>
            </div>
        `;
    });

    eventsHtml += `
            </div>
        </div>
    `;
    eventsContent.innerHTML = eventsHtml;
  }

  function initMatchDetailTabs() {
    const matchDetailElement = document.getElementById('match-detail-page');
    if (matchDetailElement) {
      const tabs = matchDetailElement.querySelectorAll('.match-detail-tabs .tab');
      const tabContents = matchDetailElement.querySelectorAll('.tab-content');

      let activeTabFound = false;
      tabs.forEach((tab, index) => {
        if (tab.classList.contains('active')) {
          activeTabFound = true;
          tabContents[index].classList.add('active');
        } else {
          tabContents[index].classList.remove('active');
        }
      });

      if (!activeTabFound && tabs.length > 0) {
        tabs[0].classList.add('active');
        tabContents[0].classList.add('active');
      }
    }
  }

  async function showTeamDetail(teamId) {
    hideAllMainContent();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';

    const teamDetailPage = document.getElementById('team-detail-page');
    if (!teamDetailPage) {
      console.error('Team detail page element not found.');
      return;
    }

    teamDetailPage.innerHTML = `
        <div class="loading-spinner"></div><p>Memuat detail tim...</p>
    `;
    teamDetailPage.classList.add('active');

    // PERF: 5 endpoint detail tim diambil paralel (sebelumnya berurutan).
    const [apiTeamInfo, apiTeamSquad, apiTeamFixtures, apiTeamNextFixtures, apiTeamStatistics] = await Promise.all([
      fetchDataFromRapidAPI('teams', { id: teamId }),
      fetchDataFromRapidAPI('players/squads', { team: teamId }),
      fetchDataFromRapidAPI('fixtures', { team: teamId, last: 5 }),
      fetchDataFromRapidAPI('fixtures', { team: teamId, next: 5 }),
      fetchDataFromRapidAPI('teams/statistics', { team: teamId, season: getApiSeason() })
    ]);


    if (!apiTeamInfo || apiTeamInfo.length === 0) {
      teamDetailPage.innerHTML = `
            <div class="team-detail-page-header">
                <button class="back-button"><i class="fas fa-arrow-left"></i> Kembali</button>
                <h2>Detail Tim Tidak Tersedia</h2>
            </div>
            <div class="no-matches">Data untuk tim ini tidak ditemukan.</div>
        `;
      teamDetailPage.querySelector('.back-button')?.addEventListener('click', () => navigateTo('home'));
      return;
    }

    const team = apiTeamInfo[0].team;
    const venue = apiTeamInfo[0].venue;
    const squad = apiTeamSquad && apiTeamSquad.length > 0 ? apiTeamSquad[0].players : [];
    const lastFixtures = apiTeamFixtures || [];
    const nextFixtures = apiTeamNextFixtures || [];
    const teamStatistics = apiTeamStatistics && apiTeamStatistics.length > 0 ? apiTeamStatistics[0] : null;


    // --- NEW: Update URL with team slug ---
    const teamSlug = team.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const currentPath = window.location.pathname;
    const expectedPath = `/team/${teamSlug}/${teamId}`;
    if (currentPath !== expectedPath) {
      navigateTo(expectedPath, { teamId: teamId, teamSlug: teamSlug }, true);
    }
    // --- END NEW ---

    teamDetailPage.innerHTML = `
        <div class="team-detail-page-header">
            <button class="back-button"><i class="fas fa-arrow-left"></i> Kembali</button>
            <img src="${team.logo}" alt="${team.name} Logo">
            <h2>${team.name}</h2>
            <p>${team.country || 'N/A'} - ${venue.name || 'N/A'}</p>
        </div>

        <div class="card">
            <div class="section-title">
                <span><i class="fas fa-info-circle"></i> Informasi Tim</span>
            </div>
            <div class="team-info-grid">
                <div class="team-info-card">
                    <h4>Detail Klub</h4>
                    <ul>
                        <li><span>Nama Lengkap:</span> <strong>${team.name}</strong></li>
                        <li><span>Negara:</span> <strong>${team.country || 'N/A'}</strong></li>
                        <li><span>Tahun Didirikan:</span> <strong>${team.founded || 'N/A'}</strong></li>
                    </ul>
                </div>
                <div class="team-info-card">
                    <h4>Stadion</h4>
                    <ul>
                        <li><span>Nama Stadion:</span> <strong>${venue.name || 'N/A'}</strong></li>
                        <li><span>Kota:</span> <strong>${venue.city || 'N/A'}</strong></li>
                        <li><span>Kapasitas:</span> <strong>${venue.capacity ? venue.capacity.toLocaleString() : 'N/A'}</strong></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="section-title">
                <span><i class="fas fa-chart-bar"></i> Statistik Tim Musim Ini</span>
            </div>
            <div class="team-stats-grid" id="team-stats-grid">
                ${teamStatistics ? `
                    <div class="team-stats-card">
                        <h4>Liga: ${teamStatistics.league.name}</h4>
                        <div class="ranking-list">
                            <div class="ranking-item"><span>Posisi:</span> <span class="ranking-value">${teamStatistics.league.rank || 'N/A'}</span></div>
                            <div class="ranking-item"><span>Pertandingan Dimainkan:</span> <span class="ranking-value">${teamStatistics.fixtures.played.total || 0}</span></div>
                            <div class="ranking-item"><span>Menang:</span> <span class="ranking-value">${teamStatistics.fixtures.wins.total || 0}</span></div>
                            <div class="ranking-item"><span>Seri:</span> <span class="ranking-value">${teamStatistics.fixtures.draws.total || 0}</span></div>
                            <div class="ranking-item"><span>Kalah:</span> <span class="ranking-value">${teamStatistics.fixtures.loses.total || 0}</span></div>
                        </div>
                    </div>
                    <div class="team-stats-card">
                        <h4>Gol</h4>
                        <div class="ranking-list">
                            <div class="ranking-item"><span>Gol Dicetak (Total):</span> <span class="ranking-value">${teamStatistics.goals.for.total.total || 0}</span></div>
                            <div class="ranking-item"><span>Gol Kebobolan (Total):</span> <span class="ranking-value">${teamStatistics.goals.against.total.total || 0}</span></div>
                            <div class="ranking-item"><span>Rata-rata Gol Dicetak (Per Pertandingan):</span> <span class="ranking-value">${teamStatistics.goals.for.average.total || 0}</span></div>
                            <div class="ranking-item"><span>Rata-rata Gol Kebobolan (Per Pertandingan):</span> <span class="ranking-value">${teamStatistics.goals.against.average.total || 0}</span></div>
                        </div>
                    </div>
                ` : '<div class="no-matches" style="grid-column: 1 / -1;">Data statistik tim belum tersedia untuk musim ini.</div>'}
            </div>
        </div>

        <div class="card">
            <div class="section-title">
                <span><i class="fas fa-users"></i> Skuad Pemain</span>
            </div>
            <div class="team-squad-grid" id="team-squad-grid">
                ${squad.length > 0 ? squad.map(player => `
                    <div class="team-player-card" data-player-id="${player.id}" data-player-name="${player.name}" data-player-season="${getApiSeason()}">
                        <img src="${player.photo || 'https://placehold.co/60x60/cccccc/969696?text=P'}" alt="${player.name}">
                        <div class="player-number">${player.number || ''}</div>
                        <div class="player-name">${player.name}</div>
                        <div class="player-position">${player.position || ''}</div>
                    </div>
                `).join('') : '<div class="no-matches" style="grid-column: 1 / -1;">Data skuad pemain belum tersedia.</div>'}
            </div>
        </div>

        <div class="card">
            <div class="section-title">
                <span><i class="fas fa-history"></i> 5 Pertandingan Terakhir</span>
            </div>
            <div id="team-last-matches-content" class="league-list" style="padding: 0;">
                ${lastFixtures.length > 0 ? lastFixtures.map(apiMatch => {
                    let status = 'scheduled';
                    let time = '';
                    const fixtureStatus = apiMatch.fixture.status.short;

                    if (['HT', '1H', '2H', 'ET', 'P', 'BT'].includes(fixtureStatus)) {
                        status = 'live';
                        time = apiMatch.fixture.status.elapsed ? `${apiMatch.fixture.status.elapsed}'` : 'Live';
                    } else if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'INT', 'WO'].includes(fixtureStatus)) {
                        status = 'finished';
                        time = fixtureStatus;
                    } else {
                        const matchDate = new Date(apiMatch.fixture.date);
                        time = matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    }
                    return `
                        <div class="match-row" data-match-id="${apiMatch.fixture.id}" data-league-id="${apiMatch.league.id}">
                            <div class="match-time ${status}">${time}</div>
                            <div class="match-teams">
                                <div class="team">
                                    <div class="team-name">
                                        <img src="${apiMatch.teams.home.logo}" alt="${apiMatch.teams.home.name}" class="team-badge">
                                        ${apiMatch.teams.home.name}
                                    </div>
                                    <div class="score">${apiMatch.goals.home !== null ? apiMatch.goals.home : '-'}</div>
                                </div>
                                <div class="team">
                                    <div class="team-name">
                                        <img src="${apiMatch.teams.away.logo}" alt="${apiMatch.teams.away.name}" class="team-badge">
                                        ${apiMatch.teams.away.name}
                                    </div>
                                    <div class="score">${apiMatch.goals.away !== null ? apiMatch.goals.away : '-'}</div>
                                </div>
                            </div>
                            <div class="match-actions">
                                <div class="match-action standings" title="Klasemen Liga" data-league-id="${apiMatch.league.id}">
                                    <i class="fas fa-trophy"></i>
                                </div>
                                <div class="match-action favorite ${favoriteMatches.includes(String(apiMatch.fixture.id)) ? 'active' : ''}" title="Tambahkan ke Favorit">
                                    <i class="${favoriteMatches.includes(String(apiMatch.fixture.id)) ? 'fas' : 'far'} fa-star"></i>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : '<div class="no-matches">Tidak ada data pertandingan terakhir.</div>'}
            </div>
        </div>

        <div class="card">
            <div class="section-title">
                <span><i class="fas fa-calendar-alt"></i> 5 Pertandingan Mendatang</span>
            </div>
            <div id="team-next-matches-content" class="league-list" style="padding: 0;">
                ${nextFixtures.length > 0 ? nextFixtures.map(apiMatch => {
                    let status = 'scheduled';
                    let time = '';
                    const fixtureStatus = apiMatch.fixture.status.short;

                    if (['HT', '1H', '2H', 'ET', 'P', 'BT'].includes(fixtureStatus)) {
                        status = 'live';
                        time = apiMatch.fixture.status.elapsed ? `${apiMatch.fixture.status.elapsed}'` : 'Live';
                    } else if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'INT', 'WO'].includes(fixtureStatus)) {
                        status = 'finished';
                        time = fixtureStatus;
                    } else {
                        const matchDate = new Date(apiMatch.fixture.date);
                        time = matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    }
                    return `
                        <div class="match-row" data-match-id="${apiMatch.fixture.id}" data-league-id="${apiMatch.league.id}">
                            <div class="match-time ${status}">${time}</div>
                            <div class="match-teams">
                                <div class="team">
                                    <div class="team-name">
                                        <img src="${apiMatch.teams.home.logo}" alt="${apiMatch.teams.home.name}" class="team-badge">
                                        ${apiMatch.teams.home.name}
                                    </div>
                                    <div class="score">${apiMatch.goals.home !== null ? apiMatch.goals.home : '-'}</div>
                                </div>
                                <div class="team">
                                    <div class="team-name">
                                        <img src="${apiMatch.teams.away.logo}" alt="${apiMatch.teams.away.name}" class="team-badge">
                                        ${apiMatch.teams.away.name}
                                    </div>
                                    <div class="score">${apiMatch.goals.away !== null ? apiMatch.goals.away : '-'}</div>
                                </div>
                            </div>
                            <div class="match-actions">
                                <div class="match-action standings" title="Klasemen Liga" data-league-id="${apiMatch.league.id}">
                                    <i class="fas fa-trophy"></i>
                                </div>
                                <div class="match-action favorite ${favoriteMatches.includes(String(apiMatch.fixture.id)) ? 'active' : ''}" title="Tambahkan ke Favorit">
                                    <i class="${favoriteMatches.includes(String(apiMatch.fixture.id)) ? 'fas' : 'far'} fa-star"></i>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : '<div class="no-matches">Tidak ada data pertandingan mendatang.</div>'}
            </div>
        </div>

        <section class="news-container" aria-labelledby="team-news-title">
            <div class="card">
              <div class="section-title">
                <span id="team-news-title">
                  <i class="fas fa-newspaper"></i> Berita Terkait ${team.name}
                </span>
              </div>
              <div class="news-grid" id="team-news-grid"></div>
              <div class="more-news-container">
                <button class="more-news-btn">Berita Lainnya &gt;</button>
              </div>
            </div>
          </section>
    `;
    teamDetailPage.querySelector('.back-button')?.addEventListener('click', () => navigateTo('home'));
    renderNews('#team-news-grid');
    window.scrollTo(0, 0);
  }

  function showNewsPage() {
    hideAllMainContent();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const newsPage = document.getElementById('news-page');
    if (newsPage) {
      newsPage.classList.add('active');
      renderNews('#all-news-grid', 10);
    }
  }

  async function showNewsDetail(newsId) {
    hideAllMainContent();
    const newsDetailPage = document.getElementById('news-detail-page');
    if (!newsDetailPage) return;

    newsDetailPage.classList.add('active');
    newsDetailPage.innerHTML = `
        <div class="news-detail-content-wrapper">
            <div class="news-detail-main">
                <div class="card">
                    <div class="news-detail-header">
                        <button class="back-button" id="back-to-news-list"><i class="fas fa-arrow-left"></i> Kembali ke Berita</button>
                        <h2 id="news-detail-title"></h2>
                        <p class="news-detail-meta">Oleh <span id="news-detail-author"></span> pada <span id="news-detail-date"></span></p>
                    </div>
                    <div class="loading-spinner"></div><p>Memuat detail berita...</p>
                </div>
            </div>
            <aside class="news-detail-sidebar">
                <div class="sidebar-card">
                    <div class="sidebar-title">
                        <i class="fas fa-newspaper"></i> Berita Lainnya
                    </div>
                    <div class="news-list" id="related-news-list">
                        <div class="loading-spinner"></div><p>Memuat berita terkait...</p>
                    </div>
                </div>
            </aside>
        </div>
    `;

    const post = await fetchWordPressPostDetail(newsId);

    if (!post) {
      newsDetailPage.innerHTML = `
            <div class="news-detail-content-wrapper">
                <div class="news-detail-main">
                    <div class="card">
                        <div class="news-detail-header">
                            <button class="back-button" id="back-to-news-list"><i class="fas fa-arrow-left"></i> Kembali ke Berita</button>
                        </div>
                        <div class="no-matches">Berita tidak ditemukan.</div>
                    </div>
                </div>
                <aside class="news-detail-sidebar">
                    <div class="sidebar-card">
                        <div class="sidebar-title">
                            <i class="fas fa-newspaper"></i> Berita Lainnya
                        </div>
                        <div class="news-list" id="related-news-list">
                            <div class="no-matches">Tidak ada berita terkait.</div>
                        </div>
                    </div>
                </aside>
            </div>
        `;
      document.getElementById('back-to-news-list')?.addEventListener('click', () => navigateTo('news'));
      return;
    }

    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://placehold.co/600x400/cccccc/969696?text=No+Image';
    const authorName = post._embedded?.author?.[0]?.name || 'Admin';
    const postDate = new Date(post.date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const tags = await Promise.all(post.tags.map(tagId => fetchWordPressTermDetail('tags', tagId)));
    const tagNames = tags.filter(tag => tag !== null).map(tag => tag.name);

    // --- NEW: Update URL with news slug ---
    const newsSlug = post.slug;
    const currentPath = window.location.pathname;
    const expectedPath = `/news/${newsSlug}/${newsId}`;
    if (currentPath !== expectedPath) {
      navigateTo(expectedPath, { newsId: newsId, newsSlug: newsSlug }, true);
    }
    currentNewsSlug = newsSlug; // Store for back button logic
    // --- END NEW ---

    newsDetailPage.innerHTML = `
        <div class="news-detail-content-wrapper">
            <div class="news-detail-main">
                <div class="card">
                    <div class="news-detail-header">
                        <button class="back-button" id="back-to-news-list"><i class="fas fa-arrow-left"></i> Kembali ke Berita</button>
                        <h2 id="news-detail-title">${post.title.rendered}</h2>
                        <p class="news-detail-meta">Oleh <span id="news-detail-author">${authorName}</span> pada <span id="news-detail-date">${postDate}</span></p>
                    </div>
                    <img src="${featuredImage}" alt="${post.title.rendered}" class="news-detail-img" id="news-detail-img">
                    <div class="news-detail-body" id="news-detail-body">${post.content.rendered}</div>
                    <div class="news-detail-tags" id="news-detail-tags">
                        ${tagNames.map(tag => `<span class="news-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <!-- Comments Section -->
                <div class="card comments-section">
                    <div class="section-title">
                        <span><i class="fas fa-comments"></i> Komentar</span>
                    </div>
                    <div class="comments-list" id="comments-list">
                        <!-- Comments will be loaded here -->
                    </div>
                    <div class="comment-form">
                        <h3>Tinggalkan Komentar</h3>
                        <input type="text" id="comment-name" placeholder="Nama Anda" required>
                        <textarea id="comment-text" placeholder="Tulis komentar Anda..." required></textarea>
                        <button id="submit-comment">Kirim Komentar</button>
                    </div>
                </div>
            </div>
            <aside class="news-detail-sidebar">
                <div class="sidebar-card">
                    <div class="sidebar-title">
                        <i class="fas fa-newspaper"></i> Berita Lainnya
                    </div>
                    <div class="news-list" id="related-news-list">
                        <!-- Related news will be loaded here -->
                    </div>
                </div>
            </aside>
        </div>
    `;

    const relatedPosts = await fetchWordPressPosts({
      per_page: 5,
      exclude: [newsId],
      _embed: true
    });
    const relatedNewsList = document.getElementById('related-news-list');
    relatedNewsList.innerHTML = '';
    if (relatedPosts && relatedPosts.length > 0) {
      relatedPosts.forEach(news => {
        const relatedFeaturedImage = news._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://placehold.co/600x400/cccccc/969696?text=No+Image';
        const relatedPostDate = new Date(news.date).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const newsItem = document.createElement('div');
        newsItem.className = 'news-list-item';
        newsItem.setAttribute('data-news-id', news.id);
        newsItem.innerHTML = `
          <img src="${relatedFeaturedImage}" alt="${news.title.rendered}">
          <div class="news-list-item-content">
            <h4>${news.title.rendered}</h4>
            <p>${relatedPostDate}</p>
          </div>
        `;
        relatedNewsList.appendChild(newsItem);
        newsItem.addEventListener('click', () => {
          const relatedNewsSlug = news.slug;
          navigateTo(`news/${relatedNewsSlug}/${news.id}`);
        });
      });
    } else {
      relatedNewsList.innerHTML = `<div class="no-matches">Tidak ada berita terkait lainnya.</div>`;
    }

    renderComments(newsId);

    document.getElementById('back-to-news-list')?.addEventListener('click', () => navigateTo('news'));
    document.getElementById('submit-comment')?.addEventListener('click', () => submitComment(newsId));

    window.scrollTo(0, 0);
  }

  function renderComments(newsId) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    commentsList.innerHTML = '';
    const articleComments = comments[newsId] || [];

    if (articleComments.length === 0) {
      commentsList.innerHTML = `<div class="no-comments">Belum ada komentar. Jadilah yang pertama!</div>`;
      return;
    }

    articleComments.forEach(comment => {
      const commentElement = document.createElement('div');
      commentElement.className = 'comment-item';
      commentElement.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">${comment.name}</span>
          <span class="comment-date">${comment.date}</span>
        </div>
        <p class="comment-text">${comment.text}</p>
      `;
      commentsList.appendChild(commentElement);
    });
  }

  // --- MODIFIED: submitComment to use localStorage ---
  function submitComment(newsId) {
    const commentNameInput = document.getElementById('comment-name');
    const commentTextInput = document.getElementById('comment-text');

    const name = commentNameInput.value.trim();
    const text = commentTextInput.value.trim();

    if (!name || !text) {
      alert('Nama dan komentar tidak boleh kosong!');
      return;
    }

    const newComment = {
      name: name,
      text: text,
      date: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    if (!comments[newsId]) {
      comments[newsId] = [];
    }
    comments[newsId].push(newComment);
    saveComments(); // Save comments to localStorage

    commentNameInput.value = '';
    commentTextInput.value = '';

    renderComments(newsId);

    alert('Komentar Anda berhasil dikirim!');
  }
  // --- END MODIFIED ---

  function showEventPage() {
    hideAllMainContent();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const eventPage = document.getElementById('event-page');
    if (eventPage) {
      eventPage.classList.add('active');
      renderEvents('#all-event-grid');
    }
  }

  // --- NEW: Player Page Functions ---
  let currentSeason = getApiSeason();
  let currentLeagueId = null;

  async function fetchSeasons() {
    const seasons = await fetchDataFromRapidAPI('leagues/seasons');
    const seasonSelect = document.getElementById('player-season-select');
    if (seasonSelect && seasons) {
      seasonSelect.innerHTML = '';
      seasons.sort((a, b) => b - a); // Sort descending
      seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = season;
        seasonSelect.appendChild(option);
      });
      seasonSelect.value = currentSeason; // Set current year as default
    }
  }

  async function fetchLeaguesForSeason(season) {
    const leagues = await fetchDataFromRapidAPI('leagues', { season: season });
    const leagueSelect = document.getElementById('player-league-select');
    if (leagueSelect && leagues) {
      leagueSelect.innerHTML = '<option value="">Semua Liga</option>';
      leagues.sort((a, b) => a.league.name.localeCompare(b.league.name));
      leagues.forEach(league => {
        const option = document.createElement('option');
        option.value = league.league.id;
        option.textContent = `${league.league.name} (${league.country.name})`;
        option.setAttribute('data-country', league.country.name);
        leagueSelect.appendChild(option);
      });
    }
  }

  async function fetchPlayers(season, leagueId = null, search = null) {
    const playerListContainer = document.getElementById('player-list-container');
    if (!playerListContainer) return;

    playerListContainer.innerHTML = '<div class="loading-spinner"></div><p>Memuat pemain...</p>';

    const params = { season: season };
    if (leagueId) params.league = leagueId;
    if (search) params.search = search;

    const players = await fetchDataFromRapidAPI('players', params);

    playerListContainer.innerHTML = '';
    if (players && players.length > 0) {
      players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.setAttribute('data-player-id', player.player.id);
        playerCard.setAttribute('data-player-name', player.player.name);
        playerCard.innerHTML = `
          <img src="${player.player.photo || 'https://placehold.co/60x60/cccccc/969696?text=P'}" alt="${player.player.name}" class="player-photo">
          <div class="player-name">${player.player.name}</div>
          <div class="player-position">${player.statistics[0]?.games?.position || 'N/A'}</div>
        `;
        playerListContainer.appendChild(playerCard);
      });
    } else {
      playerListContainer.innerHTML = `<div class="no-matches">Tidak ada pemain ditemukan.</div>`;
    }
  }

  async function showPlayerDetail(playerId, season) {
    const playerContent = document.getElementById('player-content');
    const playerListContainer = document.getElementById('player-list-container');
    const playerDetailContainer = document.getElementById('player-detail-container');
    if (!playerContent || !playerListContainer || !playerDetailContainer) return;

    playerListContainer.style.display = 'none';
    playerDetailContainer.style.display = 'block';
    playerDetailContainer.innerHTML = '<div class="loading-spinner"></div><p>Memuat detail pemain...</p>';

    const playerProfile = await fetchDataFromRapidAPI('players', { id: playerId, season: season });
    const playerStats = await fetchDataFromRapidAPI('players/statistics', { id: playerId, season: season });

    if (!playerProfile || playerProfile.length === 0 || !playerStats || playerStats.length === 0) {
      playerDetailContainer.innerHTML = `<div class="no-matches">Detail pemain tidak ditemukan.</div>`;
      return;
    }

    const player = playerProfile[0].player;
    const stats = playerStats[0].statistics[0]; // Assuming one set of stats per player per season

    // --- NEW: Update URL with player slug ---
    const playerSlug = player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const currentPath = window.location.pathname + window.location.search;
    const expectedPath = `/player/${playerSlug}/${playerId}?season=${season}`;
    if (currentPath !== expectedPath) {
      navigateTo(expectedPath, { playerId: playerId, season: season, playerSlug: playerSlug }, true);
    }
    // --- END NEW ---

    playerDetailContainer.innerHTML = `
      <button class="back-button" id="back-to-player-list"><i class="fas fa-arrow-left"></i> Kembali ke Daftar Pemain</button>
      <div class="player-profile-card card">
        <div class="player-profile-header">
          <img src="${player.photo || 'https://placehold.co/120x120/cccccc/969696?text=P'}" alt="${player.name}" id="player-profile-photo">
          <h2 id="player-profile-name">${player.name}</h2>
          <p id="player-profile-team">${stats.team?.name || 'N/A'}</p>
          <p id="player-profile-nationality">${player.nationality || 'N/A'}</p>
        </div>
        <div class="player-profile-info">
          <h4>Informasi Pribadi</h4>
          <ul>
            <li><span>Usia:</span> <strong id="player-profile-age">${player.age || 'N/A'}</strong></li>
            <li><span>Tinggi:</span> <strong id="player-profile-height">${player.height || 'N/A'}</strong></li>
            <li><span>Berat:</span> <strong id="player-profile-weight">${player.weight || 'N/A'}</strong></li>
            <li><span>Posisi:</span> <strong id="player-profile-position">${stats.games?.position || 'N/A'}</strong></li>
            <li><span>Kaki:</span> <strong id="player-profile-foot">${player.foot || 'N/A'}</strong></li>
          </ul>
        </div>
      </div>
      <div class="player-stats-card card">
        <div class="section-title">
          <span><i class="fas fa-chart-bar"></i> Statistik Musim Ini (${season})</span>
        </div>
        <div id="player-stats-content">
          <div class="ranking-list">
            <div class="ranking-item">
              <span class="ranking-name">Penampilan</span>
              <span class="ranking-value">${stats.games?.appearences || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Menit Bermain</span>
              <span class="ranking-value">${stats.games?.minutes || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Gol</span>
              <span class="ranking-value">${stats.goals?.total || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Assist</span>
              <span class="ranking-value">${stats.goals?.assists || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Kartu Kuning</span>
              <span class="ranking-value">${stats.cards?.yellow || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Kartu Merah</span>
              <span class="ranking-value">${stats.cards?.red || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Rating Rata-rata</span>
              <span class="ranking-value">${stats.games?.rating || 'N/A'}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Operan Akurat (%)</span>
              <span class="ranking-value">${stats.passes?.accuracy || 0}%</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Tackle</span>
              <span class="ranking-value">${stats.tackles?.total || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Intersepsi</span>
              <span class="ranking-value">${stats.tackles?.interceptions || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Blok</span>
              <span class="ranking-value">${stats.tackles?.blocks || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Penyelamatan (Kiper)</span>
              <span class="ranking-value">${stats.goals?.saves || 0}</span>
            </div>
            <div class="ranking-item">
              <span class="ranking-name">Clean Sheet (Kiper)</span>
              <span class="ranking-value">${stats.goals?.clean_sheet || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('back-to-player-list')?.addEventListener('click', () => {
      playerDetailContainer.style.display = 'none';
      playerListContainer.style.display = 'grid';
      navigateTo('player', {}, true); // Go back to player list without adding to history
    });
  }

  async function renderTopPlayers(containerId, title, type, season, leagueId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"></div><p>Memuat ' + title.toLowerCase() + '...</p>';

    let players;
    if (type === 'goals') {
      players = await fetchDataFromRapidAPI('players/topscorers', { season: season, league: leagueId });
    } else if (type === 'assists') {
      players = await fetchDataFromRapidAPI('players/topassists', { season: season, league: leagueId });
    } else if (type === 'yellowcards') {
      players = await fetchDataFromRapidAPI('players/topyellowcards', { season: season, league: leagueId });
    } else if (type === 'redcards') {
      players = await fetchDataFromRapidAPI('players/topredcards', { season: season, league: leagueId });
    }

    container.innerHTML = '';
    if (players && players.length > 0) {
      players.slice(0, 10).forEach((playerData, index) => { // Limit to top 10
        const player = playerData.player;
        const stats = playerData.statistics[0]; // Assuming one set of stats per player per season
        let value = 0;
        if (type === 'goals') value = stats.goals.total;
        else if (type === 'assists') value = stats.goals.assists;
        else if (type === 'yellowcards') value = stats.cards.yellow;
        else if (type === 'redcards') value = stats.cards.red;

        const playerItem = document.createElement('div');
        playerItem.className = 'ranking-item';
        playerItem.setAttribute('data-player-id', player.id);
        playerItem.setAttribute('data-player-name', player.name);
        playerItem.innerHTML = `
          <span class="ranking-position">${index + 1}.</span>
          <span class="ranking-name">
            <img src="${player.photo || 'https://placehold.co/20x20/cccccc/969696?text=P'}" alt="${player.name}" style="width:20px; height:20px; border-radius:50%; margin-right: 5px;">
            ${player.name} (${stats.team?.name || 'N/A'})
          </span>
          <span class="ranking-value">${value}</span>
        `;
        container.appendChild(playerItem);
      });
    } else {
      container.innerHTML = `<div class="no-matches">Tidak ada data ${title.toLowerCase()} untuk liga ini.</div>`;
    }
  }

  async function showPlayerPage() {
    hideAllMainContent();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.display = 'none';
    const playerPage = document.getElementById('player-page');
    if (playerPage) {
      playerPage.classList.add('active');

      const playerListContainer = document.getElementById('player-list-container');
      const playerDetailContainer = document.getElementById('player-detail-container');
      if (playerListContainer && playerDetailContainer) {
        playerListContainer.style.display = 'grid';
        playerDetailContainer.style.display = 'none';
      }

      await fetchSeasons();
      await fetchLeaguesForSeason(currentSeason);
      await fetchPlayers(currentSeason, currentLeagueId);

      // Render top players for default league (e.g., Premier League ID 39)
      const defaultLeagueId = 39; // Premier League
      await renderTopPlayers('top-scorers-list', 'Top Skor', 'goals', currentSeason, defaultLeagueId);
      await renderTopPlayers('top-assists-list', 'Top Assist', 'assists', currentSeason, defaultLeagueId);
      await renderTopPlayers('top-yellow-cards-list', 'Top Kartu Kuning', 'yellowcards', currentSeason, defaultLeagueId);
      await renderTopPlayers('top-red-cards-list', 'Top Kartu Merah', 'redcards', currentSeason, defaultLeagueId);
    }
  }
  // --- END NEW: Player Page Functions ---

  // --- NEW: Renamed showHomePage to showHomePageContent ---
  function showHomePageContent() {
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) sliderContainer.style.display = 'block';

    const dateNavContainer = document.querySelector('.date-navigation-wrapper');
    if (dateNavContainer) {
      dateNavContainer.style.display = 'flex';
    }
    const matchScheduleCard = document.getElementById('match-schedule-card');
    if (matchScheduleCard) matchScheduleCard.style.display = 'block';
    const homeContentContainer = document.getElementById('home-content-container');
    if (homeContentContainer) homeContentContainer.style.display = 'block';

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      if (window.innerWidth > 768) {
        sidebar.style.display = 'block';
      } else {
        sidebar.style.display = 'none';
      }
    }

    const activeTab = document.querySelector('#match-schedule-card .tab.active');
    renderMatches(activeTab ? activeTab.getAttribute('data-tab') : 'all');
  }

  // --- NEW: showHomePage now uses navigateTo ---
  function showHomePage() {
    navigateTo('home');
  }
  // --- END NEW ---

  function hideAllMainContent() {
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) sliderContainer.style.display = 'none';

    const dateNavContainer = document.querySelector('.date-navigation-wrapper');
    if (dateNavContainer) {
      dateNavContainer.style.display = 'none';
    }
    const matchScheduleCard = document.getElementById('match-schedule-card');
    if (matchScheduleCard) matchScheduleCard.style.display = 'none';
    const homeContentContainer = document.getElementById('home-content-container');
    if (homeContentContainer) homeContentContainer.style.display = 'none';

    document.querySelectorAll('.standings-page').forEach(page => page.classList.remove('active'));
    document.getElementById('match-detail-page')?.classList.remove('active');
    document.getElementById('team-detail-page')?.classList.remove('active');
    document.getElementById('news-page')?.classList.remove('active');
    document.getElementById('news-detail-page')?.classList.remove('active');
    document.getElementById('event-page')?.classList.remove('active');
    document.getElementById('player-page')?.classList.remove('active'); // Changed from 'transfer-page'
    document.getElementById('league-schedule-page')?.classList.remove('active');
    document.getElementById('country-leagues-page')?.classList.remove('active');
  }

  function updateNav(activeLinkId) {
    document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
    const activeLinkPC = document.getElementById(activeLinkId);
    if (activeLinkPC) activeLinkPC.classList.add('active');

    document.querySelectorAll('.bottom-nav a').forEach(link => link.classList.remove('active'));
    let bottomNavId;
    if (activeLinkId === 'home-link') bottomNavId = 'home-bottom';
    else if (activeLinkId === 'standings-link') bottomNavId = 'standings-bottom';
    else if (activeLinkId === 'news-link') bottomNavId = 'news-bottom';
    else if (activeLinkId === 'event-link') bottomNavId = 'event-bottom';
    else if (activeLinkId === 'player-link') bottomNavId = 'player-bottom'; // Changed from 'transfer-bottom'

    const activeLinkMobile = document.getElementById(bottomNavId);
    if (activeLinkMobile) activeLinkMobile.classList.add('active');
  }

  function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    if (!dateElement) return;

    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    dateElement.textContent = `${day}-${month}-${year}`;

    const activeTab = document.querySelector('.tab-container .tab.active');
    renderMatches(activeTab ? activeTab.getAttribute('data-tab') : 'all');
  }

  function initGlobalEventListeners() {
    document.body.addEventListener('click', function(event) {
      // Seluruh header liga bisa diklik (bukan hanya ikon panah), dan kelas
      // 'collapsed' di-toggle pada HEADER agar rotasi panah (CSS) bekerja benar.
      let target = event.target.closest('.league-header');
      if (target) {
        const matchContainer = target.nextElementSibling;
        if (matchContainer) {
          matchContainer.classList.toggle('active');
          target.classList.toggle('collapsed');
        }
        return;
      }

      // --- NEW: Modified match-row click listener ---
      let targetMatchRow = event.target.closest('.match-row');
      if (targetMatchRow && !event.target.closest('.match-action')) {
        const matchId = targetMatchRow.getAttribute('data-match-id');
        const leagueId = targetMatchRow.getAttribute('data-league-id');
        if (matchId && leagueId) {
          const homeTeamName = targetMatchRow.querySelector('.team:first-child .team-name')?.textContent.trim() || 'home-team';
          const awayTeamName = targetMatchRow.querySelector('.team:last-child .team-name')?.textContent.trim() || 'away-team';
          const matchSlug = `${homeTeamName.toLowerCase().replace(/\s+/g, '-')}-vs-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`;
          navigateTo(`match/${matchSlug}/${matchId}?league=${leagueId}`);
        }
        return;
      }
      // --- END NEW ---

      target = event.target.closest('.match-action.favorite');
      if (target) {
        target.classList.toggle('active');
        const icon = target.querySelector('i');
        if (icon) {
          icon.classList.toggle('far');
          icon.classList.toggle('fas');
        }

        const matchId = target.closest('.match-row')?.getAttribute('data-match-id');
        if (matchId) {
          if (target.classList.contains('active')) {
            if (!favoriteMatches.includes(matchId)) favoriteMatches.push(matchId);
          } else {
            favoriteMatches = favoriteMatches.filter(id => id !== matchId);
          }
          saveFavorites();
          updateFavoriteCount();
          if (document.getElementById('favorites')?.classList.contains('active')) {
            updateFavoritesTab();
          }
        }
        return;
      }

      target = event.target.closest('.match-action.standings');
      if (target) {
        const leagueId = target.getAttribute('data-league-id');
        if (leagueId) {
          showLeagueStandings(leagueId);
        }
        return;
      }

      // --- NEW: Modified league-item click listener ---
      target = event.target.closest('.sidebar .league-item, #league-sidebar .league-item, .league-sub-item');
      if (target) {
        const leagueId = target.getAttribute('data-league-id');
        if (leagueId) {
          const leagueName = target.querySelector('span')?.textContent.trim() || `Liga ID ${leagueId}`;
          const leagueSlug = leagueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          navigateTo(`league/${leagueSlug}/${leagueId}`);
          const sidebar = document.getElementById("league-sidebar");
          if (sidebar) sidebar.classList.remove("active");
        }
        return;
      }
      // --- END NEW ---

      target = event.target.closest('.country-item');
      if (target) {
        const subMenu = target.nextElementSibling;
        const isActive = target.classList.contains('active');

        document.querySelectorAll('.country-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.leagues-under-country').forEach(menu => {
          if (menu !== subMenu) {
            menu.style.display = 'none';
          }
        });

        if (!isActive) {
          target.classList.add('active');
          if (subMenu) {
            subMenu.style.display = 'block';
            const countryNameSpan = target.querySelector('.country-item-title span');
            if (countryNameSpan) {
              const countryName = countryNameSpan.textContent;
              if (subMenu.children.length === 0 || subMenu.querySelector('.loading-spinner')) {
                renderLeaguesForCountry(countryName, subMenu);
              }
            }
          }
        }
        return;
      }

      target = event.target.closest('.match-detail-tabs .tab');
      if (target) {
        const parent = target.closest('.match-detail');
        if (parent) {
          parent.querySelectorAll('.match-detail-tabs .tab').forEach(t => t.classList.remove('active'));
          target.classList.add('active');

          parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          const tabId = target.getAttribute('data-tab');
          const tabContentElement = parent.querySelector(`#${tabId}`);
          if (tabContentElement) {
            tabContentElement.classList.add('active');
          }
        }
        return;
      }

      target = event.target.closest('#match-schedule-card .tab');
      if (target) {
        document.querySelectorAll('#match-schedule-card .tab').forEach(t => t.classList.remove('active'));
        target.classList.add('active');

        document.querySelectorAll('#match-schedule-card .tab-content').forEach(c => c.classList.remove('active'));
        const tabId = target.getAttribute('data-tab');
        const tabContentElement = document.getElementById(tabId);
        if (tabContentElement) {
          tabContentElement.classList.add('active');
        }

        if (tabId === 'favorites') {
          updateFavoritesTab();
        } else {
          renderMatches(tabId);
        }
        return;
      }

      target = event.target.closest('.more-news-btn');
      if (target) {
        navigateTo('news'); // Use navigateTo
        return;
      }

      // --- NEW: Player page event listeners ---
      target = event.target.closest('#player-list-container .player-card, #team-squad-grid .team-player-card, #top-scorers-list .ranking-item, #top-assists-list .ranking-item, #top-yellow-cards-list .ranking-item, #top-red-cards-list .ranking-item');
      if (target) {
        const playerId = target.getAttribute('data-player-id');
        const playerSeason = target.getAttribute('data-player-season') || currentSeason; // Use currentSeason if not specified
        if (playerId) {
          const playerName = target.getAttribute('data-player-name') || 'player';
          const playerSlug = playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          navigateTo(`player/${playerSlug}/${playerId}?season=${playerSeason}`);
        }
        return;
      }

      target = event.target.closest('#player-search-button');
      if (target) {
        const season = document.getElementById('player-season-select')?.value;
        const league = document.getElementById('player-league-select')?.value;
        const search = document.getElementById('player-search-input')?.value;
        fetchPlayers(season, league, search);
        return;
      }
      // --- END NEW ---
    });

    // --- NEW: Player page select change listeners ---
    document.getElementById('player-season-select')?.addEventListener('change', async (e) => {
      currentSeason = e.target.value;
      await fetchLeaguesForSeason(currentSeason);
      currentLeagueId = null; // Reset league selection
      await fetchPlayers(currentSeason, currentLeagueId);
      // Re-render top players for the new season
      const defaultLeagueId = 39; // Premier League
      await renderTopPlayers('top-scorers-list', 'Top Skor', 'goals', currentSeason, defaultLeagueId);
      await renderTopPlayers('top-assists-list', 'Top Assist', 'assists', currentSeason, defaultLeagueId);
      await renderTopPlayers('top-yellow-cards-list', 'Top Kartu Kuning', 'yellowcards', currentSeason, defaultLeagueId);
      await renderTopPlayers('top-red-cards-list', 'Top Kartu Merah', 'redcards', currentSeason, defaultLeagueId);
    });

    document.getElementById('player-league-select')?.addEventListener('change', async (e) => {
      currentLeagueId = e.target.value;
      await fetchPlayers(currentSeason, currentLeagueId);
      // Re-render top players for the selected league
      await renderTopPlayers('top-scorers-list', 'Top Skor', 'goals', currentSeason, currentLeagueId);
      await renderTopPlayers('top-assists-list', 'Top Assist', 'assists', currentSeason, currentLeagueId);
      await renderTopPlayers('top-yellow-cards-list', 'Top Kartu Kuning', 'yellowcards', currentSeason, currentLeagueId);
      await renderTopPlayers('top-red-cards-list', 'Top Kartu Merah', 'redcards', currentSeason, currentLeagueId);
    });
    // --- END NEW ---
  }

  async function updateFavoritesTab() {
    const favoritesTab = document.getElementById('favorites');
    if (!favoritesTab) return;

    favoritesTab.innerHTML = '';

    if (favoriteMatches.length === 0) {
      favoritesTab.innerHTML = `
            <div class="no-matches">
                <h3>Belum ada pertandingan favorit</h3>
                <p>Klik ikon bintang untuk menambahkannya.</p>
            </div>`;
      return;
    }

    favoritesTab.innerHTML = '<div class="loading-spinner"></div><p>Memuat pertandingan favorit...</p>';

    const favoritesByLeague = {};
    for (const matchId of favoriteMatches) {
      const apiMatchDetails = await fetchDataFromRapidAPI('fixtures', {
        id: matchId
      });
      if (apiMatchDetails && apiMatchDetails.length > 0) {
        const apiMatch = apiMatchDetails[0];
        const leagueId = apiMatch.league.id;

        if (!favoritesByLeague[leagueId]) {
          favoritesByLeague[leagueId] = {
            league: {
              id: leagueId,
              name: apiMatch.league.name,
              logo: apiMatch.league.logo,
              country: apiMatch.league.country
            },
            matches: []
          };
        }

        let status = 'scheduled';
        let time = '';
        const fixtureStatus = apiMatch.fixture.status.short;

        if (['HT', '1H', '2H', 'ET', 'P', 'BT'].includes(fixtureStatus)) {
          status = 'live';
          time = apiMatch.fixture.status.elapsed ? `${apiMatch.fixture.status.elapsed}'` : 'Live';
        } else if (['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD', 'INT', 'WO'].includes(fixtureStatus)) {
          status = 'finished';
          time = fixtureStatus;
        } else {
          const matchDate = new Date(apiMatch.fixture.date);
          time = matchDate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        const match = {
          id: apiMatch.fixture.id,
          time: time,
          status: status,
          team1: {
            name: apiMatch.teams.home.name,
            logo: apiMatch.teams.home.logo,
            score: apiMatch.goals.home !== null ? apiMatch.goals.home : '-'
          },
          team2: {
            name: apiMatch.teams.away.name,
            logo: apiMatch.teams.away.logo,
            score: apiMatch.goals.away !== null ? apiMatch.goals.away : '-'
          },
          date: new Date(apiMatch.fixture.date),
          details: null
        };
        favoritesByLeague[leagueId].matches.push(match);
      }
    }

    favoritesTab.innerHTML = '';
    Object.keys(favoritesByLeague).forEach(leagueId => {
      const leagueData = favoritesByLeague[leagueId];
      const leagueElement = createLeagueElement(leagueId, leagueData.league, leagueData.matches);
      if (leagueElement) favoritesTab.appendChild(leagueElement);
    });
  }

  async function renderCountries() {
    const sidebarCountryList = document.getElementById('sidebar-country-list');
    const mobileSidebarCountryList = document.getElementById('mobile-sidebar-country-list');

    if (!sidebarCountryList || !mobileSidebarCountryList) return;

    sidebarCountryList.innerHTML = '<div class="loading-spinner"></div><p>Memuat negara...</p>';
    mobileSidebarCountryList.innerHTML = '<div class="loading-spinner"></div><p>Memuat negara...</p>';

    const allCountries = await fetchDataFromRapidAPI('countries');

    sidebarCountryList.innerHTML = '';
    mobileSidebarCountryList.innerHTML = '';

    if (allCountries && allCountries.length > 0) {
      allCountries.sort((a, b) => a.name.localeCompare(b.name));

      allCountries.forEach(country => {
        if (country.name) {
          const countryItemHTML = `
                        <div class="country-item">
                            <div class="country-item-title">
                                <img src="${country.flag || 'https://via.placeholder.com/20x15/cccccc/969696?text=?'}" alt="${country.name}" style="width:20px; height:15px;">
                                <span>${country.name}</span>
                            </div>
                            <i class="fas fa-chevron-down country-toggle"></i>
                        </div>
                        <div class="leagues-under-country">
                            <!-- Liga akan dimuat di sini saat negara diklik -->
                        </div>
                    `;
          sidebarCountryList.insertAdjacentHTML('beforeend', countryItemHTML);
          mobileSidebarCountryList.insertAdjacentHTML('beforeend', countryItemHTML);
        }
      });
    } else {
      sidebarCountryList.innerHTML = `<div class="no-matches">Tidak ada data negara.</div>`;
      mobileSidebarCountryList.innerHTML = `<div class="no-matches">Tidak ada data negara.</div>`;
    }
  }

  async function renderLeaguesForCountry(countryName, container) {
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"></div><p>Memuat liga...</p>';
    const leagues = await fetchDataFromRapidAPI('leagues', {
      country: countryName
    });

    container.innerHTML = '';
    if (leagues && leagues.length > 0) {
      leagues.sort((a, b) => a.league.name.localeCompare(b.league.name));
      leagues.forEach(apiLeague => {
        const leagueItem = document.createElement('div');
        leagueItem.className = 'league-sub-item';
        leagueItem.setAttribute('data-league-id', apiLeague.league.id);
        leagueItem.innerHTML = `
                    <img src="${apiLeague.league.logo}" alt="${apiLeague.league.name}">
                    <span>${apiLeague.league.name}</span>
                `;
        container.appendChild(leagueItem);
      });
    } else {
      container.innerHTML = `<div class="no-matches">Tidak ada liga untuk negara ini.</div>`;
    }
  }

  async function renderTopLeagues() {
    const sidebarLeagueList = document.getElementById('sidebar-league-list');
    const mobileSidebarLeagueList = document.getElementById('mobile-sidebar-league-list');

    if (!sidebarLeagueList || !mobileSidebarLeagueList) return;

    sidebarLeagueList.innerHTML = '<div class="loading-spinner"></div><p>Memuat liga populer...</p>';
    mobileSidebarLeagueList.innerHTML = '<div class="loading-spinner"></div><p>Memuat liga populer...</p>';

    // --- PERUBAHAN: Tambahkan Liga Indonesia di atas ---
    const popularLeagueIds = [
      274, // Liga 1 Indonesia - DI ATAS
      275, // Liga 2 Indonesia - DI ATAS
      39, // Premier League
      78, // Bundesliga
      135, // Serie A
      61, // Ligue 1
      88, // Eredivisie
      140, // La Liga
      144, // Super Lig
      2, // Champions League
      207, // Liga Portugal
      253, // MLS
    ];

    // PERF: ambil semua liga secara paralel (sebelumnya 13 request berurutan).
    const leagueInfos = await Promise.all(
      popularLeagueIds.map(id => fetchDataFromRapidAPI('leagues', { id: id }))
    );
    const allPopularLeagues = leagueInfos
      .filter(info => info && info.length > 0)
      .map(info => info[0].league);

    sidebarLeagueList.innerHTML = '';
    mobileSidebarLeagueList.innerHTML = '';

    if (allPopularLeagues.length > 0) {
      allPopularLeagues.forEach(league => {
        const leagueItemHTML = `
                    <div class="league-item" data-league-id="${league.id}">
                        <img src="${league.logo}" alt="${league.name}">
                        <span>${league.name}</span>
                    </div>
                `;
        sidebarLeagueList.insertAdjacentHTML('beforeend', leagueItemHTML);
        mobileSidebarLeagueList.insertAdjacentHTML('beforeend', leagueItemHTML);
      });
    } else {
      sidebarLeagueList.innerHTML = `<div class="no-matches">Tidak ada liga populer yang ditemukan.</div>`;
      mobileSidebarLeagueList.innerHTML = `<div class="no-matches">Tidak ada liga populer yang ditemukan.</div>`;
    }
  }

  // --- NEW: Modified navigation event listeners to use navigateTo ---
  document.getElementById('standings-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('standings');
  });

  document.getElementById('home-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
  });

  document.getElementById('news-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('news');
  });

  document.getElementById('event-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('events');
  });

  document.getElementById('player-link')?.addEventListener('click', (e) => { // Changed from 'transfer-link'
    e.preventDefault();
    navigateTo('player'); // Changed from 'transfers'
  });

  document.getElementById('prev-date')?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay();
  });

  document.getElementById('next-date')?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay();
  });

  document.querySelector('.close-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('standings-modal');
    if (modal) modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('standings-modal');
    if (modal && e.target == modal) {
      modal.style.display = 'none';
    }
  });

  const sliderTrack = document.querySelector('.slider-track');
  const sliderItems = document.querySelectorAll('.slider-item');
  const prevBtn = document.querySelector('.slider-nav.prev');
  const nextBtn = document.querySelector('.slider-nav.next');
  const sliderDotsContainer = document.querySelector('.slider-dots');
  let currentIndex = 0;
  const totalItems = eventData.length; // MODIFIED: Use eventData length for slider

  // --- MODIFIED: Slider initialization to use eventData ---
  if (sliderTrack && eventData.length > 0 && prevBtn && nextBtn && sliderDotsContainer) {
    sliderTrack.innerHTML = eventData.map((event, index) => `
      <div class="slider-item" data-event-index="${index}" role="group" aria-label="Banner ${index + 1} of ${totalItems}">
        <img src="${event.img}" alt="${event.alt}">
      </div>
    `).join('');

    for (let i = 0; i < totalItems; i++) {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      dot.setAttribute('data-index', i);
      sliderDotsContainer.appendChild(dot);
      dot.addEventListener('click', () => goToSlide(i));
    }
    const dots = document.querySelectorAll('.slider-dots .dot'); // Select dots specifically

    function updateSlider() {
      sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    function goToSlide(index) {
      currentIndex = index;
      updateSlider();
    }

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex === 0) ? totalItems - 1 : currentIndex - 1;
      updateSlider();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex === totalItems - 1) ? 0 : currentIndex + 1;
      updateSlider();
    });

    let autoSlideInterval = setInterval(() => {
      currentIndex = (currentIndex === totalItems - 1) ? 0 : currentIndex + 1;
      updateSlider();
    }, 5000);

    sliderTrack.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    sliderTrack.addEventListener('mouseleave', () => {
      autoSlideInterval = setInterval(() => {
        currentIndex = (currentIndex === totalItems - 1) ? 0 : currentIndex + 1;
        updateSlider();
      }, 5000);
    });

    // --- MODIFIED: Slider item click to handle links ---
    sliderTrack.querySelectorAll('.slider-item').forEach(item => {
      item.addEventListener('click', () => {
        const eventIndex = parseInt(item.getAttribute('data-event-index'));
        const eventLink = eventData[eventIndex]?.link;
        if (eventLink) {
          window.open(eventLink, '_blank'); // Open link in new tab
        } else {
          navigateTo('events'); // Fallback to events page if no specific link
        }
      });
    });
    // --- END MODIFIED ---

    updateSlider();
  }
  // --- END MODIFIED ---

  document.getElementById('home-bottom')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
  });

  document.querySelectorAll('.bottom-nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.bottom-nav a').forEach(navLink => navLink.classList.remove('active'));
      link.classList.add('active');

      if (link.id === "standings-bottom") {
        navigateTo('standings');
      } else if (link.id === "news-bottom") {
        navigateTo('news');
      } else if (link.id === "event-bottom") {
        navigateTo('events');
      } else if (link.id === "player-bottom") { // Changed from "transfer-bottom"
        navigateTo('player'); // Changed from "transfers"
      } else if (link.id === "home-bottom") {
        navigateTo('home');
      }
    });
  });
  // --- END NEW ---

  const sidebar = document.getElementById("league-sidebar");
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const closeBtn = document.getElementById("close-league-sidebar");

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      if (sidebar) sidebar.classList.add("active");
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (sidebar) sidebar.classList.remove("active");
    });
  }

  document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('league-sidebar');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    if (sidebar && toggleBtn && sidebar.classList.contains('active') && !sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
      sidebar.classList.remove('active');
    }
  });

  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchToggle = document.getElementById('search-toggle');
  const closeSearchBtn = document.getElementById('close-search');

  const desktopSearchContainer = document.getElementById('desktop-search-container');
  const desktopSearchInput = document.getElementById('desktop-search-input');
  const desktopSearchIcon = document.getElementById('desktop-search-icon');

  let isDesktopSearchOverlayActive = false;

  function closeSearchOverlay() {
    if (searchOverlay) searchOverlay.style.display = 'none';
    if (searchInput) searchInput.value = '';
    if (desktopSearchInput) desktopSearchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
    if (desktopSearchContainer) desktopSearchContainer.classList.remove('active');
    isDesktopSearchOverlayActive = false;
  }

  async function performSearch(query) {
    if (!searchResults) return;

    searchResults.innerHTML = '<div class="loading-spinner"></div><p>Mencari...</p>';
    const lowerCaseQuery = query.toLowerCase();
    let resultsHtml = '';
    let hasResults = false;

    // Pencarian Berita dari WordPress
    const wordpressPosts = await fetchWordPressPosts({ search: query, per_page: 5, _embed: true });
    if (wordpressPosts && wordpressPosts.length > 0) {
      resultsHtml += `<h4>Berita</h4>`;
      wordpressPosts.forEach(post => {
        const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://placehold.co/60x60/cccccc/969696?text=N';
        resultsHtml += `
          <div class="search-result-item" data-type="news" data-id="${post.id}" data-slug="${post.slug}">
            <img src="${featuredImage}" alt="${post.title.rendered}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">
            <span>${post.title.rendered}</span>
            <span class="result-type">Berita</span>
          </div>
        `;
      });
      hasResults = true;
    }

    const filteredEvents = eventData.filter(e =>
      e.title.toLowerCase().includes(lowerCaseQuery)
    );
    if (filteredEvents.length > 0) {
      resultsHtml += `<h4>Event</h4>`;
      filteredEvents.forEach(event => {
        resultsHtml += `
          <div class="search-result-item" data-type="event" data-title="${event.title}" data-link="${event.link || ''}">
            <img src="${event.img}" alt="${event.title}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">
            <span>${event.title}</span>
            <span class="result-type">Event</span>
          </div>
        `;
      });
      hasResults = true;
    }

    // NEW: Search for Players
    const apiPlayers = await fetchDataFromRapidAPI('players', { search: query, season: currentSeason });
    if (apiPlayers && apiPlayers.length > 0) {
      resultsHtml += `<h4>Pemain</h4>`;
      apiPlayers.forEach(playerData => {
        const player = playerData.player;
        const playerSlug = player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        resultsHtml += `
          <div class="search-result-item" data-type="player" data-id="${player.id}" data-slug="${playerSlug}" data-season="${currentSeason}">
            <img src="${player.photo || 'https://placehold.co/30x30/cccccc/969696?text=P'}" alt="${player.name}">
            <span>${player.name} (${playerData.statistics[0]?.team?.name || 'N/A'})</span>
            <span class="result-type">Pemain</span>
          </div>
        `;
      });
      hasResults = true;
    }

    const apiLeagues = await fetchDataFromRapidAPI('leagues', { search: query });
    if (apiLeagues && apiLeagues.length > 0) {
        resultsHtml += `<h4>Liga</h4>`;
        apiLeagues.forEach(apiLeague => {
            const leagueSlug = apiLeague.league.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            resultsHtml += `
                <div class="search-result-item" data-type="league" data-id="${apiLeague.league.id}" data-slug="${leagueSlug}">
                    <img src="${apiLeague.league.logo}" alt="${apiLeague.league.name}">
                    <span>${apiLeague.league.name} (${apiLeague.country.name})</span>
                    <span class="result-type">Liga</span>
                </div>
            `;
        });
        hasResults = true;
    }

    const apiTeams = await fetchDataFromRapidAPI('teams', { search: query });
    if (apiTeams && apiTeams.length > 0) {
        resultsHtml += `<h4>Tim</h4>`;
        apiTeams.forEach(apiTeam => {
            const teamSlug = apiTeam.team.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            resultsHtml += `
                <div class="search-result-item" data-type="team" data-id="${apiTeam.team.id}" data-slug="${teamSlug}">
                    <img src="${apiTeam.team.logo}" alt="${apiTeam.team.name}">
                    <span>${apiTeam.team.name} (${apiTeam.team.country})</span>
                    <span class="result-type">Tim</span>
                </div>
            `;
        });
        hasResults = true;
    }

    const dateFormatted = currentDate.toISOString().split('T')[0];
    const apiFixtures = await fetchDataFromRapidAPI('fixtures', { date: dateFormatted });
    if (apiFixtures && apiFixtures.length > 0) {
        const filteredFixtures = apiFixtures.filter(apiMatch =>
            apiMatch.teams.home.name.toLowerCase().includes(lowerCaseQuery) ||
            apiMatch.teams.away.name.toLowerCase().includes(lowerCaseQuery) ||
            apiMatch.league.name.toLowerCase().includes(lowerCaseQuery)
        );
        if (filteredFixtures.length > 0) {
            resultsHtml += `<h4>Pertandingan Hari Ini</h4>`;
            filteredFixtures.forEach(apiMatch => {
                const homeTeamName = apiMatch.teams.home.name;
                const awayTeamName = apiMatch.teams.away.name;
                const matchSlug = `${homeTeamName.toLowerCase().replace(/\s+/g, '-')}-vs-${awayTeamName.toLowerCase().replace(/\s+/g, '-')}`;
                resultsHtml += `
                    <div class="search-result-item" data-type="match" data-id="${apiMatch.fixture.id}" data-league-id="${apiMatch.league.id}" data-slug="${matchSlug}">
                        <img src="${apiMatch.teams.home.logo}" alt="${apiMatch.teams.home.name}">
                        <span>${apiMatch.teams.home.name} vs ${apiMatch.teams.away.name} (${apiMatch.league.name})</span>
                        <span class="result-type">Pertandingan</span>
                    </div>
                `;
            });
            hasResults = true;
        }
    }

    if (!hasResults) {
      searchResults.innerHTML = '<div class="no-matches">Tidak ada hasil ditemukan.</div>';
    } else {
      searchResults.innerHTML = resultsHtml;
    }
  }

  searchToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    if (searchOverlay) {
      searchOverlay.style.display = 'block';
      if (searchInput) searchInput.focus();
      if (searchResults) searchResults.innerHTML = '';
      isDesktopSearchOverlayActive = false;
    }
  });

  let desktopSearchTimeout;
  desktopSearchInput?.addEventListener('input', () => {
    clearTimeout(desktopSearchTimeout);
    const query = desktopSearchInput.value.trim();
    if (query.length > 2) {
      if (searchOverlay) searchOverlay.style.display = 'block';
      isDesktopSearchOverlayActive = true;
      desktopSearchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      if (searchResults) searchResults.innerHTML = '';
      if (searchOverlay) searchOverlay.style.display = 'none';
      isDesktopSearchOverlayActive = false;
    }
  });

  desktopSearchIcon?.addEventListener('click', () => {
    const query = desktopSearchInput.value.trim();
    if (query.length > 2) {
      if (searchOverlay) searchOverlay.style.display = 'block';
      isDesktopSearchOverlayActive = true;
      performSearch(query);
    } else {
      if (searchOverlay) searchOverlay.style.display = 'none';
      isDesktopSearchOverlayActive = false;
    }
  });

  closeSearchBtn?.addEventListener('click', closeSearchOverlay);

  document.addEventListener('click', function(event) {
    const desktopSearchContainer = document.getElementById('desktop-search-container');
    const searchOverlay = document.getElementById('search-overlay');
    const searchToggle = document.getElementById('search-toggle');
    const desktopSearchIcon = document.getElementById('desktop-search-icon'); // Corrected to desktopSearchIcon
    const desktopSearchInput = document.getElementById('desktop-search-input');

    if (searchOverlay && searchOverlay.style.display === 'block' &&
        !searchOverlay.contains(event.target) &&
        (!searchToggle || !searchToggle.contains(event.target)) &&
        (!desktopSearchIcon || !desktopSearchIcon.contains(event.target)) &&
        (!desktopSearchInput || !desktopSearchInput.contains(event.target))
    ) {
        closeSearchOverlay();
    }
  });

  // --- NEW: Modified search results click listener ---
  searchResults?.addEventListener('click', (e) => {
    const resultItem = e.target.closest('.search-result-item');
    if (resultItem) {
      const type = resultItem.getAttribute('data-type');
      const id = resultItem.getAttribute('data-id');
      const slug = resultItem.getAttribute('data-slug');
      const leagueId = resultItem.getAttribute('data-league-id');
      const season = resultItem.getAttribute('data-season'); // For player search
      const eventLink = resultItem.getAttribute('data-link'); // For event search

      closeSearchOverlay();
      if (type === 'news') {
        navigateTo(`news/${slug}/${id}`);
      } else if (type === 'league') {
        navigateTo(`league/${slug}/${id}`);
      } else if (type === 'team') {
        navigateTo(`team/${slug}/${id}`);
      } else if (type === 'match') {
        navigateTo(`match/${slug}/${id}?league=${leagueId}`);
      } else if (type === 'player') { // Handle player search result click
        navigateTo(`player/${slug}/${id}?season=${season}`);
      } else if (type === 'event') { // For static event data, just navigate to events page
        if (eventLink) {
          window.open(eventLink, '_blank');
        } else {
          navigateTo('events');
        }
      }
    }
  });
  // --- END NEW ---
// GANTI welcome popup logic dengan ini di script.js:

// Image Popup Logic
const imagePopup = document.getElementById('image-popup');
const closePopupBtn = document.getElementById('close-popup');
const closeTodayBtn = document.getElementById('close-today');
const popupLink = document.getElementById('popup-link');
const popupImage = document.getElementById('popup-image');

// Function to show popup
function showImagePopup() {
    // Tampilkan popup setelah 2 detik
    setTimeout(() => {
        if (imagePopup) {
            imagePopup.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            
            // Optional: Add pulse animation
            const popupContent = imagePopup.querySelector('.popup-content');
            if (popupContent) {
                setTimeout(() => {
                    popupContent.classList.add('pulse');
                }, 1000);
            }
        }
    }, 2000);
}

// Function to close popup
function closeImagePopup() {
    if (imagePopup) {
        imagePopup.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Function to close popup for today
function closePopupForToday() {
    closeImagePopup();
    const today = new Date().toDateString();
    localStorage.setItem('popupClosedDate', today);
}

// Cek jika popup sudah ditutup hari ini
function shouldShowPopup() {
    const today = new Date().toDateString();
    const lastClosedDate = localStorage.getItem('popupClosedDate');
    const popupNeverShown = !localStorage.getItem('popupShown');
    
    // Tampilkan jika:
    // 1. Belum pernah ditampilkan sama sekali, ATAU
    // 2. Sudah lebih dari 3 jam sejak terakhir ditutup, ATAU
    // 3. Hari berbeda dari terakhir ditutup
    if (popupNeverShown) {
        return true;
    }
    
    if (lastClosedDate !== today) {
        return true;
    }
    
    // Cek jika sudah lebih dari 3 jam
    const lastClosedTime = localStorage.getItem('popupClosedTime');
    if (lastClosedTime) {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - parseInt(lastClosedTime);
        const threeHours = 3 * 60 * 60 * 1000; // 3 jam dalam milidetik
        return timeDiff > threeHours;
    }
    
    return false;
}

// Event Listeners untuk popup
if (closePopupBtn) {
    closePopupBtn.addEventListener('click', function() {
        closeImagePopup();
        localStorage.setItem('popupShown', 'true');
        localStorage.setItem('popupClosedTime', new Date().getTime());
    });
}

if (closeTodayBtn) {
    closeTodayBtn.addEventListener('click', closePopupForToday);
}

// Link tracking untuk analytics
if (popupLink) {
    popupLink.addEventListener('click', function() {
        console.log('Popup banner clicked, redirecting to:', this.href);
        // Simpan event ke localStorage
        localStorage.setItem('popupClicked', 'true');
        localStorage.setItem('popupClickTime', new Date().getTime());
        
        // Optional: Bisa tambahkan tracking ke Google Analytics di sini
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', 'popup_click', {
        //         'event_category': 'engagement',
        //         'event_label': 'popup_banner'
        //     });
        // }
    });
}

// Handle image error
if (popupImage) {
    popupImage.addEventListener('error', function() {
        console.log('Popup image failed to load:', this.src);
        // Fallback ke placeholder
        this.src = 'https://via.placeholder.com/500x600/1e3c72/ffffff?text=Promo+Spesial+Layarskor';
    });
    
    // Preload image untuk menghindari delay
    popupImage.addEventListener('load', function() {
        console.log('Popup image loaded successfully');
    });
}

// Tutup popup saat klik di luar konten
if (imagePopup) {
    imagePopup.addEventListener('click', function(e) {
        if (e.target === imagePopup) {
            closeImagePopup();
            localStorage.setItem('popupShown', 'true');
            localStorage.setItem('popupClosedTime', new Date().getTime());
        }
    });
}

// Tutup popup dengan tombol ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && imagePopup && imagePopup.style.display === 'flex') {
        closeImagePopup();
        localStorage.setItem('popupShown', 'true');
        localStorage.setItem('popupClosedTime', new Date().getTime());
    }
});

// Cek dan tampilkan popup jika diperlukan
if (shouldShowPopup() && imagePopup) {
    showImagePopup();
    localStorage.setItem('popupShown', 'true');
}

// Optional: Auto-hide popup setelah 10 detik
if (imagePopup) {
    setTimeout(() => {
        if (imagePopup.style.display === 'flex') {
            // Tambahkan kelas untuk exit animation
            const popupContent = imagePopup.querySelector('.popup-content');
            if (popupContent) {
                popupContent.style.animation = 'slideUp 0.5s ease reverse';
            }
            
            setTimeout(() => {
                closeImagePopup();
                localStorage.setItem('popupClosedTime', new Date().getTime());
            }, 500);
        }
    }, 10000); // 10 detik
}
  // Initial renders
  renderNews('#home-news-grid');
  renderTopLeagues();
  renderCountries();
  updateDateDisplay();
  initGlobalEventListeners();

  // --- NEW: Handle initial page load based on URL ---
  handleRouteChange(window.location.pathname + window.location.search);
  // --- END NEW ---
});