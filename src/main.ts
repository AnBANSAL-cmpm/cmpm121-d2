import "./style.css";

const title = document.createElement("h1");
title.textContent = "Sticker Sketchup";
document.body.appendChild(title);

// Creating Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchup-canvas";
document.body.appendChild(canvas);

let currentStroke: MarkerLine | null = null;
const drawing: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];

class MarkerLine {
  private points: Array<{ x: number; y: number }> = [];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.thickness = thickness;
    this.points.push({ x: startX, y: startY });
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
}

let currentThickness = 2;

const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
thinButton.id = "thin-button";
document.body.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
thickButton.id = "thick-button";
document.body.appendChild(thickButton);

const ctx = canvas.getContext("2d");
if (!ctx) {
  // Fill background
  console.error("Failed to get 2D context");
  throw new Error("Failed to get 2D context");
}

function selectTool(thickness: number) {
  currentThickness = thickness;

  thinButton.classList.toggle("selected", thickness === 2);
  thickButton.classList.toggle("selected", thickness === 8);
}

thinButton.addEventListener("click", () => selectTool(2));
thickButton.addEventListener("click", () => selectTool(8));

// Initialize with thin tool selected
selectTool(2);

let isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  currentStroke = new MarkerLine(x, y, currentThickness);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !ctx || !currentStroke) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentStroke.drag(x, y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseleave", () => {
  if (isDrawing && currentStroke) {
    drawing.push(currentStroke);
    redoStack = [];
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
  isDrawing = false;
  currentStroke = null;
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke) {
    drawing.push(currentStroke);
    redoStack = [];
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
  isDrawing = false;
  currentStroke = null;
});

// Clear Button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.id = "clear-button";
document.body.appendChild(clearButton);

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.id = "undo-button";
document.body.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.id = "redo-button";
document.body.appendChild(redoButton);

undoButton.addEventListener("click", () => {
  if (drawing.length > 0) {
    const undone = drawing.pop();
    if (undone) {
      redoStack.push(undone);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redone = redoStack.pop();
    if (redone) {
      drawing.push(redone);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

clearButton.addEventListener("click", () => {
  drawing.length = 0;
  redoStack.length = 0;
  currentStroke = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of drawing) {
    stroke.display(ctx);
  }

  if (currentStroke) {
    currentStroke.display(ctx);
  }
});
