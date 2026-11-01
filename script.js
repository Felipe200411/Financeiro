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

const siteConfig = readSiteConfig();
applySiteConfig(siteConfig);
window.addEventListener("storage", event => {
  if (event.key === "topcell-site-config") applySiteConfig(readSiteConfig());
});
window.addEventListener("message", event => {
  if (event.data && event.data.type === "TOPCELL_CONFIG") applySiteConfig(event.data.config);
});

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
const form = document.getElementById("auth-form");
if (form) {
  let signup = false;
  const toggle = document.getElementById("auth-switch");
  const title = document.getElementById("auth-title");
  const submit = document.getElementById("auth-submit");
  const fields = document.getElementById("signup-fields");
  const message = document.getElementById("auth-message");
  toggle.addEventListener("click", () => {
    signup = !signup;
    title.textContent = submit.textContent = signup ? "Criar conta" : "Entrar";
    fields.hidden = !signup;
    fields.querySelectorAll("input").forEach(input => { input.required = signup; input.disabled = !signup; });
    document.getElementById("password").autocomplete = signup ? "new-password" : "current-password";
    toggle.textContent = signup ? "Já tem conta? Entrar" : "Não tem conta? Criar conta";
    message.textContent = "";
  });
  fields.querySelectorAll("input").forEach(input => { input.disabled = true; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    message.textContent = "Para entrar ou criar uma conta, use o site online da TOP CELL.";
    const link = document.createElement("a");
    link.href = "https://tailor-made-web-home.lovable.app/auth";
    link.className = "button";
    link.textContent = "Acessar minha conta no site online";
    message.append(document.createElement("br"), link);
    form.reset();
  });
}

const googleButton = document.getElementById("google-signin-button");
if (googleButton) {
  const clientId = document.querySelector('meta[name="google-signin-client_id"]')?.content || "";
  const googleMessage = document.getElementById("google-auth-message");
  window.handleGoogleCredential = response => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))));
      if (String(payload.email || "").toLowerCase() !== "ssllfelipe@gmail.com") {
        googleMessage.textContent = "Esta conta Google não está autorizada.";
        return;
      }
      sessionStorage.setItem("topcell-developer-session", "authorized");
      window.location.href = "developer.html";
    } catch {
      googleMessage.textContent = "Não foi possível validar a conta Google.";
    }
  };

  if (!clientId) {
    googleMessage.textContent = "Login Google aguardando configuração do Google Cloud.";
  } else {
    window.addEventListener("load", () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: window.handleGoogleCredential
      });
      google.accounts.id.renderButton(googleButton, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: googleButton.offsetWidth || 320
      });
    });
  }
}
