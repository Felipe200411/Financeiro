"use strict";

const developerEmail = "ssllfelipe@gmail.com";
const developerPasswordHash = "d057fe2a31b78744ef93af10301d74ab351286a8cc9d18fd60441a402ac8d6fd";
async function passwordHash(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
const login = document.getElementById("developer-login");
const loginForm = document.getElementById("developer-login-form");
const loginStatus = document.getElementById("developer-login-status");
const developerContent = document.getElementById("developer-content");
let editorInitialized = false;
const developerDefaultConfig = {
  brand: "TOP CELL",
  heroTitle: "Seu celular",
  heroAccent: "novo de novo",
  heroDescription: "Assistência técnica rápida, com peças de qualidade e 90 dias de garantia.",
  whatsapp: "5599984805415",
  primary: "#e52630",
  background: "#1c1717",
  card: "#281e1e"
};

document.getElementById("logout-developer").addEventListener("click", () => {
  sessionStorage.removeItem("topcell-developer-session");
  localStorage.removeItem("topcell-developer-session");
  developerContent.hidden = true;
  login.hidden = false;
  loginStatus.textContent = "";
  window.location.replace("auth.html");
});

function authorizeDeveloper() {
  login.hidden = true;
  developerContent.hidden = false;
  if (!editorInitialized) {
    initializeDeveloperEditor();
    editorInitialized = true;
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = document.getElementById("developer-email").value.trim().toLowerCase();
  const password = document.getElementById("developer-password").value;
  if (email !== developerEmail || await passwordHash(password) !== developerPasswordHash) {
    loginStatus.textContent = "E-mail ou senha incorretos.";
    loginStatus.style.color = "#ff8b91";
    return;
  }
  sessionStorage.setItem("topcell-developer-session", "authorized");
  authorizeDeveloper();
});


const catalogStorageKey = "topcell-catalog-config";
const unlockCatalogStorageKey = "topcell-unlock-catalog-config";
const appleModelsStorageKey = "topcell-apple-models-config";

function readCatalogConfig() {
  try {
    return JSON.parse(localStorage.getItem(catalogStorageKey) || "{}");
  } catch {
    return {};
  }
}

function catalogDefaults() {
  const defaults = {};
  window.TOPCELL_CATALOG_DEFAULTS.forEach(section => {
    section.items.forEach(([id, name, price]) => {
      defaults[id] = { name, price };
    });
  });
  return defaults;
}

function createCatalogEditor() {
  const container = document.getElementById("developer-catalog");
  const saved = readCatalogConfig();
  container.replaceChildren();

  window.TOPCELL_CATALOG_DEFAULTS.forEach(section => {
    const title = document.createElement("h3");
    title.className = "catalog-editor-group";
    title.textContent = section.section === "tela"
      ? "Troca de tela"
      : section.section === "bateria"
        ? "Troca de bateria"
        : "Conector de carga";
    container.appendChild(title);

    section.items.forEach(([id, defaultName, defaultPrice]) => {
      const item = document.createElement("div");
      item.className = "catalog-item";

      const nameLabel = document.createElement("label");
      nameLabel.htmlFor = `catalog-name-${id}`;
      nameLabel.textContent = "Nome";
      const nameInput = document.createElement("input");
      nameInput.id = `catalog-name-${id}`;
      nameInput.name = `catalog-name-${id}`;
      nameInput.value = saved[id]?.name ?? defaultName;

      const priceLabel = document.createElement("label");
      priceLabel.htmlFor = `catalog-price-${id}`;
      priceLabel.textContent = "Preço";
      const priceInput = document.createElement("input");
      priceInput.id = `catalog-price-${id}`;
      priceInput.name = `catalog-price-${id}`;
      priceInput.value = saved[id]?.price ?? defaultPrice;

      item.append(nameLabel, nameInput, priceLabel, priceInput);
      container.appendChild(item);
    });
  });
}

function currentCatalogConfig() {
  const config = {};
  window.TOPCELL_CATALOG_DEFAULTS.forEach(section => {
    section.items.forEach(([id]) => {
      config[id] = {
        name: document.getElementById(`catalog-name-${id}`).value.trim(),
        price: document.getElementById(`catalog-price-${id}`).value.trim()
      };
    });
  });
  return config;
}

function readUnlockCatalogConfig() {
  try {
    return JSON.parse(localStorage.getItem(unlockCatalogStorageKey) || "{}");
  } catch {
    return {};
  }
}

function createUnlockCatalogEditor() {
  const container = document.getElementById("developer-unlock-catalog");
  const saved = readUnlockCatalogConfig();
  container.replaceChildren();
  let currentGroup = "";

  window.TOPCELL_UNLOCK_DEFAULTS.forEach(([id, group, defaultName, defaultPrice]) => {
    if (group !== currentGroup) {
      currentGroup = group;
      const heading = document.createElement("h3");
      heading.className = "catalog-editor-group";
      heading.textContent = group;
      container.appendChild(heading);
    }

    const item = document.createElement("div");
    item.className = "catalog-item";
    item.innerHTML = `
      <label for="unlock-name-${id}">Nome do serviço</label>
      <input id="unlock-name-${id}" value="${(saved[id]?.name ?? defaultName).replaceAll('"', "&quot;")}">
      <label for="unlock-price-${id}">Preço</label>
      <input id="unlock-price-${id}" value="${(saved[id]?.price ?? defaultPrice).replaceAll('"', "&quot;")}">
    `;
    container.appendChild(item);
  });
}

function currentUnlockCatalogConfig() {
  const config = {};
  window.TOPCELL_UNLOCK_DEFAULTS.forEach(([id]) => {
    config[id] = {
      name: document.getElementById(`unlock-name-${id}`).value.trim(),
      price: document.getElementById(`unlock-price-${id}`).value.trim()
    };
  });
  return config;
}

function readAppleModelsConfig() {
  try {
    return JSON.parse(localStorage.getItem(appleModelsStorageKey) || "{}");
  } catch {
    return {};
  }
}

function createAppleModelsEditor() {
  const container = document.getElementById("developer-apple-models");
  const saved = readAppleModelsConfig();
  container.replaceChildren();

  window.TOPCELL_APPLE_MODELS_DEFAULTS.forEach(([id, defaultName, defaultStatus]) => {
    const item = document.createElement("div");
    item.className = "catalog-item";

    const nameLabel = document.createElement("label");
    nameLabel.htmlFor = `apple-model-name-${id}`;
    nameLabel.textContent = "Modelo";
    const nameInput = document.createElement("input");
    nameInput.id = `apple-model-name-${id}`;
    nameInput.value = saved[id]?.name ?? defaultName;

    const statusLabel = document.createElement("label");
    statusLabel.htmlFor = `apple-model-status-${id}`;
    statusLabel.textContent = "Status";
    const statusSelect = document.createElement("select");
    statusSelect.id = `apple-model-status-${id}`;
    statusSelect.innerHTML = '<option value="online">Online</option><option value="offline">Offline</option>';
    statusSelect.value = saved[id]?.status ?? defaultStatus;

    item.append(nameLabel, nameInput, statusLabel, statusSelect);
    container.appendChild(item);
  });
}

function currentAppleModelsConfig() {
  const config = {};
  window.TOPCELL_APPLE_MODELS_DEFAULTS.forEach(([id]) => {
    config[id] = {
      name: document.getElementById(`apple-model-name-${id}`).value.trim(),
      status: document.getElementById(`apple-model-status-${id}`).value
    };
  });
  return config;
}

const isDeveloperAuthorized =
  sessionStorage.getItem("topcell-developer-session") === "authorized" ||
  localStorage.getItem("topcell-developer-session") === "authorized";

if (!isDeveloperAuthorized) {
  window.location.replace("auth.html");
} else {
  authorizeDeveloper();
}

function initializeDeveloperEditor() {
  const form = document.getElementById("developer-form");
  const preview = document.getElementById("site-preview");
  const status = document.getElementById("developer-status");
  const previewPage = document.getElementById("preview-page");
  createCatalogEditor();
  createUnlockCatalogEditor();
  createAppleModelsEditor();

  function readConfig() {
    try {
      return { ...developerDefaultConfig, ...JSON.parse(localStorage.getItem("topcell-site-config") || "{}") };
    } catch {
      return { ...developerDefaultConfig };
    }
  }

  function loadForm(config) {
    [...form.elements].forEach(input => {
      input.value = config[input.name] ?? "";
    });
  }

  function currentConfig() {
    const config = {};
    [...form.elements].forEach(input => { config[input.name] = input.value.trim(); });
    return config;
  }

  function previewChanges() {
    const config = currentConfig();
    preview.contentWindow.postMessage({ type: "TOPCELL_CONFIG", config }, "*");
    preview.contentWindow.postMessage({ type: "TOPCELL_CATALOG", config: currentCatalogConfig() }, "*");
    preview.contentWindow.postMessage({ type: "TOPCELL_UNLOCK_CATALOG", config: currentUnlockCatalogConfig() }, "*");
    preview.contentWindow.postMessage({ type: "TOPCELL_APPLE_MODELS", config: currentAppleModelsConfig() }, "*");
  }

  loadForm(readConfig());
  form.addEventListener("input", () => {
    previewChanges();
    status.textContent = "Alterações em prévia ao vivo";
  });

  document.getElementById("save-config").addEventListener("click", () => {
    const config = currentConfig();
    localStorage.setItem("topcell-site-config", JSON.stringify(config));
    localStorage.setItem(catalogStorageKey, JSON.stringify(currentCatalogConfig()));
    localStorage.setItem(unlockCatalogStorageKey, JSON.stringify(currentUnlockCatalogConfig()));
    localStorage.setItem(appleModelsStorageKey, JSON.stringify(currentAppleModelsConfig()));
    previewChanges();
    status.textContent = "Alterações salvas neste navegador";
  });

  document.getElementById("reset-config").addEventListener("click", () => {
    localStorage.removeItem("topcell-site-config");
    localStorage.removeItem(catalogStorageKey);
    localStorage.removeItem(unlockCatalogStorageKey);
    localStorage.removeItem(appleModelsStorageKey);
    loadForm(developerDefaultConfig);
    createCatalogEditor();
    createUnlockCatalogEditor();
    createAppleModelsEditor();
    previewChanges();
    status.textContent = "Configuração padrão restaurada";
  });

  preview.addEventListener("load", previewChanges);
  previewPage.addEventListener("change", () => {
    preview.src = previewPage.value;
  });
  document.getElementById("developer-catalog").addEventListener("input", () => {
    previewChanges();
    status.textContent = "Alterações em prévia ao vivo";
  });
  document.getElementById("developer-unlock-catalog").addEventListener("input", () => {
    previewChanges();
    status.textContent = "Alterações em prévia ao vivo";
  });
  document.getElementById("developer-apple-models").addEventListener("input", () => {
    previewChanges();
    status.textContent = "Alterações em prévia ao vivo";
  });

  document.querySelectorAll("[data-developer-tab]").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.developerTab;
      document.querySelectorAll("[data-developer-tab]").forEach(item => {
        item.classList.toggle("active", item === button);
      });
      document.getElementById("general-editor").hidden = tab !== "general";
      document.getElementById("catalog-editor").hidden = tab !== "catalog";
      document.getElementById("unlock-editor").hidden = tab !== "unlock";
    });
  });
}
