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

const ctx = canvas.getContext("2d");
if (!ctx) {
  // Fill background
  console.error("Failed to get 2D context");
  throw new Error("Failed to get 2D context");
}

let isDrawing = false;

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !ctx) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2); //small circle
  ctx.fill();
});

// Clear Button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.id = "clear-button";
document.body.appendChild(clearButton);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
