/**
 * MyLPU.online — Core Client Logic (Pure Vanilla JS)
 * - Dynamic Time-based Greeting
 * - Real Date Calendar & Date Switcher (DD MMM format, Prev/Next buttons)
 * - Automatic Day, Date & Meal Period Detection
 * - Settings Modal & Navigation Drawer
 * - 3D Map View Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  try { initDynamicGreeting(); } catch (e) { console.error('Greeting init error:', e); }
  try { initMessMenu(); } catch (e) { console.error('Mess menu init error:', e); }
  try { initSettingsAndDrawer(); } catch (e) { console.error('Settings init error:', e); }
  try { initBackButton(); } catch (e) { console.error('Back button init error:', e); }
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

  // Determine current active meal key based on local time and verified schedule
  function getCurrentActiveMealKey(dateToCheck) {
    const now = dateToCheck || new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const isSunday = (now.getDay() === 0);

    // Verified Serving Time Windows:
    // Regular Days (Mon - Sat):
    //   Breakfast: 07:30 AM to 09:30 AM (450 to 570 mins)
    //   Lunch:     11:30 AM to 03:00 PM (690 to 900 mins)
    //   Snacks:    05:00 PM to 06:30 PM (1020 to 1110 mins)
    //   Dinner:    07:30 PM to 09:30 PM (1170 to 1290 mins)
    //
    // Sundays:
    //   Breakfast: 08:00 AM to 10:00 AM (480 to 600 mins)
    //   Lunch:     12:30 PM to 03:00 PM (750 to 900 mins)
    //   Snacks:    05:00 PM to 06:30 PM (1020 to 1110 mins)
    //   Dinner:    07:30 PM to 09:30 PM (1170 to 1290 mins)

    if (isSunday) {
      if (totalMinutes >= 480 && totalMinutes <= 600) return 'breakfast';
      if (totalMinutes >= 750 && totalMinutes <= 900) return 'lunch';
    } else {
      if (totalMinutes >= 450 && totalMinutes <= 570) return 'breakfast';
      if (totalMinutes >= 690 && totalMinutes <= 900) return 'lunch';
    }

    if (totalMinutes >= 1020 && totalMinutes <= 1110) return 'snacks';
    if (totalMinutes >= 1170 && totalMinutes <= 1290) return 'dinner';

    // Strictly null outside verified serving windows (e.g. 07:00 AM, 03:30 PM, 10:00 PM, 02:00 AM)
    return null;
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

    // Dynamic verified timings: Sunday timings on Sundays, regular timings on Mon-Sat
    const isSelectedSunday = (selectedDate.getDay() === 0);
    const mealTimings = {
      regular: {
        breakfast: '07:30 AM – 09:30 AM',
        lunch: '11:30 AM – 03:00 PM',
        snacks: '05:00 PM – 06:30 PM',
        dinner: '07:30 PM – 09:30 PM'
      },
      sunday: {
        breakfast: '08:00 AM – 10:00 AM',
        lunch: '12:30 PM – 03:00 PM',
        snacks: '05:00 PM – 06:30 PM',
        dinner: '07:30 PM – 09:30 PM'
      }
    };
    const activeTimings = isSelectedSunday ? mealTimings.sunday : mealTimings.regular;

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
      card.id = `meal-card-${mKey}`;
      card.className = `meal-card ${isMealActiveNow ? 'current-active-meal' : ''}`;

      let rowsHtml = '';
      meal.categories.forEach((row) => {
        let accHtml = '';
        if (row.accompaniment) {
          accHtml = `<span class="accompaniment-pill">+ ${escapeHtml(row.accompaniment)}</span>`;
        }
        const isDessert = row.category.toUpperCase().includes('DESSERT');
        rowsHtml += `
          <div class="food-row ${isDessert ? 'food-row-dessert' : ''}">
            <span class="category-label ${isDessert ? 'category-label-dessert' : ''}">${isDessert ? '🍨 ' : ''}${escapeHtml(row.category)}</span>
            <div class="items-content ${isDessert ? 'dessert-items-content' : ''}">
              <span class="${isDessert ? 'dessert-item-name' : ''}">${escapeHtml(row.items.join(', '))}</span>
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
            <p class="meal-card-timing">${activeTimings[mKey] || meal.timing}</p>
          </div>
        </div>
        <div class="meal-food-rows">
          ${rowsHtml}
        </div>
      `;

      menuContainer.appendChild(card);
    });
  }

  // Handle direct clicks on timing cards in Tab 1 to jump directly to dedicated menu card in Tab 2
  const timingCards = document.querySelectorAll('.timing-item-card[data-meal-target]');
  timingCards.forEach((tCard) => {
    const handleMealJump = () => {
      const mealTarget = tCard.getAttribute('data-meal-target');
      if (!mealTarget) return;

      if (tabMenuBtn) {
        tabMenuBtn.click();
      }

      setTimeout(() => {
        const targetElement = document.getElementById(`meal-card-${mealTarget}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetElement.classList.add('meal-card-targeted');
          setTimeout(() => {
            targetElement.classList.remove('meal-card-targeted');
          }, 2000);
        }
      }, 120);
    };

    tCard.addEventListener('click', handleMealJump);
    tCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleMealJump();
      }
    });
  });

  // Check URL params for direct menu landing or specific meal
  const urlParams = new URLSearchParams(window.location.search);
  const urlMeal = urlParams.get('meal');
  if (urlMeal && tabMenuBtn) {
    tabMenuBtn.click();
    setTimeout(() => {
      const el = document.getElementById(`meal-card-${urlMeal}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('meal-card-targeted');
      }
    }, 150);
  } else if (urlParams.get('tab') === 'menu' && tabMenuBtn) {
    tabMenuBtn.click();
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
  let settingsModal = document.getElementById('settings-modal');

  const closeSettings = () => {
    if (settingsModal) settingsModal.style.display = 'none';
  };

  const bindSettingsCloseListeners = (modal) => {
    if (!modal) return;
    const closeBtn = modal.querySelector('#settings-close-btn');
    const backdrop = modal.querySelector('#settings-backdrop');
    if (closeBtn) closeBtn.onclick = closeSettings;
    if (backdrop) backdrop.onclick = closeSettings;
  };

  const openSettings = () => {
    if (!settingsModal) {
      // Dynamic fallback if static #settings-modal is missing in DOM
      let existingModal = document.getElementById('settings-modal');
      if (existingModal) {
        settingsModal = existingModal;
      } else {
        const modalEl = document.createElement('div');
        modalEl.id = 'settings-modal';
        modalEl.className = 'settings-modal';
        modalEl.style.display = 'none';
        modalEl.innerHTML = `
          <div class="settings-backdrop" id="settings-backdrop"></div>
          <div class="settings-dialog">
            <div class="settings-header">
              <h2 style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF;">Settings &amp; Info</h2>
              <button id="settings-close-btn" class="settings-close-btn" type="button" aria-label="Close Settings">&times;</button>
            </div>
            <div class="settings-body">
              <div class="setting-row">
                <div>
                  <p class="setting-title">Campus Hub</p>
                  <p class="setting-sub">Lovely Professional University, Punjab</p>
                </div>
                <span class="setting-badge">Active</span>
              </div>
              <div class="setting-row">
                <div>
                  <p class="setting-title">Hostel Dining Schedule</p>
                  <p class="setting-sub">Boys Hostel 14-Day Cycle</p>
                </div>
                <span class="setting-badge">Synced</span>
              </div>
              <div class="setting-links">
                <a href="disclaimer.html" class="setting-link-btn">Legal Disclaimer &rarr;</a>
                <a href="about.html" class="setting-link-btn">About MyLPU.online &rarr;</a>
                <a href="contact.html" class="setting-link-btn">Contact / Submit Correction &rarr;</a>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modalEl);
        settingsModal = modalEl;
      }
      bindSettingsCloseListeners(settingsModal);
    }
    settingsModal.style.display = 'block';
  };

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  if (settingsModal) {
    bindSettingsCloseListeners(settingsModal);
  }

  // Close modal on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal && settingsModal.style.display === 'block') {
      closeSettings();
    }
  });

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

/* ==========================================================================
   4. Back Button Navigation (Takes user one step back in history)
   ========================================================================== */
function initBackButton() {
  const backButtons = document.querySelectorAll('#header-back-btn, .header-icon-btn[aria-label*="Back"], .header-icon-btn[aria-label*="back"]');
  backButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // If history exists and not coming from outside origin, take one step back
      if (window.history.length > 1 && (!document.referrer || document.referrer.includes(window.location.host))) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    });
  });
}
