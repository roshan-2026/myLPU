/**
 * MyLPU.online — Core Client Logic (Pure Vanilla JS)
 * - Dynamic Time-based Greeting
 * - Real Date Calendar & Date Switcher (DD MMM format, Prev/Next buttons)
 * - Automatic Day, Date & Meal Period Detection
 * - Settings Modal & Navigation Drawer
 * - 3D Map View Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  initDynamicGreeting();
  initMessMenu();
  initSettingsAndDrawer();
});

/* ==========================================================================
   1. Dynamic Greeting (Morning, Afternoon, Evening)
   ========================================================================== */
function initDynamicGreeting() {
  const greetingTextEl = document.getElementById('greeting-text');
  const greetingEl = document.getElementById('dynamic-greeting');
  if (!greetingTextEl && !greetingEl) return;

  const now = new Date();
  const hour = now.getHours();
  let greeting = 'Good morning, Student';

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon, Student';
  } else if (hour >= 17 || hour < 5) {
    greeting = 'Good evening, Student';
  }

  if (greetingTextEl) {
    greetingTextEl.textContent = greeting;
  } else if (greetingEl) {
    greetingEl.innerHTML = `<span>${greeting}</span> <span class="wave-emoji" aria-hidden="true">👋</span>`;
  }
}

/* ==========================================================================
   2. Hostel Mess & Menu with Real Dates & Date Navigation (< / >)
   ========================================================================== */
function initMessMenu() {
  const menuContainer = document.getElementById('meals-grid-container');
  if (!menuContainer || !window.MESS_MENU_DATA) return;

  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  
  // Anchor date for weekly navigation (defaults to today)
  let currentAnchorDate = new Date(today);
  let selectedDate = new Date(today);

  // Determine current active meal key based on local time
  function getCurrentActiveMealKey() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Breakfast: 07:00 to 10:30 (420 to 630 mins)
    if (totalMinutes >= 420 && totalMinutes < 630) {
      return 'breakfast';
    }
    // Lunch: 10:30 to 16:00 (630 to 960 mins)
    if (totalMinutes >= 630 && totalMinutes < 960) {
      return 'lunch';
    }
    // Snacks: 16:00 to 18:45 (960 to 1125 mins)
    if (totalMinutes >= 960 && totalMinutes < 1125) {
      return 'snacks';
    }
    // Dinner: 18:45 to 22:30 (1125 to 1350 mins)
    if (totalMinutes >= 1125 && totalMinutes < 1350) {
      return 'dinner';
    }
    // Night hours: upcoming breakfast
    return 'breakfast';
  }

  // Helper to format date as "11 NOV", "01 NOV", etc.
  function formatDateMonth(d) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
  }

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Get Sunday of the anchor week
  function getSundayOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay(); // 0 is Sunday
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Determine 14-day cycle info for any calendar date:
   * Anchor: November 1, 2026 is Sunday, Day 8 (Week 2 Cycle).
   * 14-day loop:
   *   Days 1..7  = Week 1 (Sunday to Saturday)
   *   Days 8..14 = Week 2 (Sunday to Saturday)
   */
  function getCycleInfo(targetDate) {
    const anchorDate = new Date(2026, 10, 1); // 2026-11-01 (Month 10 = November)
    anchorDate.setHours(0, 0, 0, 0);

    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - anchorDate.getTime()) / 86400000);
    // Nov 1, 2026 is Day 8 -> index 7 in 0-based 14-day cycle
    const cycleIndex = ((7 + (diffDays % 14)) % 14 + 14) % 14;
    const dayNumber = cycleIndex + 1; // 1 to 14
    const cycleWeek = cycleIndex < 7 ? 'week1' : 'week2';
    const weekLabel = cycleIndex < 7 ? 'Week 1' : 'Week 2';

    const dayOfWeekIndex = target.getDay(); // 0 is Sunday
    const dayKey = dayKeys[dayOfWeekIndex];

    return {
      cycleWeek,
      weekLabel,
      dayNumber,
      dayKey,
      diffDays
    };
  }

  // Render Real Dates Strip
  function renderDateStrip() {
    const strip = document.getElementById('real-dates-strip');
    const rangeBadge = document.getElementById('date-range-badge');
    if (!strip) return;

    strip.innerHTML = '';
    const sunday = getSundayOfWeek(currentAnchorDate);
    const dayNamesShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    if (rangeBadge) {
      rangeBadge.textContent = `${formatDateMonth(sunday)} — ${formatDateMonth(saturday)}`;
    }

    for (let i = 0; i < 7; i++) {
      const curDate = new Date(sunday);
      curDate.setDate(sunday.getDate() + i);

      const isCurrentSelected = isSameDay(curDate, selectedDate);
      const isTodayDate = isSameDay(curDate, today);

      const tile = document.createElement('button');
      tile.className = `real-date-tile ${isCurrentSelected ? 'active' : ''}`;
      tile.type = 'button';
      tile.setAttribute('aria-label', `Select ${formatDateMonth(curDate)} ${dayNamesShort[i]}`);

      tile.innerHTML = `
        <span class="real-date-text">${formatDateMonth(curDate)}</span>
        <span class="real-day-name">${dayNamesShort[i]}</span>
      `;

      tile.addEventListener('click', () => {
        selectedDate = new Date(curDate);
        document.querySelectorAll('.real-date-tile').forEach(t => t.classList.remove('active'));
        tile.classList.add('active');
        renderMenuCards();
      });

      strip.appendChild(tile);
    }
  }

  // Prev & Next Buttons
  const prevBtn = document.getElementById('btn-prev-week');
  const nextBtn = document.getElementById('btn-next-week');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentAnchorDate.setDate(currentAnchorDate.getDate() - 7);
      selectedDate.setDate(selectedDate.getDate() - 7);
      renderDateStrip();
      renderMenuCards();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentAnchorDate.setDate(currentAnchorDate.getDate() + 7);
      selectedDate.setDate(selectedDate.getDate() + 7);
      renderDateStrip();
      renderMenuCards();
    });
  }

  // Tab switching: Timing vs Menu
  const tabTimingBtn = document.getElementById('tab-btn-timing');
  const tabMenuBtn = document.getElementById('tab-btn-menu');
  const tabTimingContent = document.getElementById('tab-content-timing');
  const tabMenuContent = document.getElementById('tab-content-menu');

  if (tabTimingBtn && tabMenuBtn) {
    tabTimingBtn.addEventListener('click', () => {
      tabTimingBtn.classList.add('active');
      tabMenuBtn.classList.remove('active');
      if (tabTimingContent) tabTimingContent.style.display = 'block';
      if (tabMenuContent) tabMenuContent.style.display = 'none';
    });

    tabMenuBtn.addEventListener('click', () => {
      tabMenuBtn.classList.add('active');
      tabTimingBtn.classList.remove('active');
      if (tabTimingContent) tabTimingContent.style.display = 'none';
      if (tabMenuContent) tabMenuContent.style.display = 'block';
      renderDateStrip();
      renderMenuCards();
    });
  }

  // Check URL params for direct menu landing
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'menu' && tabMenuBtn) {
    tabMenuBtn.click();
  }

  // Render the 4 meal cards
  function renderMenuCards() {
    // 14-day loop anchored to Nov 1, 2026 (Sunday Day 8 = Week 2)
    const cycleInfo = getCycleInfo(selectedDate);
    const cycleWeek = cycleInfo.cycleWeek;
    const dayKey = cycleInfo.dayKey;

    const weekData = window.MESS_MENU_DATA.weeks[cycleWeek];
    if (!weekData) return;

    const dayData = weekData.days[dayKey];
    if (!dayData) return;

    // Update banner text with real date and cycle day
    const bannerHeading = document.getElementById('menu-selected-day-heading');
    const bannerCycle = document.getElementById('menu-selected-cycle-tag');
    
    if (bannerHeading) {
      bannerHeading.textContent = `${dayData.dayName}, ${formatDateMonth(selectedDate)} Menu`;
    }
    if (bannerCycle) {
      bannerCycle.textContent = `${cycleInfo.weekLabel} • Day ${cycleInfo.dayNumber}`;
    }

    const currentActiveMeal = getCurrentActiveMealKey();
    const isToday = isSameDay(selectedDate, today);

    menuContainer.innerHTML = '';

    const mealKeys = ['breakfast', 'lunch', 'snacks', 'dinner'];
    const mealIcons = {
      breakfast: 'assets/icons/sunrise.svg',
      lunch: 'assets/icons/fork-knife.svg',
      snacks: 'assets/icons/cookie.svg',
      dinner: 'assets/icons/cloche.svg'
    };

    mealKeys.forEach((mKey) => {
      const meal = dayData.meals[mKey];
      if (!meal) return;

      const isMealActiveNow = isToday && (mKey === currentActiveMeal);

      const card = document.createElement('article');
      card.className = `meal-card ${isMealActiveNow ? 'current-active-meal' : ''}`;

      let rowsHtml = '';
      meal.categories.forEach((row) => {
        let accHtml = '';
        if (row.accompaniment) {
          accHtml = `<span class="accompaniment-pill">+ ${escapeHtml(row.accompaniment)}</span>`;
        }
        rowsHtml += `
          <div class="food-row">
            <span class="category-label">${escapeHtml(row.category)}</span>
            <div class="items-content">
              <span>${escapeHtml(row.items.join(', '))}</span>
              ${accHtml}
            </div>
          </div>
        `;
      });

      card.innerHTML = `
        ${isMealActiveNow ? '<span class="active-meal-badge">Serving Now</span>' : ''}
        <div class="meal-card-top">
          <div class="meal-icon-frame">
            <img src="${mealIcons[mKey] || 'assets/icons/utensils.svg'}" alt="${meal.name} Icon" width="22" height="22">
          </div>
          <div>
            <h3 class="meal-card-title">${meal.name}</h3>
            <p class="meal-card-timing">${meal.timing}</p>
          </div>
        </div>
        <div class="meal-food-rows">
          ${rowsHtml}
        </div>
      `;

      menuContainer.appendChild(card);
    });
  }

  // Initial renders
  renderDateStrip();
  renderMenuCards();
}


function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   3. Settings Modal & Navigation Drawer
   ========================================================================== */
function initSettingsAndDrawer() {
  // Settings Modal
  const settingsBtn = document.getElementById('settings-toggle-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsClose = document.getElementById('settings-close-btn');
  const settingsBackdrop = document.getElementById('settings-backdrop');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'block';
    });
  }

  const closeSettings = () => {
    if (settingsModal) settingsModal.style.display = 'none';
  };

  if (settingsClose) settingsClose.addEventListener('click', closeSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener('click', closeSettings);

  // Navigation Drawer
  const menuBtn = document.getElementById('menu-toggle-btn');
  const drawer = document.getElementById('nav-drawer');
  const drawerClose = document.getElementById('drawer-close-btn');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      drawer.style.display = 'block';
    });
  }

  const closeDrawer = () => {
    if (drawer) drawer.style.display = 'none';
  };

  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
}
