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

type Drawable = MarkerLine | StickerCommand;

let currentStroke: Drawable | null = null;
const drawing: Drawable[] = [];
let redoStack: Drawable[] = [];

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

class StickerCommand {
  public x: number;
  public y: number;
  public emoji: string;

  constructor(x: number, y: number, emoji: string) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
  }

  drag(x: number, y: number) {
    // Reposition instead of extending like a marker
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

class StickerPreview {
  constructor(public x: number, public y: number, public emoji: string) {}

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

class ToolPreview {
  constructor(public x: number, public y: number, public thickness: number) {}

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
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

const context = ctx as CanvasRenderingContext2D;

function selectTool(thickness: number) {
  currentThickness = thickness;

  thinButton.classList.toggle("selected", thickness === 3);
  thickButton.classList.toggle("selected", thickness === 10);
}

thinButton.addEventListener("click", () => selectTool(2));
thickButton.addEventListener("click", () => selectTool(8));

// Initialize with thin tool selected
selectTool(2);

let isDrawing = false;
let toolPreview: ToolPreview | StickerPreview | null = null;

let currentTool: "marker" | "sticker" = "marker";
let currentSticker: string | null = null;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (currentTool === "marker") {
    currentStroke = new MarkerLine(x, y, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    currentStroke = new StickerCommand(x, y, currentSticker);
  }
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!context) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Always show tool preview
  if (currentTool === "marker") {
    toolPreview = new ToolPreview(x, y, currentThickness);
  } else if (currentTool === "sticker" && currentSticker) {
    toolPreview = new StickerPreview(x, y, currentSticker);
  }

  if (isDrawing && currentStroke) {
    currentStroke.drag(x, y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentStroke = null;
  toolPreview = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
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

function redraw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of drawing) {
    stroke.display(context);
  }

  if (currentStroke) {
    currentStroke.display(context);
  }

  if (!isDrawing && toolPreview && context) {
    toolPreview.display(context);
  }
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

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
  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

// Export Button
const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
exportButton.id = "export-button";
document.body.appendChild(exportButton);

exportButton.addEventListener("click", () => {
  // 1️⃣ Create a temporary high-resolution canvas
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  // 2️⃣ Scale context so drawings fill the larger canvas
  exportCtx.scale(4, 4); // because 1024 / 256 = 4

  // 3️⃣ Redraw everything except previews
  for (const stroke of drawing) {
    stroke.display(exportCtx);
  }

  // 4️⃣ Convert canvas to PNG and download
  const link = document.createElement("a");
  link.download = "sticker_sketchup.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

const stickerButtons = [
  { emoji: "🌸", id: "flower-sticker" },
  { emoji: "⭐", id: "star-sticker" },
  { emoji: "🐱", id: "cat-sticker" },
];

const stickerContainer = document.createElement("div");
stickerContainer.id = "sticker-container";
document.body.appendChild(stickerContainer);

function renderStickerButtons() {
  stickerContainer.innerHTML = "";

  stickerButtons.forEach(({ emoji, id }) => {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.id = id;
    btn.addEventListener("click", () => {
      currentTool = "sticker";
      currentSticker = emoji;
      thinButton.classList.remove("selected");
      thickButton.classList.remove("selected");

      document
        .querySelectorAll(".sticker-selected")
        .forEach((el) => el.classList.remove("sticker-selected"));
      btn.classList.add("sticker-selected");
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stickerContainer.appendChild(btn);
  });

  stickerContainer.appendChild(addStickerBtn);
}

const addStickerBtn = document.createElement("button");
addStickerBtn.textContent = "➕ Add Sticker";
addStickerBtn.id = "add-sticker-button";
addStickerBtn.addEventListener("click", () => {
  const userEmoji = prompt("Enter your custom sticker (emoji or text):", "💖");
  if (userEmoji && userEmoji.trim() !== "") {
    // Add to stickers array
    const newSticker = {
      emoji: userEmoji.trim(),
      id: `custom-${Date.now()}`,
    };
    stickerButtons.push(newSticker);
    renderStickerButtons(); // Refresh buttons to include new one
  }
});

// Initial render
renderStickerButtons();
