/* DOM */
/* Search */
const search = document.getElementById("search");
/* Sections */
const sectionContainer = document.getElementById("sectionContainer");
const noResults = document.getElementById("noResults");
/* Filters */
const filterBtn = document.getElementById("filterBtn");
const filterPopup = document.getElementById("filterPopup");
const activeFiltersDiv = document.getElementById("activeFilters");
const filterWrapper = document.querySelector(".filter-wrapper");
/* Language */
const languageButton = document.getElementById("languageButton");
const languagePopup = document.getElementById("languagePopup");
const languageList = document.getElementById("languageList");
const languageSearch = document.getElementById("languageSearch");
const currentLanguageText = document.getElementById("currentLanguage");
/* Help */
const helpOverlay = document.getElementById("helpOverlay");
const helpContent = document.getElementById("helpContent");
/* Footer */
const footerText = document.getElementById("footerText");
const supportButton = document.getElementById("supportButton");
const legalText = document.getElementById("legalText");

/* STATE */
/* Language */
const availableLanguages = Object.keys(languages.available);
const langCache = {};
let currentLanguage = languages.default;
let translations = {};
let loadToken = 0;
/* Filters */
let activeFilters = [];
/* Dropdowns */
const dropdowns = [];
/* Sound */
const writingSound = new Audio("assets/sounds/text.mp3");

/* UTILITIES */
/* Text */
function removeAccents(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
/* Keyboard */
function makeKeyboardClickable(el, tabIndex = 0) {
  el.tabIndex = tabIndex;
  el.setAttribute("role", "button");
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });
}
function focusStep(elements, step) {
  if (!elements.length) return;
  const index = elements.indexOf(document.activeElement);
  let next;
  if (index === -1) next = step > 0 ? 0 : elements.length - 1;
  else next = (index + step + elements.length) % elements.length;
  elements[next].focus();
}

/* COMPONENTS */
/* Modal */
function setupModal({ overlayId, menuSelector = ".help-menu", closeButtonSelector = ".close-btn", blockScroll = false }) {
  const overlay = document.getElementById(overlayId);
  const menu = overlay.querySelector(menuSelector);
  const closeButton = overlay.querySelector(closeButtonSelector);
  let lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    overlay.style.display = "flex";
    closeButton.focus();
    if (blockScroll) {
      document.body.classList.add("modal-open");
    }
  }
  function close() {
    overlay.style.display = "none";
    if (lastFocus) lastFocus.focus();
    if (blockScroll) {
      document.body.classList.remove("modal-open");
    }
  }
  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) {
      close();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display === "flex") {
      close();
    }
  });
  return { open, close };
}
/* Dropdown */
function setupDropdown({ button, popup, onOpen, onClose, isOpen }) {
  dropdowns.push({
    button,
    popup,
    close: onClose,
  });
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const opened = isOpen();
    dropdowns.forEach((dropdown) => {
      dropdown.close();
    });
    if (!opened) {
      onOpen();
    }
  });
}

/* LANGUAGE */
/* Translations */
function parseLang(text) {
  const result = {};
  text.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith("#")) return;
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      result[key.trim()] = valueParts.join("=").trim();
    }
  });
  return result;
}
async function fetchLang(lang) {
  if (!langCache[lang]) {
    const response = await fetch(`lang/${lang}.lang`);
    if (!response.ok) throw new Error(`Language not found: ${lang}`);
    langCache[lang] = parseLang(await response.text());
  }
  return langCache[lang];
}
async function loadLanguage(lang) {
  const token = ++loadToken;
  try {
    const defaults = await fetchLang(languages.default);
    const specific = lang !== languages.default ? await fetchLang(lang) : {};
    if (token !== loadToken) return;
    translations = { ...defaults, ...specific };
    currentLanguage = lang;
    try { localStorage.setItem("selectedLanguage", lang); } catch {}
    updateLanguageName();
    updateInterfaceLanguage();
    renderLanguageList();
    renderSections(sectionData);
    createFilterOptions();
    applyFilters();
  } catch (error) {
    console.error(error);
    if (lang !== languages.default) {
      loadLanguage(languages.default);
    }
  }
}
function translate(key) {
  return translations[key] || key;
}
/* Interface */
function updateLanguageName() {
  document.documentElement.lang = currentLanguage.replace("_", "-");
  currentLanguageText.textContent = currentLanguage;
}
function updateInterfaceLanguage() {
  search.placeholder = translate("ui.search");
  if (filterWrapper) {
    filterWrapper.dataset.name = translate("ui.filters");
  }
  if (languageSearch) {
    languageSearch.placeholder = translate("ui.search");
  }
  if (footerText) {
    const command = "<strong>/help</strong>";
    footerText.innerHTML = translate("ui.footer").replace("/help", command);
  }
  noResults.textContent = translate("ui.no_results");
  if (supportButton) {
    supportButton.textContent = translate("ui.support");
  }
  if (legalText) {
    legalText.textContent = translate("ui.legal");
  }
}
/* Language Menu */
function renderLanguageList(filter = "") {
  languageList.innerHTML = "";
  const query = removeAccents(filter.toLowerCase());
  availableLanguages.forEach((lang, index) => {
    const name = languages.available[lang].name;
    const normalized = removeAccents(name.toLowerCase());
    if (query && !normalized.includes(query)) {
      return;
    }
    const option = document.createElement("div");
    option.className = "language-option";
    makeKeyboardClickable(option, -1);
    if (lang === currentLanguage) {
      option.classList.add("active");
    }
    option.textContent = name;
    if (query) {
      option.style.animation = "none";
      option.style.opacity = "1";
      option.style.transform = "none";
    } else {
      option.style.animationDelay = `${index * 0.05}s`;
    }
    option.addEventListener("click", () => {
      if (lang !== currentLanguage) {
        loadLanguage(lang);
      }
      closeLanguagePopup();
    });
    languageList.appendChild(option);
  });
}
/* Language Popup */
function openLanguagePopup() {
  languagePopup.style.display = "flex";
  languageSearch.focus();
}
function closeLanguagePopup() {
  if (languagePopup.contains(document.activeElement)) languageButton.focus();
  languagePopup.style.display = "none";
  if (languageSearch.value) {
    languageSearch.value = "";
    renderLanguageList();
  }
}
/* Language Detection */
function detectLanguage() {
  let savedLanguage = null;
  try { savedLanguage = localStorage.getItem("selectedLanguage"); } catch {}
  if (savedLanguage && availableLanguages.includes(savedLanguage)) {
    loadLanguage(savedLanguage);
    return;
  }
  const browserLanguages = navigator.languages || [navigator.language];
  for (const lang of browserLanguages) {
    const browser = lang.toLowerCase().replace("-", "_");
    if (availableLanguages.includes(browser)) {
      loadLanguage(browser);
      return;
    }
    const base = browser.split("_")[0];
    const match = availableLanguages.find((available) => available.split("_")[0] === base);
    if (match) {
      loadLanguage(match);
      return;
    }
  }
  loadLanguage(languages.default);
}

/* SECTIONS */
function renderSections(data) {
  sectionContainer.innerHTML = "";
  data
    .slice()
    .sort((a, b) => {
      let ta = translate(`enchantment.${a.id}`);
      let tb = translate(`enchantment.${b.id}`);
      if (ta.startsWith("*")) ta = ta.substring(1).trim();
      if (tb.startsWith("*")) tb = tb.substring(1).trim();
      return ta.localeCompare(tb, currentLanguage.replace("_", "-"), { sensitivity: "base" });
    })
    .forEach((ap) => {
      let title = translate(`enchantment.${ap.id}`);
      let extraClass = "";
      const romanNumbers = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
      const arabicLevel = ap.level || 1;
      const romanLevel = romanNumbers[arabicLevel];
      const levelText = arabicLevel > 1 ? `<span class="roman-level">${romanLevel}</span>` : "";
      /* Create Section */
      const section = document.createElement("section");
      section.className = "result";
      section.dataset.title = title;
      section.dataset.description = translate(`enchantment.${ap.id}.description`);
      section.dataset.level = arabicLevel;
      /* Section Logo */
      const logoDiv = document.createElement("div");
      logoDiv.className = "section-logo";
      logoDiv.innerHTML = `<img src="${ap.logo}" alt="">`;
      /* Section Content */
      const content = document.createElement("div");
      content.className = "section-content";
      if (title.startsWith("*")) {
        title = title.substring(1).trim();
        extraClass = "curse";
      }
      content.innerHTML = `
        <p class="section-title ${extraClass}">
          ${title} ${levelText}
        </p>
        <p class="section-description">
          ${translate(`enchantment.${ap.id}.description`)}
        </p>
        <div class="items"></div>
      `;
      section.appendChild(logoDiv);
      section.appendChild(content);
      /* Items */
      const itemsDiv = content.querySelector(".items");
      Object.keys(ap.items).forEach((key) => {
        if (ap.items[key] && itemMap[key]) {
          const info = itemMap[key];
          const itemName = translate(info.key);
          const div = document.createElement("div");
          div.className = "item";
          div.dataset.key = key;
          div.dataset.name = itemName;
          makeKeyboardClickable(div, itemsDiv.childElementCount === 0 ? 0 : -1);
          div.setAttribute("aria-label", itemName);
          div.addEventListener("click", () => addItemFilter(key));
          div.innerHTML = `
            <img src="assets/items/${info.file}" alt="${itemName}">
        `;
          itemsDiv.appendChild(div);
        }
      });
      sectionContainer.appendChild(section);
    });
}

/* FILTERS */
/* Item Filters */
function addItemFilter(key) {
  if (activeFilters.some((f) => f.type === "item" && f.id === key)) return;
  activeFilters.push({ type: "item", id: key });
  addFilterBubble({ type: "item", id: key });
  applyFilters();
}
/* Filter Popup */
function openFilterPopup() {
  filterPopup.style.display = "flex";
  filterBtn.classList.add("active");
  requestAnimationFrame(() => {
    filterPopup.style.opacity = "1";
    filterPopup.style.transform = "translateX(-50%) translateY(0)";
  });
}
function closeFilterPopup() {
  if (filterPopup.contains(document.activeElement)) filterBtn.focus();
  filterPopup.style.opacity = "0";
  filterPopup.style.transform = "translateX(-50%) translateY(calc(-10 * var(--u)))";
  filterBtn.classList.remove("active");
  setTimeout(() => {
    if (filterPopup.style.opacity === "0") {
      filterPopup.style.display = "none";
    }
  }, 300);
}
/* Filter Menu */
function createFilterOptions() {
  filterPopup.innerHTML = "";
  Object.entries(groups).forEach(([id, group], index) => {
    const div = document.createElement("div");
    div.className = "filter-option";
    makeKeyboardClickable(div, -1);
    div.dataset.group = id;
    div.innerHTML = `
      <img src="assets/items/${group.file}">
      ${translate(group.key)}
    `;
    div.style.animationDelay = `${index * 0.1}s`;
    div.addEventListener("click", () => {
      const exists = activeFilters.some((f) => f.type === "group" && f.id === id);
      if (!exists) {
        activeFilters.push({
          type: "group",
          id,
        });
        addFilterBubble({
          type: "group",
          id,
        });
      }
      closeFilterPopup();
      applyFilters();
    });
    filterPopup.appendChild(div);
  });
}
/* Filter Bubbles */
function addFilterBubble(filter) {
  const info = filter.type === "group" ? groups[filter.id] : itemMap[filter.id];
  if (!info) return;
  const bubble = document.createElement("div");
  const name = translate(info.key);
  bubble.className = "filter-bubble";
  makeKeyboardClickable(bubble);
  bubble.setAttribute("aria-label", name);
  bubble.innerHTML = `
    <img src="assets/items/${info.file}" alt="${name}">
  `;
  bubble.title = name;
  bubble.addEventListener("click", () => {
    if (bubble.matches(":focus-visible")) {
      const neighbor = bubble.nextElementSibling || bubble.previousElementSibling;
      (neighbor || search).focus();
    }
    activeFilters = activeFilters.filter((f) => !(f.type === filter.type && f.id === filter.id));
    bubble.classList.add("removing");
    bubble.addEventListener("animationend", () => {
      bubble.remove();
    });
    applyFilters();
  });
  activeFiltersDiv.appendChild(bubble);
}
/* Apply Filters */
function applyFilters() {
  const searchText = search.value.trim().toLowerCase();
  const query = removeAccents(
    searchText
      .replace(/:([^:]+):/g, "")
      .replace(/:[^:]*$/, "")
      .trim(),
  );
  const isLevelSearch = /^\d+$/.test(query);
  const levelNumber = Number(query);
  if (query.startsWith("/")) {
    document.querySelectorAll(".result").forEach((section) => {
      section.style.display = "flex";
      section.classList.remove("hidden");
    });
    noResults.hidden = true;
    return;
  }
  const hasItemFilters = activeFilters.some((f) => f.type === "item");
  const hasGroupFilters = activeFilters.some((f) => f.type === "group");
  let visibleCount = 0;
  document.querySelectorAll(".result").forEach((section) => {
    const title = removeAccents(section.dataset.title.toLowerCase());
    const matchTitle = isLevelSearch || query === "" || title.includes(query);
    const matchItem =
      !hasItemFilters || activeFilters.some((f) => f.type === "item" && section.querySelector(`.item[data-key="${f.id}"]`));
    const matchGroup =
      !hasGroupFilters ||
      activeFilters.some(
        (f) => f.type === "group" && groups[f.id].items.some((item) => section.querySelector(`.item[data-key="${item}"]`)),
      );
    const matchLevel = !isLevelSearch || parseInt(section.dataset.level, 10) === levelNumber;
    const visible = matchTitle && matchItem && matchGroup && matchLevel;
    if (visible) {
      visibleCount++;
      section.style.display = "flex";
      requestAnimationFrame(() => {
        section.classList.remove("hidden");
      });
    } else {
      section.classList.add("hidden");
      setTimeout(() => {
        if (section.classList.contains("hidden")) {
          section.style.display = "none";
        }
      }, 250);
    }
    /* Opacidad de los ítems */
    section.querySelectorAll(".item").forEach((item) => {
      item.classList.remove("inactive");
      const belongsItem = activeFilters.some((f) => f.type === "item" && f.id === item.dataset.key);
      const belongsGroup = activeFilters.some((f) => f.type === "group" && groups[f.id].items.includes(item.dataset.key));
      const active =
        (hasItemFilters && belongsItem) || (hasGroupFilters && belongsGroup) || (!hasItemFilters && !hasGroupFilters);
      if (!active) {
        item.classList.add("inactive");
      }
    });
  });
  noResults.hidden = visibleCount > 0;
}

/* HELP */
const helpModal = setupModal({
  overlayId: "helpOverlay",
  menuSelector: ".help-menu",
  closeButtonSelector: ".close-btn",
  blockScroll: true,
});
async function openHelp() {
  helpModal.open();
  helpContent.innerHTML = "Loading...";
  let response = await fetch(`help_menu/${currentLanguage}.md`);
  if (!response.ok) {
    response = await fetch(`help_menu/${languages.default}.md`);
  }
  const text = await response.text();
  helpContent.innerHTML = marked.parse(text);
}

/* SEARCH */
/* Commands and Tags */
search.addEventListener("input", () => {
  const text = search.value;
  if (text.startsWith("/")) {
    search.classList.add("command-mode");
  } else {
    search.classList.remove("command-mode");
  }
  const slashIndex = text.indexOf("/");
  if (slashIndex > 0) {
    search.value = text.substring(0, slashIndex);
    return;
  }
  if (text === "/help") {
    search.value = "";
    search.classList.remove("command-mode");
    search.blur();
    openHelp();
    return;
  }
  const filters = [...text.matchAll(/:([^:]+):/g)];
  filters.forEach((f) => {
    const fullTag = f[0];
    const name = removeAccents(f[1].toLowerCase().trim());
    let found = false;
    for (const [key, info] of Object.entries(itemMap)) {
      const translatedName = removeAccents(translate(info.key).toLowerCase().trim());
      if (translatedName === name) {
        found = true;
        const exists = activeFilters.some((fl) => fl.type === "item" && fl.id === key);
        if (!exists) {
          activeFilters.push({
            type: "item",
            id: key,
          });
          addFilterBubble({
            type: "item",
            id: key,
          });
        }
        break;
      }
    }
    search.value = search.value.replace(fullTag, "");
  });
  const url = new URL(location.href);
  if (search.value.trim()) url.searchParams.set("q", search.value.trim());
  else url.searchParams.delete("q");
  history.replaceState(null, "", url);
  applyFilters();
});
/* Typing Sound */
search.addEventListener("input", () => {
  writingSound.currentTime = 0;
  writingSound.play().catch(() => {});
});

/* BUTTONS */
/* Filter Button */
setupDropdown({
  button: filterBtn,
  popup: filterPopup,
  isOpen: () => {
    return filterBtn.classList.contains("active");
  },
  onOpen: openFilterPopup,
  onClose: closeFilterPopup,
});
/* Language Button */
setupDropdown({
  button: languageButton,
  popup: languagePopup,
  isOpen: () => {
    return languagePopup.style.display === "flex";
  },
  onOpen: openLanguagePopup,
  onClose: closeLanguagePopup,
});
/* Support Button */
if (supportButton) {
  supportButton.addEventListener("click", openHelp);
}
/* Copy Code */
document.addEventListener("click", async (e) => {
  if (e.target.matches("code.copyable")) {
    const text = e.target.textContent.trim();
    try { await navigator.clipboard.writeText(text); } catch { return; }
    e.target.style.background = "rgba(9, 255, 0, 0.16)";
    setTimeout(() => (e.target.style.background = "rgba(128, 128, 128, 0.32)"), 500);
  }
});
/* Close Dropdowns */
document.addEventListener("click", (e) => {
  dropdowns.forEach((dropdown) => {
    const clickedOutside = !dropdown.popup.contains(e.target) && !dropdown.button.contains(e.target);
    if (clickedOutside) {
      dropdown.close();
    }
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    dropdowns.forEach((dropdown) => dropdown.close());
  }
});
/* Search Shortcuts */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
  if (helpOverlay.style.display === "flex") return;
  if (e.key === "t" || e.key === "T") {
    e.preventDefault();
    dropdowns.forEach((dropdown) => dropdown.close());
    search.focus();
  } else if (e.key === "/") {
    e.preventDefault();
    dropdowns.forEach((dropdown) => dropdown.close());
    search.focus();
    search.value = "/";
    search.dispatchEvent(new Event("input"));
  }
});
/* Search Keys */
search.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    search.value = "";
    search.dispatchEvent(new Event("input"));
    search.blur();
  } else if (
    e.key === "ArrowRight" &&
    !e.shiftKey &&
    search.selectionStart === search.value.length &&
    search.selectionEnd === search.value.length
  ) {
    e.preventDefault();
    filterBtn.focus();
  }
});
/* Filter Button Keys */
filterBtn.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  } else if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
    e.preventDefault();
    if (!filterBtn.classList.contains("active")) filterBtn.click();
    const first = filterPopup.querySelector(".filter-option");
    if (first) first.focus();
  }
});
/* Filter Menu Keys */
filterPopup.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    focusStep([...filterPopup.querySelectorAll(".filter-option")], e.key === "ArrowDown" ? 1 : -1);
  } else if (e.key === "Tab") {
    closeFilterPopup();
  }
});
/* Language Button Keys */
languageButton.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (languagePopup.style.display !== "flex") languageButton.click();
  }
});
/* Language Search */
languageSearch.addEventListener("input", () => {
  renderLanguageList(languageSearch.value);
});
/* Language Menu Keys */
languagePopup.addEventListener("keydown", (e) => {
  const options = [...languageList.querySelectorAll(".language-option")];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    focusStep([languageSearch, ...options], e.key === "ArrowDown" ? 1 : -1);
  } else if (e.key === "Enter" && document.activeElement === languageSearch) {
    e.preventDefault();
    if (options[0]) options[0].click();
  } else if (e.key === "Tab") {
    closeLanguagePopup();
  }
});
/* Items Keys */
sectionContainer.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  const item = e.target.closest(".item");
  if (!item) return;
  e.preventDefault();
  const items = [...item.parentElement.querySelectorAll(".item")];
  focusStep(items, e.key === "ArrowRight" ? 1 : -1);
  items.forEach((other) => (other.tabIndex = other === document.activeElement ? 0 : -1));
});

/* INIT */
/* Markdown */
marked.use({
  renderer: {
    codespan(token) {
      const codeText = typeof token === "object" ? token.text || token.raw || String(token) : String(token);
      return `<code class="copyable">${codeText}</code>`;
    },
  },
});
/* Search */
const initialQuery = new URLSearchParams(location.search).get("q");
if (initialQuery && !initialQuery.startsWith("/")) search.value = initialQuery;
/* PWA */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker registrado:", registration.scope);
    } catch (error) {
      console.error("Error al registrar el Service Worker:", error);
    }
  });
}
/* Language */
detectLanguage();