"use strict";

const STORAGE_KEY = "meu-dinheiro-data-v1";
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const categoryIcons = {
  Alimentação: "🍴", Moradia: "⌂", Transporte: "↗", Saúde: "＋",
  Lazer: "♫", Compras: "◇", Educação: "▤", Salário: "R$", Outros: "•"
};

let state = loadState();
state.personalExpenses ||= {};
saveState();
let selectedType = "expense";
let editingTransactionId = null;

const monthSelect = document.getElementById("month-select");
const monthOptions = buildMonthOptions();

function loadState() {
  const fallback = { cardLimit: 280, cardUsed: 0, transactions: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const loaded = { ...fallback, ...saved };
    loaded.transactions = (loaded.transactions || []).map(item => {
      if (item.type !== "income" || item.category !== "Salário" || !item.week) return item;
      const lateSupplement = / - \dª semana(?: atrasada| \(complemento\))$/.test(item.description);
      return { ...item, overdue: lateSupplement };
    });
    if (Number(saved.cardLimit) === 3000) loaded.cardLimit = 280;
    if (!saved.cardUsageConfirmed && !(loaded.transactions || []).some(item => item.type === "expense" && item.method === "card")) {
      loaded.cardUsed = 0;
    }
    loaded.cardUsed = Math.min(Number(loaded.cardUsed) || 0, Number(loaded.cardLimit) || 0);
    return loaded;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let offset = -2; offset <= 3; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    options.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date)
    });
  }
  return options;
}

function currentMonth() {
  return monthSelect.value;
}

function formatMoney(value) {
  return currency.format(Number(value) || 0);
}

function monthTransactions() {
  return state.transactions.filter(item => item.date.startsWith(currentMonth()));
}

function monthPersonalExpenses() {
  return Object.entries(state.personalExpenses).flatMap(([category, items]) =>
    items.filter(item => item.date.startsWith(currentMonth())).map(item => ({ ...item, category }))
  );
}

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

function render() {
  const transactions = monthTransactions();
  const personalExpenses = monthPersonalExpenses();
  const income = transactions
    .filter(item => item.type === "income" && (item.category !== "Salário" || item.received))
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
    + personalExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const cardTransactions = transactions.filter(item => item.type === "expense" && item.method === "card");
  const cardTotal = cardTransactions.reduce((sum, item) => sum + item.amount, 0);

  document.getElementById("income-total").textContent = formatMoney(income);
  document.getElementById("expense-total").textContent = formatMoney(expenses);
  document.getElementById("card-total").textContent = formatMoney(cardTotal);
  document.getElementById("available-balance").textContent = formatMoney(income - expenses);
  const expenseCount = transactions.filter(item => item.type === "expense").length + personalExpenses.length;
  document.getElementById("expense-caption").textContent =
    expenseCount === 1 ? "1 movimentação no mês" : `${expenseCount} movimentações no mês`;
  document.getElementById("card-caption").textContent = `${cardTransactions.length} compras neste mês`;

  renderCategories(transactions, personalExpenses);
  renderRecent(transactions);
  renderTransactions(transactions);
  renderCard(cardTransactions, cardTotal);
  renderWeeklyOverview(transactions);
}

function renderWeeklyOverview(transactions) {
  const container = document.getElementById("weekly-overview-list");
  const weeks = [];

  for (let week = 1; week <= 4; week++) {
    const records = transactions.filter(item =>
      item.type === "income" && item.category === "Salário" && item.week === week
    );
    const receivedRecords = records.filter(item => item.received);
    const regularRecords = records.filter(item => !item.overdue);
    const overdueRecords = records.filter(item => item.overdue);
    const pendingRecords = records.filter(item => !item.received);
    const received = receivedRecords.reduce((sum, item) => sum + item.amount, 0);
    const pending = pendingRecords.reduce((sum, item) => sum + item.amount, 0);
    const overdue = overdueRecords
      .filter(item => !item.received)
      .reduce((sum, item) => sum + item.amount, 0);
    const receivedLate = overdueRecords.find(item => item.received);
    const status = received && pending ? `Recebido: ${formatMoney(received)} · pendente: ${formatMoney(pending)}`
      : overdue ? `Complemento atrasado: ${formatMoney(overdue)}`
      : receivedLate ? `Semana completa · complemento em ${formatShortDate(receivedLate.receivedDate || receivedLate.date)}`
      : received ? `Semana completa · paga em ${formatShortDate(receivedRecords[0]?.receivedDate || receivedRecords[0]?.date)}`
      : pending ? `Previsto: ${formatMoney(pending)}`
      : "Não informado";
    const expected = regularRecords.reduce((sum, item) => sum + item.amount, 0);
    weeks.push({ week, received, expected, status, overdue: Boolean(overdue), item: records.find(record => !record.overdue) || records[0] });
  }

  const total = weeks.reduce((sum, item) => sum + item.received, 0);
  document.getElementById("weekly-month-total").textContent = formatMoney(total);
  container.innerHTML = weeks.map(item => `
    <button class="weekly-overview-card${item.overdue ? " overdue" : ""}" type="button" data-edit-week="${item.week}"${item.item ? "" : ""} aria-label="Editar ${item.week}ª semana">
      <span>${item.week}ª semana</span>
      <strong>${formatMoney(item.received || item.expected)}</strong>
      <small>${escapeHtml(item.status)}</small>
    </button>
  `).join("");
}

function renderCategories(transactions, personalExpenses) {
  const totals = {};
  transactions.filter(item => item.type === "expense").forEach(item => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
  });
  personalExpenses.forEach(item => {
    totals[item.category] = (totals[item.category] || 0) + (Number(item.amount) || 0);
  });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  document.getElementById("category-total").textContent = `${entries.length} categoria${entries.length === 1 ? "" : "s"}`;

  const container = document.getElementById("category-list");
  container.innerHTML = entries.length ? entries.map(([name, amount]) => `
    <div class="category-row">
      <span class="category-name">${categoryIcons[name] || "•"} ${escapeHtml(name)}</span>
      <div class="progress-track"><span style="width:${total ? Math.max(4, amount / total * 100) : 0}%"></span></div>
      <span class="category-value">${formatMoney(amount)}</span>
    </div>
  `).join("") : '<div class="empty-state">Nenhum gasto registrado neste mês.</div>';
}

function transactionMarkup(item, compact = false) {
  const date = new Date(`${item.date}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
  const sign = item.type === "income" ? "+" : "-";
  const incomeStatus = item.type === "income"
    ? `<span>${item.overdue ? (item.received ? `Recebido com atraso em ${formatShortDate(item.receivedDate || item.date)}` : "Atrasado") : item.received ? `Recebido em ${formatShortDate(item.receivedDate || item.date)}` : "Pagamento previsto"}${item.weekDay ? ` · ${item.weekDay}` : ""}</span>`
    : `<span>${escapeHtml(item.category)} · ${dateLabel}</span>`;
  if (compact) {
    return `<div class="transaction-item">
      <span class="transaction-badge">${categoryIcons[item.category] || "•"}</span>
      <div class="transaction-info"><strong>${escapeHtml(item.description)}</strong>${incomeStatus}</div>
      <div class="transaction-actions">
        <strong class="transaction-value ${item.type}">${sign} ${formatMoney(item.amount)}</strong>
        <button class="row-action edit-action" type="button" data-edit="${escapeHtml(item.id)}" title="Alterar valor" aria-label="Alterar ${escapeHtml(item.description)}">✎</button>
      </div>
    </div>`;
  }
  const method = item.method === "card" ? "Cartão" : item.method === "cash" ? "Dinheiro" : "Conta";
  const status = item.type === "income"
    ? `${item.overdue ? (item.received ? `Recebido com atraso em ${formatShortDate(item.receivedDate || item.date)}` : "Atrasado") : item.received ? `Recebido em ${formatShortDate(item.receivedDate || item.date)}` : "Pagamento previsto"}${item.weekDay ? ` · ${item.weekDay}` : ""}`
    : method;
  return `<div class="transaction-table-row">
    <div class="row-description"><span class="transaction-badge">${categoryIcons[item.category] || "•"}</span><span>${escapeHtml(item.description)}</span></div>
    <span class="row-category">${escapeHtml(item.category)}</span>
    <span class="row-method">${status}</span>
    <div class="table-actions">
      <strong class="amount-cell ${item.type}">${sign} ${formatMoney(item.amount)}</strong>
      <button class="row-action edit-action" type="button" data-edit="${escapeHtml(item.id)}" title="Alterar valor" aria-label="Alterar ${escapeHtml(item.description)}">✎</button>
    </div>
  </div>`;
}

function formatShortDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}

function renderWeeklyPaymentFields() {
  const weekdays = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
  const dayOptions = weekdays.map(day => `<option>${day}</option>`).join("");
  document.getElementById("weekly-payments").innerHTML = Array.from({ length: 4 }, (_, index) => {
    const week = index + 1;
    return `
      <section class="weekly-payment">
        <div class="weekly-payment-heading">
          <div><strong>${week}ª semana</strong><small>Valor previsto e data do pagamento</small></div>
          <label class="check-option" for="week-received-${week}">
            <input id="week-received-${week}" name="weekReceived${week}" type="checkbox">
            <span><strong>Recebi</strong></span>
          </label>
        </div>
        <div class="weekly-fields">
          <label>Dia<select name="weekDay${week}">${dayOptions}</select></label>
          <label>Data<input name="weekDate${week}" type="date"></label>
          <label>Valor (R$)<input name="weekAmount${week}" type="number" min="0" step="0.01"></label>
        </div>
        <div class="late-payment">
          <label class="check-option late-payment-toggle" for="week-overdue-${week}">
            <input id="week-overdue-${week}" name="weekOverdue${week}" type="checkbox">
            <span><strong>Adicionar complemento por atraso</strong><small>Este valor continua vinculado à ${week}ª semana</small></span>
          </label>
          <div class="overdue-fields" id="overdue-fields-${week}" hidden>
            <label>Dia<select name="weekOverdueDay${week}">${dayOptions}</select></label>
            <label>Data<input name="weekOverdueDate${week}" type="date"></label>
            <label>Valor (R$)<input name="weekOverdueAmount${week}" type="number" min="0" step="0.01"></label>
            <label class="check-option overdue-received" for="week-overdue-received-${week}">
              <input id="week-overdue-received-${week}" name="weekOverdueReceived${week}" type="checkbox">
              <span><strong>Já recebi este complemento</strong></span>
            </label>
          </div>
        </div>
      </section>`;
  }).join("");
}

renderWeeklyPaymentFields();

function syncWeeklyPayment(week) {
  const overdue = document.querySelector(`[name="weekOverdue${week}"]`);
  document.getElementById(`overdue-fields-${week}`).hidden = !overdue.checked;
}

for (let week = 1; week <= 4; week++) {
  document.querySelector(`[name="weekReceived${week}"]`).addEventListener("change", () => syncWeeklyPayment(week));
  document.querySelector(`[name="weekOverdue${week}"]`).addEventListener("change", () => syncWeeklyPayment(week));
}

function renderRecent(transactions) {
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  document.getElementById("recent-list").innerHTML = recent.length
    ? recent.map(item => transactionMarkup(item, true)).join("")
    : '<div class="empty-state">Adicione sua primeira movimentação.</div>';
}

function renderTransactions(transactions) {
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const filtered = transactions.filter(item =>
    !query || `${item.description} ${item.category}`.toLowerCase().includes(query)
  ).sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById("transactions-list").innerHTML = filtered.length
    ? filtered.map(item => transactionMarkup(item)).join("")
    : '<div class="empty-state">Nenhuma movimentação encontrada.</div>';
}

function renderCard(cardTransactions, cardTotal) {
  const limit = Number(state.cardLimit) || 0;
  const usage = Math.min(Number(state.cardUsed) || 0, limit);
  const available = Math.max(0, limit - usage);
  const percent = limit ? Math.min(100, usage / limit * 100) : 0;
  document.getElementById("card-total").textContent = formatMoney(usage);
  document.getElementById("card-limit-used").textContent = formatMoney(usage);
  document.getElementById("card-limit-value").textContent = formatMoney(limit);
  document.getElementById("card-balance-large").textContent = formatMoney(usage);
  document.getElementById("card-used-percent").textContent = `${Math.round(percent)}%`;
  document.getElementById("card-available-limit").textContent = formatMoney(available);
  document.getElementById("card-progress").style.width = `${percent}%`;
  const range = document.getElementById("card-limit-range");
  range.max = String(limit);
  range.value = String(usage);
  document.getElementById("limit-range-max").textContent = formatMoney(limit);
  document.getElementById("card-list").innerHTML = cardTransactions.length
    ? [...cardTransactions].sort((a, b) => b.date.localeCompare(a.date)).map(item => transactionMarkup(item, true)).join("")
    : '<div class="empty-state">Nenhuma compra lançada no cartão neste mês.</div>';
}

function showView(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.dataset.viewPanel === name));
  document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  document.body.classList.remove("menu-open");
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

const billModal = document.getElementById("bill-modal");
const billModalTitle = document.getElementById("bill-modal-title");
const billModalBody = document.getElementById("bill-modal-body");

const billData = {
  TikTok: [
    {
      name: "Presente aniversario",
      installments: [
        { number: 1, date: "17/11/2026", value: "R$ 50,00" },
        { number: 2, date: "02/12/2026", value: "R$ 44,62" }
      ]
    },
    {
      name: "Kit presente",
      installments: [
        { number: 1, date: "05/11/2026", value: "R$ 50,00" }
      ]
    }
  ],
  Noroeste: [{
    name: "Rastreira",
    installments: [
      { number: 1, date: "04/09/2026", value: "R$ 40,00" },
      { number: 2, date: "10/10/2026", value: "R$ 88,58" },
      { number: 3, date: "10/11/2026", value: "R$ 89,90" },
      { number: 4, date: "10/12/2026", value: "R$ 89,90" }
    ]
  }],
  "Mercado Pago": [{
    name: "Emprestimo",
    installments: [
      { number: 1, date: "12/11/2026", value: "R$ 327,00" },
      { number: 2, date: "14/12/2026", value: "R$ 327,00" }
    ]
  }],
  Moto: [{
    name: "Revisao",
    installments: [
      { number: 1, date: "28/11/2026", value: "R$ 500,00" },
      { number: 2, date: "28/12/2026", value: "R$ 500,00" }
    ]
  }]
};

function isInstallmentPaid(platform, purchaseName, installmentNumber) {
  return Boolean(state.billsPaid?.[`${platform}|${purchaseName}|${installmentNumber}`]);
}

function openBillInstallments(platform, purchase) {
  billModalTitle.textContent = purchase.name;
  billModalBody.innerHTML = `
    <button class="bill-back" type="button" data-bill-back="${platform}">← Voltar para ${platform}</button>
    <div class="bill-items">
      ${purchase.installments.map(item => `
        <div class="installment-row">
          <span>Parcela ${item.number} - ${item.date}</span>
          <strong>${item.value}</strong>
          <label class="paid-installment">
            <input type="checkbox" data-installment-paid="${platform}|${purchase.name}|${item.number}" ${isInstallmentPaid(platform, purchase.name, item.number) ? "checked" : ""}>
            <span>Paga</span>
          </label>
        </div>
      `).join("")}
    </div>
  `;
  animateBillModalBody();
}

function openBillPlatform(platform) {
  billModalTitle.textContent = platform;
  const purchases = billData[platform] || [];
  billModalBody.innerHTML = purchases.length
    ? `<div class="bill-items">${purchases.map(purchase => `
        <button class="bill-item" type="button" data-purchase="${platform}|${purchase.name}">
          <strong>${purchase.name}</strong><span>›</span>
        </button>
      `).join("")}</div>`
    : '<div class="empty-bills">Nenhum pagamento cadastrado.</div>';
  billModal.showModal();
  animateBillModalBody();
}

function animateBillModalBody() {
  billModalBody.classList.remove("bill-content-opening");
  void billModalBody.offsetWidth;
  billModalBody.classList.add("bill-content-opening");
}

document.querySelectorAll("[data-bill]").forEach(button => {
  button.addEventListener("click", () => openBillPlatform(button.dataset.bill));
});

billModalBody.addEventListener("click", event => {
  const purchaseButton = event.target.closest("[data-purchase]");
  if (purchaseButton) {
    const [platform, name] = purchaseButton.dataset.purchase.split("|");
    const purchase = billData[platform]?.find(item => item.name === name);
    if (purchase) openBillInstallments(platform, purchase);
  }
  const backButton = event.target.closest("[data-bill-back]");
  if (backButton) openBillPlatform(backButton.dataset.billBack);
});
billModalBody.addEventListener("change", event => {
  const checkbox = event.target.closest("[data-installment-paid]");
  if (!checkbox) return;
  const [platform, name, installmentNumber] = checkbox.dataset.installmentPaid.split("|");
  const purchase = billData[platform]?.find(item => item.name === name);
  const installment = purchase?.installments.find(item => item.number === Number(installmentNumber));
  if (installment) {
    state.billsPaid ||= {};
    state.billsPaid[`${platform}|${name}|${installmentNumber}`] = checkbox.checked;
    saveState();
  }
});
document.getElementById("bill-modal-close").addEventListener("click", () => billModal.close());

const expenseForm = document.getElementById("expense-form");
let activeExpenseCategory = "";

function renderExpenseRegisters() {
  const registers = state.personalExpenses[activeExpenseCategory] || [];
  document.getElementById("expense-register-list").innerHTML = registers.length
    ? registers.map((item, index) => `
      <div class="expense-register-item">
        <div><strong>${escapeHtml(item.name)}</strong><br><small>${item.date.split("-").reverse().join("/")}</small></div>
        <strong>${currency.format(item.amount)}</strong>
        <button type="button" data-remove-expense="${index}" aria-label="Excluir">×</button>
      </div>
    `).join("")
    : '<div class="empty-bills">Nenhum gasto cadastrado.</div>';
}

document.querySelectorAll("[data-expense-category]").forEach(card => {
  card.addEventListener("click", () => {
    activeExpenseCategory = card.dataset.expenseCategory;
    document.querySelectorAll("[data-expense-category]").forEach(item => item.classList.toggle("selected", item === card));
    document.getElementById("expense-inline-title").textContent = activeExpenseCategory;
    document.getElementById("expense-submit").disabled = false;
    document.getElementById("expense-date").value = new Date().toISOString().slice(0, 10);
    expenseForm.reset();
    document.getElementById("expense-date").value = new Date().toISOString().slice(0, 10);
    renderExpenseRegisters();
    const expenseManager = document.getElementById("expense-manager");
    expenseManager.classList.remove("expense-manager-opening");
    void expenseManager.offsetWidth;
    expenseManager.classList.add("expense-manager-opening");
    document.getElementById("expense-manager").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

expenseForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("expense-name").value.trim();
  const date = document.getElementById("expense-date").value;
  const amount = Number(document.getElementById("expense-amount").value);
  if (!name || !date || amount < 0) return;
  state.personalExpenses[activeExpenseCategory] ||= [];
  state.personalExpenses[activeExpenseCategory].push({ name, date, amount });
  saveState();
  render();
  expenseForm.reset();
  document.getElementById("expense-date").value = new Date().toISOString().slice(0, 10);
  renderExpenseRegisters();
});

document.getElementById("expense-register-list").addEventListener("click", event => {
  const button = event.target.closest("[data-remove-expense]");
  if (!button) return;
  state.personalExpenses[activeExpenseCategory].splice(Number(button.dataset.removeExpense), 1);
  saveState();
  render();
  renderExpenseRegisters();
});

monthOptions.forEach(option => {
  monthSelect.add(new Option(option.label, option.value));
});
monthSelect.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
monthSelect.addEventListener("change", render);

document.getElementById("menu-button").addEventListener("click", () => document.body.classList.toggle("menu-open"));
document.getElementById("add-button").addEventListener("click", () => {
  const form = document.getElementById("transaction-form");
  editingTransactionId = null;
  form.reset();
  form.elements.date.value = `${currentMonth()}-${String(new Date().getDate()).padStart(2, "0")}`;
  selectedType = "expense";
  document.querySelectorAll(".type-switch button").forEach(button => button.classList.toggle("active", button.dataset.type === selectedType));
  document.querySelector("#transaction-modal .eyebrow").textContent = "Novo lançamento";
  document.querySelector("#transaction-modal h2").textContent = "Adicionar movimentação";
  document.getElementById("transaction-submit").textContent = "Adicionar movimentação";
  syncIncomeStatus();
  document.getElementById("transaction-modal").showModal();
});

document.querySelectorAll(".type-switch button").forEach(button => {
  button.addEventListener("click", () => {
    selectedType = button.dataset.type;
    document.querySelectorAll(".type-switch button").forEach(item => item.classList.toggle("active", item === button));
    const category = document.querySelector('[name="category"]');
    category.value = selectedType === "income" ? "Salário" : "Alimentação";
    syncIncomeStatus();
  });
});

function syncIncomeStatus() {
  const category = document.querySelector('[name="category"]').value;
  const incomeStatus = document.getElementById("income-status");
  const show = selectedType === "income" && category === "Salário";
  incomeStatus.hidden = !show;
  document.querySelector('[name="amount"]').required = !show;
  if (!show) {
    for (let week = 1; week <= 4; week++) {
      document.querySelector(`[name="weekReceived${week}"]`).checked = false;
    }
  }
}

document.querySelector('[name="category"]').addEventListener("change", syncIncomeStatus);

function getWeeklySalaryRecords(item, week) {
  return state.transactions.filter(transaction =>
    transaction.category === "Salário"
    && transaction.week === week
    && (item.salaryGroup
      ? transaction.salaryGroup === item.salaryGroup
      : transaction.date.slice(0, 7) === item.date.slice(0, 7))
  );
}

function populateWeeklySalaryForm(item, week) {
  const form = document.getElementById("transaction-form");
  const records = item ? getWeeklySalaryRecords(item, week) : [];
  const regular = records.find(record => !record.overdue);
  const late = records.find(record => record.overdue);

  form.reset();
  form.elements.description.value = item
    ? item.description.replace(/ - \dª semana(?: atrasada| \(complemento\))?$/, "")
    : "Salário";
  form.elements.category.value = "Salário";
  form.elements.date.value = item?.date || `${currentMonth()}-${String(new Date().getDate()).padStart(2, "0")}`;

  document.querySelector(`[name="weekReceived${week}"]`).checked = Boolean(regular?.received);
  document.querySelector(`[name="weekDay${week}"]`).value = regular?.weekDay || "Segunda-feira";
  document.querySelector(`[name="weekDate${week}"]`).value = regular?.date || item?.date || "";
  document.querySelector(`[name="weekAmount${week}"]`).value = regular?.amount || "";

  document.querySelector(`[name="weekOverdue${week}"]`).checked = Boolean(late);
  document.querySelector(`[name="weekOverdueDay${week}"]`).value = late?.weekDay || "Segunda-feira";
  document.querySelector(`[name="weekOverdueDate${week}"]`).value = late?.date || "";
  document.querySelector(`[name="weekOverdueAmount${week}"]`).value = late?.amount || "";
  document.querySelector(`[name="weekOverdueReceived${week}"]`).checked = Boolean(late?.received);
  syncWeeklyPayment(week);
}

document.getElementById("transaction-form").addEventListener("submit", event => {
  const submitter = event.submitter;
  if (!submitter || submitter.value === "cancel") return;
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const isWeeklySalary = selectedType === "income" && data.get("category") === "Salário";
  if (isWeeklySalary) {
    const current = state.transactions.find(item => item.id === editingTransactionId);
    const groupId = current?.salaryGroup || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const weeks = current ? [current.week || 1] : [1, 2, 3, 4];

    for (const week of weeks) {
      const previousRecords = current
        ? state.transactions.filter(item => item.category === "Salário"
          && item.week === week
          && (current.salaryGroup
            ? item.salaryGroup === current.salaryGroup
            : item.date.slice(0, 7) === current.date.slice(0, 7)))
        : [];
      const regular = previousRecords.find(item => !item.overdue);
      const late = previousRecords.find(item => item.overdue);
      const amount = Number(data.get(`weekAmount${week}`));
      const lateAmount = Number(data.get(`weekOverdueAmount${week}`));
      const weekDate = data.get(`weekDate${week}`) || data.get("date");
      const lateDate = data.get(`weekOverdueDate${week}`) || data.get("date");
      const received = data.get(`weekReceived${week}`) === "on";
      const lateReceived = data.get(`weekOverdueReceived${week}`) === "on";
      const description = data.get("description").trim();

      state.transactions = state.transactions.filter(item =>
        !previousRecords.some(previous => previous.id === item.id)
      );

      if (amount > 0) {
        state.transactions.push({
          id: regular?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${week}`),
          type: "income",
          description: `${description} - ${week}ª semana`,
          amount,
          date: weekDate,
          category: "Salário",
          method: "account",
          received,
          receivedDate: received ? weekDate : "",
          overdue: false,
          week,
          weekDay: data.get(`weekDay${week}`),
          salaryGroup: groupId
        });
      }

      if (data.get(`weekOverdue${week}`) === "on" && lateAmount > 0) {
        state.transactions.push({
          id: late?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${week}-late`),
          type: "income",
          description: `${description} - ${week}ª semana (complemento)`,
          amount: lateAmount,
          date: lateDate,
          category: "Salário",
          method: "account",
          received: lateReceived,
          receivedDate: lateReceived ? lateDate : "",
          overdue: true,
          week,
          weekDay: data.get(`weekOverdueDay${week}`),
          salaryGroup: groupId
        });
      }
    }
    saveState();
    document.getElementById("transaction-modal").close();
    render();
    return;
  }
  if (Number(data.get("amount")) <= 0) return;
  const transaction = {
    type: selectedType,
    description: data.get("description").trim(),
    amount: Number(data.get("amount")),
    date: data.get("date"),
    category: data.get("category"),
    method: selectedType === "income" ? "account" : data.get("method"),
    received: selectedType === "income" && data.get("received") === "on",
    receivedDate: selectedType === "income" && data.get("received") === "on" ? data.get("receivedDate") : ""
  };
  if (editingTransactionId) {
    const index = state.transactions.findIndex(item => item.id === editingTransactionId);
    if (index >= 0) state.transactions[index] = { ...state.transactions[index], ...transaction };
  } else {
    state.transactions.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...transaction
    });
  }
  saveState();
  document.getElementById("transaction-modal").close();
  render();
});

document.addEventListener("click", event => {
  const weekButton = event.target.closest("[data-edit-week]");
  if (weekButton) {
    const week = Number(weekButton.dataset.editWeek);
    const records = monthTransactions().filter(transaction =>
      transaction.category === "Salário" && transaction.week === week
    );
    const item = records.find(transaction => !transaction.overdue) || records[0];
    editingTransactionId = item?.id || null;
    selectedType = "income";
    populateWeeklySalaryForm(item, week);
    if (!item) {
      document.querySelector(`[name="weekDate${week}"]`).value = `${currentMonth()}-${String(new Date().getDate()).padStart(2, "0")}`;
    }
    syncIncomeStatus();
    document.querySelectorAll(".type-switch button").forEach(button => button.classList.toggle("active", button.dataset.type === selectedType));
    document.querySelector("#transaction-modal .eyebrow").textContent = "Alterar salário semanal";
    document.querySelector("#transaction-modal h2").textContent = `${week}ª semana do salário`;
    document.getElementById("transaction-submit").textContent = "Salvar alterações";
    document.getElementById("transaction-modal").showModal();
    return;
  }
  const editButton = event.target.closest("[data-edit]");
  if (!editButton) return;
  const item = state.transactions.find(transaction => transaction.id === editButton.dataset.edit);
  if (!item) return;
  editingTransactionId = item.id;
  selectedType = item.type;
  const form = document.getElementById("transaction-form");
  if (item.category === "Salário" && item.week) {
    populateWeeklySalaryForm(item, item.week);
    syncIncomeStatus();
    document.querySelectorAll(".type-switch button").forEach(button => button.classList.toggle("active", button.dataset.type === selectedType));
    document.querySelector("#transaction-modal .eyebrow").textContent = "Alterar salário semanal";
    document.querySelector("#transaction-modal h2").textContent = `${item.week}ª semana do salário`;
    document.getElementById("transaction-submit").textContent = "Salvar alterações";
    document.getElementById("transaction-modal").showModal();
    return;
  }
  form.reset();
  form.elements.description.value = item.description;
  form.elements.amount.value = item.amount;
  form.elements.date.value = item.date;
  form.elements.category.value = item.category;
  form.elements.method.value = item.method;
  syncIncomeStatus();
  document.querySelectorAll(".type-switch button").forEach(button => button.classList.toggle("active", button.dataset.type === selectedType));
  document.querySelector("#transaction-modal .eyebrow").textContent = "Alterar lançamento";
  document.querySelector("#transaction-modal h2").textContent = "Editar movimentação";
  document.getElementById("transaction-submit").textContent = "Salvar alterações";
  document.getElementById("transaction-modal").showModal();
});

document.getElementById("search-input").addEventListener("input", render);
document.getElementById("edit-limit-button").addEventListener("click", () => {
  document.getElementById("limit-input").value = state.cardLimit;
  document.getElementById("limit-modal").showModal();
});
document.getElementById("limit-form").addEventListener("submit", event => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  state.cardLimit = Number(document.getElementById("limit-input").value) || 0;
  state.cardUsed = Math.min(Number(state.cardUsed) || 0, state.cardLimit);
  saveState();
  document.getElementById("limit-modal").close();
  render();
});

document.getElementById("card-limit-range").addEventListener("input", event => {
  state.cardUsed = Math.min(Number(event.target.value) || 0, Number(state.cardLimit) || 0);
  state.cardUsageConfirmed = true;
  saveState();
  renderCard([], state.cardUsed);
});

render();
