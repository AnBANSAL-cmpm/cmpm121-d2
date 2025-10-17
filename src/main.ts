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

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  currentStroke = [{ x, y }];
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke.length > 0) {
    drawing.push(currentStroke);
  }
  isDrawing = false;
  currentStroke = [];
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentStroke.push({ x, y });
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Clear Button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.id = "clear-button";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of drawing) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }
});
