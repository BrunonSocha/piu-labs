import { randomColor } from "./helpers.js";

const STORAGE_KEY = "shapes-state";

class Store {
  constructor() {
    const saved = this.load();
    this.state = saved || { shapes: [], nextId: 1 };
    this.subscribers = [];
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter((fn) => fn !== listener);
    };
  }

  getSnapshot() {
    return {
      shapes: [...this.state.shapes],
      nextId: this.state.nextId,
    };
  }

  notify(event) {
    this.save();
    this.subscribers.forEach((fn) => fn(event, this.getSnapshot()));
  }

  addShape(type) {
    const shape = {
      id: this.state.nextId,
      type,
      color: randomColor(),
    };
    this.state.nextId += 1;
    this.state.shapes.push(shape);
    this.notify({ type: "add", shape });
  }

  removeShape(id) {
    const idx = this.state.shapes.findIndex((s) => s.id === id);
    if (idx === -1) return;
    this.state.shapes.splice(idx, 1);
    this.notify({ type: "remove", id });
  }

  recolorType(type) {
    const updated = [];
    this.state.shapes = this.state.shapes.map((shape) => {
      if (shape.type !== type) return shape;
      const newShape = { ...shape, color: randomColor() };
      updated.push(newShape);
      return newShape;
    });
    if (!updated.length) return;
    this.notify({ type: "recolor-type", shapeType: type, shapes: updated });
  }

  getCounts(current = this.state) {
    const shapes = current.shapes || this.state.shapes;
    const squares = shapes.filter((s) => s.type === "square").length;
    const circles = shapes.filter((s) => s.type === "circle").length;
    return { squares, circles, total: shapes.length };
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* ignore write errors */
    }
  }
}

const store = new Store();
export default store;
