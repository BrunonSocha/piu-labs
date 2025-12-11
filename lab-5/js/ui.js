import store from "./store.js";

const shapesContainer = document.getElementById("shapes");
const addSquareBtn = document.getElementById("add-square");
const addCircleBtn = document.getElementById("add-circle");
const recolorSquaresBtn = document.getElementById("recolor-squares");
const recolorCirclesBtn = document.getElementById("recolor-circles");

const countSquares = document.getElementById("count-squares");
const countCircles = document.getElementById("count-circles");
const countTotal = document.getElementById("count-total");

function createShapeElement(shape) {
  const el = document.createElement("div");
  el.className = "shape";
  el.dataset.id = shape.id;
  el.dataset.type = shape.type;
  el.style.backgroundColor = shape.color;
  return el;
}

function renderInitial(state) {
  shapesContainer.innerHTML = "";
  state.shapes.forEach((shape) => {
    shapesContainer.appendChild(createShapeElement(shape));
  });
  renderCounts(state);
}

function renderCounts(state) {
  const counts = store.getCounts(state);
  countSquares.textContent = counts.squares;
  countCircles.textContent = counts.circles;
  countTotal.textContent = counts.total;
}

function updateColors(type, shapes) {
  shapes.forEach((shape) => {
    const node = shapesContainer.querySelector(`[data-id="${shape.id}"]`);
    if (node) node.style.backgroundColor = shape.color;
  });
}

addSquareBtn.addEventListener("click", () => store.addShape("square"));
addCircleBtn.addEventListener("click", () => store.addShape("circle"));
recolorSquaresBtn.addEventListener("click", () => store.recolorType("square"));
recolorCirclesBtn.addEventListener("click", () => store.recolorType("circle"));

shapesContainer.addEventListener("click", (event) => {
  const target = event.target.closest(".shape");
  if (!target) return;
  const id = Number(target.dataset.id);
  store.removeShape(id);
});

store.subscribe((event, snapshot) => {
  if (!event) return;
  if (event.type === "add") {
    shapesContainer.appendChild(createShapeElement(event.shape));
  }
  if (event.type === "remove") {
    const el = shapesContainer.querySelector(`[data-id="${event.id}"]`);
    if (el) el.remove();
  }
  if (event.type === "recolor-type") {
    updateColors(event.shapeType, event.shapes);
  }
  renderCounts(snapshot);
});

renderInitial(store.getSnapshot());
