"use strict";

const developerEmail = "ssllfelipe@gmail.com";
const developerPassword = "Fe17112004";
const login = document.getElementById("developer-login");
const loginForm = document.getElementById("developer-login-form");
const loginStatus = document.getElementById("developer-login-status");
const developerContent = document.getElementById("developer-content");
let editorInitialized = false;

document.getElementById("logout-developer").addEventListener("click", () => {
  sessionStorage.removeItem("topcell-developer-session");
  developerContent.hidden = true;
  login.hidden = false;
  loginStatus.textContent = "";
});

function authorizeDeveloper() {
  login.hidden = true;
  developerContent.hidden = false;
  if (!editorInitialized) {
    initializeDeveloperEditor();
    editorInitialized = true;
  }
}

if (sessionStorage.getItem("topcell-developer-session") === "authorized") {
  authorizeDeveloper();
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const email = document.getElementById("developer-email").value.trim().toLowerCase();
  const password = document.getElementById("developer-password").value;
  if (email !== developerEmail || password !== developerPassword) {
    loginStatus.textContent = "E-mail ou senha incorretos.";
    loginStatus.style.color = "#ff8b91";
    return;
  }
  sessionStorage.setItem("topcell-developer-session", "authorized");
  document.getElementById("developer-password").value = "";
  authorizeDeveloper();
});


const defaultConfig = {
  brand: "TOP CELL",
  heroTitle: "Seu celular",
  heroAccent: "novo de novo",
  heroDescription: "Assistência técnica rápida, com peças de qualidade e 90 dias de garantia.",
  whatsapp: "5599984805415",
  primary: "#e52630",
  background: "#1c1717",
  card: "#281e1e"
};

function initializeDeveloperEditor() {
  const form = document.getElementById("developer-form");
  const preview = document.getElementById("site-preview");
  const status = document.getElementById("developer-status");

  function readConfig() {
    try {
      return { ...defaultConfig, ...JSON.parse(localStorage.getItem("topcell-site-config") || "{}") };
    } catch {
      return { ...defaultConfig };
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
  }

  loadForm(readConfig());
  form.addEventListener("input", () => {
    previewChanges();
    status.textContent = "Alterações em prévia ao vivo";
  });

  document.getElementById("save-config").addEventListener("click", () => {
    const config = currentConfig();
    localStorage.setItem("topcell-site-config", JSON.stringify(config));
    previewChanges();
    status.textContent = "Alterações salvas neste navegador";
  });

  document.getElementById("reset-config").addEventListener("click", () => {
    localStorage.removeItem("topcell-site-config");
    loadForm(defaultConfig);
    previewChanges();
    status.textContent = "Configuração padrão restaurada";
  });

  preview.addEventListener("load", previewChanges);
}
