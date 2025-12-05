const STORAGE_KEY = "kanban-board-state";
const columns = [
  { id: "todo", label: "Do zrobienia" },
  { id: "doing", label: "W trakcie" },
  { id: "done", label: "Zrobione" },
];

const columnRefs = {};
const board = document.getElementById("board");
const state = loadState();

initBoard();

function initBoard() {
  columns.forEach((column) => {
    const section = document.createElement("section");
    section.className = "column";
    section.dataset.column = column.id;

    const header = document.createElement("div");
    header.className = "column-header";

    const heading = document.createElement("h2");
    heading.textContent = column.label;

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = state[column.id].length;

    header.append(heading, count);

    const actions = document.createElement("div");
    actions.className = "column-actions";
    actions.append(
      createActionButton("Dodaj kartę", "add-card"),
      createActionButton("Koloruj kolumnę", "color-column"),
      createActionButton("Sortuj karty", "sort-column")
    );

    const cardsContainer = document.createElement("div");
    cardsContainer.className = "cards";

    section.append(header, actions, cardsContainer);
    section.addEventListener("click", handleColumnClick);
    section.addEventListener("input", handleContentEdit);
    section.addEventListener("blur", handleContentBlur, true);

    columnRefs[column.id] = { section, cardsContainer, count };
    board.appendChild(section);
  });

  columns.forEach((column) => renderColumn(column.id));
}

function createActionButton(label, action) {
  const button = document.createElement("button");
  button.className = "action-btn";
  button.type = "button";
  button.dataset.action = action;
  button.textContent = label;
  return button;
}

function handleColumnClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  if (!action) return;

  const columnId = button.closest(".column")?.dataset.column;
  const cardId = button.closest(".card")?.dataset.id;

  switch (action) {
    case "add-card":
      addCard(columnId);
      break;
    case "color-column":
      colorColumn(columnId);
      break;
    case "sort-column":
      sortColumn(columnId);
      break;
    case "move-left":
      moveCard(cardId, columnId, -1);
      break;
    case "move-right":
      moveCard(cardId, columnId, 1);
      break;
    case "recolor-card":
      recolorCard(cardId, columnId);
      break;
    case "remove-card":
      removeCard(cardId, columnId);
      break;
    default:
      break;
  }
}

function handleContentEdit(event) {
  if (!event.target.classList.contains("card-title")) return;
  const columnId = event.target.closest(".column")?.dataset.column;
  const cardId = event.target.closest(".card")?.dataset.id;
  const card = findCard(cardId, columnId);
  if (!card) return;

  card.title = event.target.textContent;
  saveState();
}

function handleContentBlur(event) {
  if (!event.target.classList.contains("card-title")) return;
  const columnId = event.target.closest(".column")?.dataset.column;
  const cardId = event.target.closest(".card")?.dataset.id;
  const card = findCard(cardId, columnId);
  if (!card) return;

  const cleaned = event.target.textContent.trim() || "Bez tytułu";
  card.title = cleaned;
  event.target.textContent = cleaned;
  saveState();
}

function renderColumn(columnId) {
  const column = columnRefs[columnId];
  if (!column) return;

  column.cardsContainer.innerHTML = "";
  state[columnId].forEach((card) => {
    column.cardsContainer.appendChild(createCardElement(card, columnId));
  });
  column.count.textContent = state[columnId].length;
}

function createCardElement(card, columnId) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.id = card.id;
  article.style.backgroundColor = card.color;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const columnIndex = columns.findIndex((col) => col.id === columnId);
  const isFirst = columnIndex === 0;
  const isLast = columnIndex === columns.length - 1;

  actions.append(
    createIconButton("←", "move-left", isFirst),
    createIconButton("→", "move-right", isLast),
    createIconButton("🎨", "recolor-card"),
    createIconButton("×", "remove-card")
  );

  const title = document.createElement("div");
  title.className = "card-title";
  title.contentEditable = "true";
  title.spellcheck = false;
  title.textContent = card.title;

  article.append(actions, title);
  return article;
}

function createIconButton(label, action, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-btn";
  button.dataset.action = action;
  button.textContent = label;
  if (disabled) button.disabled = true;
  return button;
}

function addCard(columnId) {
  if (!columnId) return;
  const newCard = {
    id: createId(),
    title: "Nowa karta",
    color: randomColor(),
  };
  state[columnId].unshift(newCard);
  saveState();
  renderColumn(columnId);
}

function removeCard(cardId, columnId) {
  const cards = state[columnId];
  const index = cards.findIndex((card) => card.id === cardId);
  if (index === -1) return;
  cards.splice(index, 1);
  saveState();
  renderColumn(columnId);
}

function moveCard(cardId, columnId, direction) {
  const currentColumnIndex = columns.findIndex((col) => col.id === columnId);
  const targetIndex = currentColumnIndex + direction;
  if (targetIndex < 0 || targetIndex >= columns.length) return;

  const cards = state[columnId];
  const index = cards.findIndex((card) => card.id === cardId);
  if (index === -1) return;

  const [card] = cards.splice(index, 1);
  const targetColumnId = columns[targetIndex].id;
  state[targetColumnId].push(card);

  saveState();
  renderColumn(columnId);
  renderColumn(targetColumnId);
}

function sortColumn(columnId) {
  state[columnId].sort((a, b) =>
    a.title.localeCompare(b.title, "pl", { sensitivity: "base" })
  );
  saveState();
  renderColumn(columnId);
}

function colorColumn(columnId) {
  state[columnId] = state[columnId].map((card) => ({
    ...card,
    color: randomColor(),
  }));
  saveState();
  renderColumn(columnId);
}

function recolorCard(cardId, columnId) {
  const card = findCard(cardId, columnId);
  if (!card) return;
  card.color = randomColor();

  const cardElement = columnRefs[columnId].cardsContainer.querySelector(
    `[data-id="${cardId}"]`
  );
  if (cardElement) {
    cardElement.style.backgroundColor = card.color;
  }
  saveState();
}

function findCard(cardId, columnId) {
  if (!cardId || !columnId) return null;
  return state[columnId].find((card) => card.id === cardId) || null;
}

function loadState() {
  const blank = { todo: [], doing: [], done: [], nextId: 1 };
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { ...blank };
  const parsed = JSON.parse(saved);
  return {
    todo: parsed.todo || [],
    doing: parsed.doing || [],
    done: parsed.done || [],
    nextId: parsed.nextId || 1,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 75% 55%)`;
}

function createId() {
  const id = state.nextId || 1;
  state.nextId = id + 1;
  return String(id);
}
