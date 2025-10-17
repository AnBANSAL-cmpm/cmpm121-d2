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

let currentStroke: Array<{ x: number; y: number }> = [];
const drawing: Array<Array<{ x: number; y: number }>> = [];

const ctx = canvas.getContext("2d");
if (!ctx) {
  // Fill background
  console.error("Failed to get 2D context");
  throw new Error("Failed to get 2D context");
}

let isDrawing = false;
let redoStack: Array<Array<{ x: number; y: number }>> = [];

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  currentStroke = [{ x, y }];
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentStroke.push({ x, y });
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseleave", () => {
  if (isDrawing && currentStroke.length > 0) {
    drawing.push(currentStroke);
    redoStack = [];
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
  isDrawing = false;
  currentStroke = [];
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke.length > 0) {
    drawing.push(currentStroke);
    redoStack = [];
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
  isDrawing = false;
  currentStroke = [];
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
    const lastStroke = drawing.pop();
    if (lastStroke) {
      redoStack.push(lastStroke);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const stroke = redoStack.pop();
    if (stroke) {
      drawing.push(stroke);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

clearButton.addEventListener("click", () => {
  drawing.length = 0;
  currentStroke = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of drawing) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }

  if (currentStroke.length > 1) {
    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }
    ctx.stroke();
  }
});
