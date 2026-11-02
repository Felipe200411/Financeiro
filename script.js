"use strict";
const DEFAULT_SITE_CONFIG = {
  brand: "TOP CELL",
  heroTitle: "Seu celular",
  heroAccent: "novo de novo",
  heroDescription: "Assistência técnica rápida, com peças de qualidade e 90 dias de garantia.",
  whatsapp: "5599984805415",
  primary: "#e52630",
  background: "#1c1717",
  card: "#281e1e"
};

function readSiteConfig() {
  try {
    return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(localStorage.getItem("topcell-site-config") || "{}") };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

function applySiteConfig(config) {
  document.documentElement.style.setProperty("--primary", config.primary);
  document.documentElement.style.setProperty("--background", config.background);
  document.documentElement.style.setProperty("--card", config.card);

  document.querySelectorAll("[data-site-config]").forEach(element => {
    const key = element.dataset.siteConfig;
    if (config[key] !== undefined) element.textContent = config[key];
  });

  document.querySelectorAll("[data-whatsapp-link]").forEach(link => {
    link.href = `https://wa.me/${config.whatsapp.replace(/\D/g, "")}`;
  });
}

const DEFAULT_CATALOG = [
  { section: "tela", items: [
    ["samsung-a", "Samsung linha A (A05, A15, A35...)", "a partir de R$ 150"],
    ["samsung-s", "Samsung linha S", "a partir de R$ 350"],
    ["iphone-8-se", "iPhone 8 / SE", "a partir de R$ 200"],
    ["iphone-x-12", "iPhone X / 11 / 12", "a partir de R$ 300"],
    ["iphone-13-15", "iPhone 13 / 14 / 15", "a partir de R$ 450"],
    ["xiaomi-redmi-poco", "Xiaomi Redmi / Poco", "a partir de R$ 180"],
    ["motorola-moto-g-e", "Motorola Moto G / E", "a partir de R$ 160"]
  ]},
  { section: "bateria", items: [
    ["samsung-a-m", "Samsung linha A / M", "a partir de R$ 129"],
    ["samsung-s-bateria", "Samsung linha S", "a partir de R$ 180"],
    ["iphone-8-se-bateria", "iPhone 8 / SE", "a partir de R$ 150"],
    ["iphone-x-12-bateria", "iPhone X / 11 / 12", "a partir de R$ 180"],
    ["iphone-13-15-bateria", "iPhone 13 / 14 / 15", "a partir de R$ 220"],
    ["xiaomi-redmi-poco-bateria", "Xiaomi Redmi / Poco", "a partir de R$ 140"],
    ["motorola-moto-g-e-bateria", "Motorola Moto G / E", "a partir de R$ 130"]
  ]},
  { section: "conector", items: [
    ["samsung-usb-c", "Samsung (USB-C)", "a partir de R$ 90"],
    ["iphone-lightning", "iPhone (Lightning)", "a partir de R$ 120"],
    ["iphone-15-usb-c", "iPhone 15 (USB-C)", "a partir de R$ 140"],
    ["xiaomi-usb-c", "Xiaomi (USB-C)", "a partir de R$ 90"],
    ["motorola-usb-c", "Motorola (USB-C)", "a partir de R$ 90"],
    ["limpeza-conector", "Limpeza do conector", "a partir de R$ 40"]
  ]}
];

window.TOPCELL_CATALOG_DEFAULTS = DEFAULT_CATALOG;

function readCatalogConfig() {
  try {
    return JSON.parse(localStorage.getItem("topcell-catalog-config") || "{}");
  } catch {
    return {};
  }
}

function applyCatalogConfig(overrides = readCatalogConfig()) {
  DEFAULT_CATALOG.forEach(section => {
    const cards = document.querySelectorAll(`#${section.section} .card`);
    section.items.forEach((item, index) => {
      const [id, defaultName, defaultPrice] = item;
      const card = cards[index];
      if (!card) return;
      const name = overrides[id]?.name ?? defaultName;
      const price = overrides[id]?.price ?? defaultPrice;
      const nameElement = card.querySelector("h3");
      const priceElement = card.querySelector(".price");
      if (nameElement) nameElement.textContent = name;
      if (priceElement) priceElement.textContent = price;
    });
  });
}

if (document.querySelector(".catalog-section")) applyCatalogConfig();

const DEFAULT_UNLOCK_CATALOG = [
  ["samsung-frp", "Samsung", "Remoção de conta Google (FRP)", "R$ 80"],
  ["samsung-carrier", "Samsung", "Desbloqueio de operadora", "R$ 60"],
  ["samsung-password", "Samsung", "Senha / padrão esquecido", "R$ 70"],
  ["apple-carrier", "Apple", "Desbloqueio de operadora", "R$ 120"],
  ["apple-password", "Apple", "Senha de tela esquecida", "R$ 100"],
  ["apple-bypass", "Apple", "Bypass de ativação", "sob consulta"],
  ["xiaomi-mi", "Xiaomi", "Remoção de conta Mi", "R$ 90"],
  ["xiaomi-frp", "Xiaomi", "Remoção de conta Google (FRP)", "R$ 80"],
  ["xiaomi-password", "Xiaomi", "Senha / padrão esquecido", "R$ 70"]
];
window.TOPCELL_UNLOCK_DEFAULTS = DEFAULT_UNLOCK_CATALOG;

function readUnlockCatalogConfig() {
  try {
    return JSON.parse(localStorage.getItem("topcell-unlock-catalog-config") || "{}");
  } catch {
    return {};
  }
}

function applyUnlockCatalogConfig(overrides = readUnlockCatalogConfig()) {
  if (!document.querySelector(".unlock-list")) return;
  document.querySelectorAll(".unlock-list li").forEach((row, index) => {
    if (index >= DEFAULT_UNLOCK_CATALOG.length) return;
    const [id, , defaultName, defaultPrice] = DEFAULT_UNLOCK_CATALOG[index];
    row.querySelector("span").textContent = overrides[id]?.name ?? defaultName;
    row.querySelector("strong").textContent = overrides[id]?.price ?? defaultPrice;
  });
}

applyUnlockCatalogConfig();

const DEFAULT_APPLE_MODELS = [
  ["iphone-11", "iPhone 11", "online", "assets/iphone-11.jpg"],
  ["iphone-12", "iPhone 12", "online", "assets/iphone-12.jpg"],
  ["iphone-12-pro", "iPhone 12 Pro", "online", "assets/iphone-12-pro.png"],
  ["iphone-13", "iPhone 13", "online", "assets/iphone-13.jpg"],
  ["iphone-15", "iPhone 15", "online", "assets/iphone-15.jpg"]
];
window.TOPCELL_APPLE_MODELS_DEFAULTS = DEFAULT_APPLE_MODELS;

function readAppleModelsConfig() {
  try {
    return JSON.parse(localStorage.getItem("topcell-apple-models-config") || "{}");
  } catch {
    return {};
  }
}

function applyAppleModelsConfig(overrides = readAppleModelsConfig()) {
  const appleCard = [...document.querySelectorAll(".grid > .card")].find(card =>
    card.querySelector("h2")?.textContent.trim() === "Apple"
  );
  if (!appleCard) return;

  let modelList = appleCard.querySelector(".unlock-models");
  if (!modelList) {
    appleCard.querySelector("ul.unlock-list")?.after(document.createElement("div"));
    modelList = document.createElement("div");
    modelList.className = "unlock-models";
    modelList.hidden = true;
    appleCard.insertBefore(modelList, appleCard.querySelector(".button.primary"));
  }

  modelList.replaceChildren();
  DEFAULT_APPLE_MODELS.forEach(([id, defaultName, defaultStatus, image]) => {
    const status = overrides[id]?.status ?? defaultStatus;
    const name = overrides[id]?.name ?? defaultName;
    const row = document.createElement("div");
    row.className = "unlock-model";
    row.innerHTML = `<span class="unlock-model-name"><img class="phone-photo" src="${image}" alt="${name}"><span>${name}</span></span><strong class="model-status ${status}">${status === "online" ? "Online" : "Offline"}</strong>`;
    modelList.appendChild(row);
  });

  const brandHeading = appleCard.querySelector("h2");
  brandHeading.classList.add("unlock-brand-toggle");
  brandHeading.setAttribute("role", "button");
  brandHeading.setAttribute("tabindex", "0");
  brandHeading.dataset.unlockBrandToggle = "apple";

  brandHeading.onclick = () => {
    modelList.hidden = !modelList.hidden;
    brandHeading.classList.toggle("open", !modelList.hidden);
  };
  brandHeading.onkeydown = event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      brandHeading.click();
    }
  };
}

applyAppleModelsConfig();

const siteConfig = readSiteConfig();
applySiteConfig(siteConfig);
window.addEventListener("storage", event => {
  if (event.key === "topcell-site-config") applySiteConfig(readSiteConfig());
});
window.addEventListener("message", event => {
  if (event.data && event.data.type === "TOPCELL_CONFIG") applySiteConfig(event.data.config);
  if (event.data && event.data.type === "TOPCELL_CATALOG") applyCatalogConfig(event.data.config);
  if (event.data && event.data.type === "TOPCELL_UNLOCK_CATALOG") applyUnlockCatalogConfig(event.data.config);
  if (event.data && event.data.type === "TOPCELL_APPLE_MODELS") applyAppleModelsConfig(event.data.config);
});

document.querySelectorAll("[data-password-toggle]").forEach(toggle => {
  const password = document.getElementById(toggle.dataset.passwordToggle);
  if (!password) return;

  toggle.addEventListener("click", () => {
    const showPassword = password.type === "password";
    password.type = showPassword ? "text" : "password";
    toggle.textContent = showPassword ? "Ocultar" : "Mostrar";
    toggle.setAttribute("aria-label", showPassword ? "Ocultar senha" : "Mostrar senha");
    toggle.setAttribute("aria-pressed", String(showPassword));
  });
});

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

const secureLoginDialog = document.getElementById("secure-login-dialog");
if (secureLoginDialog) {
  document.querySelector("[data-secure-admin-login]")?.addEventListener("click", () => {
    secureLoginDialog.showModal();
    document.getElementById("email")?.focus();
  });
  document.querySelector("[data-secure-admin-close]")?.addEventListener("click", () => secureLoginDialog.close());
  secureLoginDialog.addEventListener("click", event => {
    if (event.target === secureLoginDialog) secureLoginDialog.close();
  });
}

const form = document.getElementById("auth-form");
if (form) {
  const developerPasswordHash = "d057fe2a31b78744ef93af10301d74ab351286a8cc9d18fd60441a402ac8d6fd";
  const passwordHash = async value => {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
  };
  let signup = false;
  const toggle = document.getElementById("auth-switch");
  const title = document.getElementById("auth-title");
  const submit = document.getElementById("auth-submit");
  const fields = document.getElementById("signup-fields");
  const message = document.getElementById("auth-message");
  toggle?.addEventListener("click", () => {
    signup = !signup;
    title.textContent = submit.textContent = signup ? "Criar conta" : "Entrar";
    fields.hidden = !signup;
    fields?.querySelectorAll("input").forEach(input => { input.required = signup; input.disabled = !signup; });
    document.getElementById("password").autocomplete = signup ? "new-password" : "current-password";
    toggle.textContent = signup ? "Já tem conta? Entrar" : "Não tem conta? Criar conta";
    message.textContent = "";
  });
  fields?.querySelectorAll("input").forEach(input => { input.disabled = true; });
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  try {
    emailInput.value = localStorage.getItem("topcell-login-email") || "";
    passwordInput.value = localStorage.getItem("topcell-login-password") || "";
    document.getElementById("remember-login").checked =
      localStorage.getItem("topcell-save-login") === "true";
  } catch {}

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (signup) {
      message.textContent = "A criação de contas está disponível apenas para contas autorizadas.";
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (email !== "ssllfelipe@gmail.com" || await passwordHash(password) !== developerPasswordHash) {
      message.textContent = "E-mail ou senha incorretos.";
      message.style.color = "#ff8b91";
      return;
    }

    const finishLogin = shouldRemember => {
      try {
        localStorage.setItem("topcell-save-login", String(shouldRemember));
        if (shouldRemember) {
          localStorage.setItem("topcell-login-email", email);
          localStorage.setItem("topcell-login-password", password);
        } else {
          localStorage.removeItem("topcell-login-email");
          localStorage.removeItem("topcell-login-password");
        }
      } catch {}
      sessionStorage.setItem("topcell-developer-session", "authorized");
      window.location.href = "developer.html";
    };

    if (document.getElementById("remember-login").checked) finishLogin(true);
    else {
      const dialog = document.getElementById("save-login-dialog");
      dialog.showModal();
      document.getElementById("save-login-yes").onclick = () => { dialog.close(); finishLogin(true); };
      document.getElementById("save-login-no").onclick = () => { dialog.close(); finishLogin(false); };
    }
  });
}

const googleButton = document.getElementById("google-signin-button");
if (googleButton) {
  const clientId = document.querySelector('meta[name="google-signin-client_id"]')?.content?.trim();
  const googleMessage = document.getElementById("google-auth-message");
  let googleInitialized = false;

  window.handleGoogleCredential = response => {
    try {
      if (!response?.credential) throw new Error("Credencial não recebida.");

      const base64 = response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      if (String(payload.email || "").toLowerCase() !== "ssllfelipe@gmail.com") {
        googleMessage.textContent = "Esta conta Google não está autorizada.";
        return;
      }
      sessionStorage.setItem("topcell-developer-session", "authorized");
      window.location.href = "developer.html";
    } catch {
      googleMessage.textContent = "Não foi possível validar o login do Google.";
    }
  };

  const initializeGoogleLogin = () => {
    if (googleInitialized || !window.google?.accounts?.id) return;
    if (!clientId) {
      googleMessage.textContent = "O login do Google não está configurado.";
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: window.handleGoogleCredential,
        ux_mode: "popup",
        context: "signin"
      });
      google.accounts.id.renderButton(googleButton, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: googleButton.offsetWidth || 320
      });
      googleInitialized = true;
    } catch {
      googleMessage.textContent = "O Google bloqueou esta origem. Acesse por HTTPS autorizado ou localhost.";
    }
  };

  window.addEventListener("load", () => {
    if (window.google?.accounts?.id) initializeGoogleLogin();
    else window.setTimeout(() => {
      if (window.google?.accounts?.id) initializeGoogleLogin();
      else googleMessage.textContent = "Não foi possível carregar o login do Google.";
    }, 2500);
  });
}
