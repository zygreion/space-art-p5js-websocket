// Object to draw
let objectIndex = 0;
let spaceObjects = [
  { name: "monster", src: "monster.png", img: null },
  { name: "rocket", src: "rocket.png", img: null },
  { name: "saturn", src: "saturn.png", img: null },
  { name: "robot", src: "space-robot.png", img: null },
  { name: "technology", src: "technology.png", img: null },
  { name: "asteroid", src: "asteroid.png", img: null },
];

// Color configuration
const colors = [
  "white",
  "bisque",
  "yellow",
  "orange",
  "red",
  "blue",
  "skyblue",
  "lime",
  "green",
  "chocolate",
  "brown",
  "black",
];
let currentColor = colors[4];

// DOM elements
const objectTitle = document.getElementById("object-title");
const colorTitle = document.getElementById("color-title");
const brushSizeTitle = document.getElementById("brush-size-title");
const brushSizeInput = document.getElementById("brush-size-input");

// Socket configuration
let socket = null;

// Other configurations
const CURSOR_OPACITY = 100;
const GRID_SIZE = 10;
const imagePadding = 0.1; // 10%

let overlayGfx = null;
let drawGfx = null;
let brushSize = 0;

async function setup() {
  const size = min(
    500,
    windowWidth < windowHeight ? windowWidth : windowHeight,
  );

  canvas = createCanvas(size, size);
  noStroke();

  // drawGfx is the canvas to draw on
  drawGfx = createGraphics(width, height);
  drawGfx.noStroke();

  // overlayGfx is the canvas to draw the preview (cursor) on
  overlayGfx = createGraphics(width, height);
  overlayGfx.noStroke();

  generateHTMLButtons();

  // Set spaceObjects p5.image from their src
  for (const spaceObject of spaceObjects) {
    spaceObject.img = await loadImage(`../assets/template/${spaceObject.src}`);

    if (spaceObject.img.width > spaceObject.img.height) {
      spaceObject.img.resize(width * (1 - imagePadding / 2), 0);
    } else {
      spaceObject.img.resize(0, height * (1 - imagePadding / 2));
    }
  }

  // Touch screen event listeners
  canvas.elt.addEventListener("touchstart", handleStart);
  canvas.elt.addEventListener("touchend", handleEnd);
  canvas.elt.addEventListener("touchcancel", handleCancel);
  canvas.elt.addEventListener("touchmove", handleMove);

  // Sockets connection
  // socket = io();
  connectWebSocket();

  // First render
  resetObject();
  changeBrushSize(brushSizeInput.value);
}

function draw() {
  transparentGrid();
  drawCursor();

  // Paint current mouse position if mouse is pressed
  // touch (for mobile) handled by touchController.js
  if (!isTouchEnabled() && mouseIsPressed && mouseButton.left) {
    drawGfx.line(pmouseX, pmouseY, mouseX, mouseY);
  }

  image(drawGfx, 0, 0);
  image(overlayGfx, 0, 0);
}

// Draw preview cursor above drawGfx layer
function drawCursor() {
  if (isTouchEnabled()) return;

  overlayGfx.clear();
  overlayGfx.circle(mouseX, mouseY, drawGfx.strokeWeight());
}

// Predetermined color swatch button using colors array
function generateHTMLButtons() {
  for (const c of colors) {
    let button = createButton("");
    button.parent("color-button-wrapper");
    button.class("color-button");
    button.style("background-color", c);
    button.mousePressed(() => changeColor(button.elt));

    // Set first color to draw
    if (c === currentColor) changeColor(button.elt);
  }
}

// Change object template to draw using Prev and Next button
function addIndexBy(n) {
  if (n < 0) n += spaceObjects.length;
  objectIndex = (objectIndex + n) % spaceObjects.length;
  resetObject();
}

// Draw object template using current objectIndex
function drawObjectTemplate(index) {
  const img = spaceObjects[index].img;

  drawGfx.image(img, (imagePadding * width) / 4, (imagePadding * height) / 4);
  objectTitle.innerHTML = `Object: ${spaceObjects[index].name}`;
}

// Reset drawGfx layer
function resetObject() {
  drawGfx.clear();
  drawObjectTemplate(objectIndex);
}

// Draw transparent grid at the bottom of canvas
// This grid doesn't drawn in drawGfx layer
function transparentGrid() {
  for (let x = 0; x < width / GRID_SIZE; x++) {
    for (let y = 0; y < height / GRID_SIZE; y++) {
      let index = GRID_SIZE * y + x;
      if (GRID_SIZE % 2 == 0 && y % 2 == 1) index++;
      index %= 2;

      fill([255, 220][index]);
      rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE);
    }
  }
}

// Change current color
function changeColor(button) {
  currentColor = button.style.backgroundColor;

  // Draw color
  drawGfx.stroke(currentColor);

  // Cursor color
  const c = color(currentColor);
  c.setAlpha(CURSOR_OPACITY);
  overlayGfx.fill(c);

  colorTitle.innerHTML = `Color: ${currentColor}`;
}

// Change brush size
function changeBrushSize(value) {
  // Adjust for smaler or bigger screen
  brushSize = (Number.parseInt(value) * width) / 500;
  drawGfx.strokeWeight(brushSize);

  brushSizeTitle.innerHTML = `Size: ${value}`;
}

// Emit draw event to server
function submit() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const imageData = drawGfx.elt.toDataURL("image/png");

  const data = {
    type: spaceObjects[objectIndex].name,
    imageData: imageData,
  };

  // Kirim data sebagai JSON String murni
  socket.send(JSON.stringify(data));
}

// Check if CSS pointer is coarse (touchscreen) or solid (mouse)
function isTouchEnabled() {
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return isCoarsePointer && navigator.maxTouchPoints > 0;
}
