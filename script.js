"use strict";
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
