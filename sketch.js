let gui;
let pathCells = [];
let cellSizes = {};
let polybool; // For boolean operations

let params = {
  // Grid parameters
  gridWidth: 7,
  gridHeight: 7,
  gridSize: 500,
  squareGrid: true,
  showGrid: true,
  gridOnTop: false,
  gridStrokeWeight: 2,
  gridBlur: 0, // New parameter for grid blur

  // Shape parameters
  shapeType: "rectangle",
  shapeCornerRadius: 0,
  showPathShapeStroke: false,
  pathShapeStrokeWeight: 1,
  shapeBlur: 0, // New parameter for full shape blur
  insideBlur: false, // New parameter for inside-only blur
  shapeSize: 1.0,
  booleanUnion: false, // New parameter
  ellipseResolution: 32, // New parameter for ellipse polygon resolution
  positionNoise: 0, // New parameter for random displacement
  sizeNoise: 0, // New parameter for random size variation
  showShape: true, // Renamed from showPath

  // Color parameters
  shapeFillColor: "#ff0000",
  shapeFillColor2: "#0000ff",
  shapeFillColor3: "#00ff00",
  shapeAlpha: 1.0,
  showFill: true,
  backgroundColor: "#ffffff",
  gridColor: "#000000",
  shapeStrokeColor: "#000000",
  pathStrokeColor: "#000000",
  pathFillColor: "#666666",

  // Path parameters
  showPath: false, // New parameter to draw the actual path line
  fillPath: false,
  pathStrokeWeight: 2,
  pathType: "straight",
  selectedCells: 5,
  pathDirection: "any",
  pathShapeSpacing: 1,
  alignShapesToGrid: false,
  curveAmount: 0.5,
  constrainToGrid: true,
  closedLoop: false,
  uniqueRowsCols: false,
  includeSides: true,
  pathBlur: 0,

  // Gradient parameters
  gradientType: "none",
  gradientColors: "2",

  // General parameters
  regeneratePath: function () {
    updatePathCells();
  },
  exportImage: function () {
    let now = new Date();
    let dateString =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    saveCanvas(dateString + "_Atico_Stray", "png");
  },
  exportPackageVersions: function () {
    // Save date string for consistent filenames
    let now = new Date();
    let dateString =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    // Save current state
    let originalShowGrid = params.showGrid;
    let originalBgColor = params.backgroundColor;
    let originalUseTransparent = false; // Add a flag for transparent mode

    // Version 1: With grid (if not already showing)
    if (!originalShowGrid) {
      params.showGrid = true;
      redraw(); // Force redraw with updated parameters
    }
    saveCanvas(dateString + "_Atico_Stray_grid_bg", "png");

    // Version 2: Without grid
    params.showGrid = false;
    redraw(); // Force redraw with updated parameters
    saveCanvas(dateString + "_Atico_Stray_nogrid_bg", "png");

    // Add transparent mode flag to allow draw() to handle transparency
    originalUseTransparent = window.useTransparentBackground;
    window.useTransparentBackground = true;

    // Version 3: With grid + transparent background
    params.showGrid = true;
    redraw(); // Force redraw with transparent background
    saveCanvas(dateString + "_Atico_Stray_grid_nobg", "png");

    // Version 4: Without grid + transparent background
    params.showGrid = false;
    redraw(); // Force redraw with updated parameters
    saveCanvas(dateString + "_Atico_Stray_nobg", "png");

    // Restore original state
    params.showGrid = originalShowGrid;
    params.backgroundColor = originalBgColor;
    window.useTransparentBackground = originalUseTransparent;
    redraw(); // Restore original view
  },

  // Add these new parameters
  pathCornerRadius: 0, // For rounded corners on the path
  pathStrokeCap: "square", // For different stroke cap styles
  pathStrokeJoin: "miter", // Default join style (options: miter, round, bevel)

  // Add a new parameter for shape styles
  shapeStyle: "default", // Options: "default", "paint", etc.
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Initialize transparent background flag
  window.useTransparentBackground = false;

  // Initialize polybool if available
  if (typeof PolyBool !== "undefined") {
    polybool = PolyBool;
  }
  setupGUI();
  updatePathCells();
}

function setupGUI() {
  gui = new dat.GUI();
  gui.width = 400;

  // Add General folder at the top
  let generalFolder = gui.addFolder("General");
  generalFolder.add(params, "regeneratePath").name("Regenerate (R)");
  generalFolder.add(params, "exportImage").name("Save (S)");
  generalFolder.add(params, "exportPackageVersions").name("Save (package) (E)"); // Updated name

  // Add the shape style dropdown
  generalFolder
    .add(params, "shapeStyle", ["default", "paint", "grid", "pixel"])
    .name("Shape Style")
    .onChange(function (value) {
      applyShapeStyle(value);
    });

  generalFolder.open();

  // Grid folder
  let gridFolder = gui.addFolder("Grid");
  gridFolder.add(params, "showGrid").name("Show Grid");
  gridFolder.add(params, "gridOnTop").name("Grid on Top");
  gridFolder.add(params, "squareGrid").name("Square Grid");
  let widthControl = gridFolder
    .add(params, "gridWidth", 1, 20, 1)
    .onChange(() => {
      if (params.squareGrid) {
        params.gridHeight = params.gridWidth;
        // Update GUI to reflect new height
        for (let controller of gridFolder.__controllers) {
          if (controller.property === "gridHeight") {
            controller.updateDisplay();
            break;
          }
        }
      }
      updatePathCells();
    });
  let heightControl = gridFolder
    .add(params, "gridHeight", 1, 20, 1)
    .onChange(() => {
      if (params.squareGrid) {
        params.gridWidth = params.gridHeight;
        // Update GUI to reflect new width
        for (let controller of gridFolder.__controllers) {
          if (controller.property === "gridWidth") {
            controller.updateDisplay();
            break;
          }
        }
      }
      updatePathCells();
    });
  gridFolder.add(params, "gridSize", 100, 1000).name("Grid Size");
  gridFolder.add(params, "gridStrokeWeight", 0.1, 5).name("Grid Stroke Weight");
  gridFolder.add(params, "gridBlur", 0, 20).name("Grid Blur"); // New slider for grid blur

  // Shape folder
  let shapeFolder = gui.addFolder("Shape");
  shapeFolder
    .add(params, "shapeType", ["rectangle", "ellipse"])
    .name("Shape Type");
  // Add the show shape toggle (moved from path folder)
  shapeFolder.add(params, "showShape").name("Show Shape");
  shapeFolder
    .add(params, "booleanUnion")
    .name("Boolean Union")
    .onChange(function (value) {
      if (value === true && params.pathShapeSpacing < 10) {
        // Enforce minimum spacing for boolean union
        params.pathShapeSpacing = 10;

        // Update the GUI slider for path shape spacing
        for (let controller of pathFolder.__controllers) {
          if (controller.property === "pathShapeSpacing") {
            controller.updateDisplay();
            break;
          }
        }
      }

      // Enable/disable insideBlur toggle based on boolean union state
      for (let controller of shapeFolder.__controllers) {
        if (controller.property === "insideBlur") {
          controller.domElement.parentElement.style.pointerEvents = value
            ? "auto"
            : "none";
          controller.domElement.parentElement.style.opacity = value
            ? "1"
            : "0.5";

          // If turning off boolean union, also turn off insideBlur
          if (!value && params.insideBlur) {
            params.insideBlur = false;
            controller.updateDisplay();
          }
          break;
        }
      }
    });
  shapeFolder
    .add(params, "ellipseResolution", 8, 32, 1)
    .name("Ellipse Resolution");
  shapeFolder.add(params, "positionNoise", 0, 50).name("Position Noise");
  shapeFolder.add(params, "sizeNoise", 0, 0.5).name("Size Noise");
  shapeFolder
    .add(params, "shapeCornerRadius", 0, 50)
    .name("Shape Corner Radius");
  shapeFolder.add(params, "showPathShapeStroke").name("Show Shape Stroke");
  shapeFolder
    .add(params, "pathShapeStrokeWeight", 0.1, 50)
    .name("Shape Stroke Weight");
  shapeFolder.add(params, "shapeBlur", 0, 50).name("Shape Blur");
  let insideBlurController = shapeFolder
    .add(params, "insideBlur")
    .name("Inside-Only Blur");
  shapeFolder.add(params, "shapeSize", 0.1, 2).name("Shape Size");

  // Path folder
  let pathFolder = gui.addFolder("Path");
  // Add new toggle for showing path line
  pathFolder.add(params, "showPath").name("Show Path Stroke");
  pathFolder.add(params, "fillPath").name("Show Path Fill"); // Add toggle for filling the path
  pathFolder.add(params, "pathBlur", 0, 50).name("Path Blur");
  pathFolder
    .add(params, "pathStrokeWeight", 0.1, 100)
    .name("Path Stroke Weight"); // Add path stroke weight slider
  pathFolder
    .add(params, "pathType", ["straight", "curved", "continuous"])
    .name("Path Type");
  pathFolder
    .add(params, "selectedCells", 2, 50, 1)
    .name("Number of Cells")
    .onChange(updatePathCells);
  let spacingController = pathFolder
    .add(params, "pathShapeSpacing", 1, 500)
    .name("Shape Spacing")
    .onChange(function (value) {
      // If boolean union is active, enforce minimum spacing of 10
      if (params.booleanUnion && value < 10) {
        params.pathShapeSpacing = 10;
        spacingController.updateDisplay();
      }
    });
  pathFolder.add(params, "alignShapesToGrid").name("Align Shapes to Grid");
  //  .onChange(updatePathCells);
  pathFolder.add(params, "curveAmount", 0, 1).name("Curvature");
  pathFolder.add(params, "constrainToGrid").name("Constrain to Grid");
  pathFolder.add(params, "closedLoop").name("Close Loop");
  pathFolder
    .add(params, "uniqueRowsCols")
    .name("Unique Rows/Cols")
    .onChange(updatePathCells);
  pathFolder
    .add(params, "pathDirection", ["any", "90", "45", "90+45"])
    .name("Path Direction")
    .onChange(updatePathCells);
  pathFolder
    .add(params, "includeSides")
    .name("Side Connections")
    .onChange(updatePathCells);
  pathFolder.add(params, "pathCornerRadius", 0, 50).name("Path Corner Radius");
  pathFolder
    .add(params, "pathStrokeCap", ["round", "square", "project"])
    .name("Path Stroke Cap");
  pathFolder
    .add(params, "pathStrokeJoin", ["miter", "round", "bevel"])
    .name("Path Stroke Join");

  // Color folder
  let colorFolder = gui.addFolder("Colors");
  colorFolder.addColor(params, "backgroundColor").name("Background Color");
  colorFolder.addColor(params, "gridColor").name("Grid Color");
  colorFolder.addColor(params, "shapeStrokeColor").name("Shape Stroke Color");
  colorFolder.addColor(params, "pathStrokeColor").name("Path Stroke Color");
  colorFolder.addColor(params, "pathFillColor").name("Path Fill Color");
  colorFolder.add(params, "showFill").name("Show Shape Fill");
  colorFolder
    .add(params, "shapeAlpha", 0, 1)
    .step(0.01)
    .name("Shape Transparency");
  colorFolder
    .add(params, "gradientType", [
      "none",
      "horizontal",
      "vertical",
      "length",
      "radial",
      "diagonal",
      "conic",
    ])
    .name("Gradient Type");
  colorFolder.add(params, "gradientColors", ["2", "3"]).name("Gradient Colors");
  colorFolder.addColor(params, "shapeFillColor").name("Shape Fill Color 1");
  colorFolder.addColor(params, "shapeFillColor2").name("Shape Fill Color 2");
  colorFolder.addColor(params, "shapeFillColor3").name("Shape Fill Color 3");

  // Open folders
  gridFolder.open();
  shapeFolder.open();
  colorFolder.open();
  pathFolder.open();
}

// Add a new function to handle style changes
function applyShapeStyle(style) {
  // Save current controllers to update later
  let controllers = {
    showShape: null,
    showPath: null,
    pathBlur: null,
    pathStrokeWeight: null,
    pathType: null,
    curveAmount: null,
    pathStrokeCap: null,
    pathStrokeJoin: null,
    selectedCells: null,
    booleanUnion: null,
    shapeCornerRadius: null,
    showPathShapeStroke: null,
    pathShapeStrokeWeight: null,
    shapeBlur: null,
    insideBlur: null,
    shapeSize: null,
    alignShapesToGrid: null,
    shapeType: null,
    positionNoise: null,
    sizeNoise: null,
    gradientType: null,
    gradientColors: null,
  };

  // Find all controllers we need to update
  for (let folder in gui.__folders) {
    for (let controller of gui.__folders[folder].__controllers) {
      if (controllers.hasOwnProperty(controller.property)) {
        controllers[controller.property] = controller;
      }
    }
  }

  // Apply the selected style
  if (style === "paint") {
    // Set Paint style values
    params.showShape = false;
    params.showPath = true;
    params.pathBlur = 10;
    params.pathStrokeWeight = 75;
    params.pathType = "curved";
    params.curveAmount = 0.05;
    params.pathStrokeCap = "round";
    params.pathStrokeJoin = "round";
    params.selectedCells = 10;

    // Update all controllers to reflect the new values
    for (let prop in controllers) {
      if (controllers[prop]) {
        controllers[prop].updateDisplay();
      }
    }
  } else if (style === "grid") {
    // Set Grid style values
    params.booleanUnion = true;
    params.shapeCornerRadius = 20;
    params.showPathShapeStroke = true;
    params.pathShapeStrokeWeight = 30;
    params.shapeBlur = 15;
    params.insideBlur = true;
    params.shapeSize = 1.1;
    params.alignShapesToGrid = true;
    params.showShape = true;
    params.selectedCells = 5;
    params.shapeType = "rectangle";
    params.showPath = false;

    // Update all controllers to reflect the new values
    for (let prop in controllers) {
      if (controllers[prop]) {
        controllers[prop].updateDisplay();
      }
    }

    // Regenerate path with new settings
    updatePathCells();
  } else if (style === "pixel") {
    // New Pixel style settings
    params.shapeType = "rectangle";
    params.showShape = true;
    params.booleanUnion = true;
    params.positionNoise = 10;
    params.sizeNoise = 0.5;
    params.showPathShapeStroke = true;
    params.pathShapeStrokeWeight = 5;
    params.selectedCells = 8;
    params.gradientType = "vertical";
    params.gradientColors = "2";
    params.shapeSize = 0.5;

    // Turn off other features that might conflict
    params.showPath = false;
    params.shapeCornerRadius = 0;
    params.shapeBlur = 0;
    params.insideBlur = false;
    params.pathBlur = 0;
    params.alignShapesToGrid = false;

    // Update all controllers to reflect the new values
    for (let prop in controllers) {
      if (controllers[prop]) {
        controllers[prop].updateDisplay();
      }
    }
  } else if (style === "default") {
    // You could reset to default values here if needed
    // For now, we'll let the user manually adjust from the Paint preset
  }
  // Regenerate the path after changing style settings
  updatePathCells();
}

function draw() {
  // Check if we should use transparent background
  if (window.useTransparentBackground) {
    // For transparent background, use clear() instead of background()
    clear();
  } else {
    // Regular opaque background
    background(params.backgroundColor);
  }

  translate((width - params.gridSize) / 2, (height - params.gridSize) / 2);

  if (params.showGrid && !params.gridOnTop) {
    drawGrid();
  }

  // Draw the path and shapes as needed
  if (params.showShape || params.showPath || params.fillPath) {
    drawPath();
  }

  if (params.showGrid && params.gridOnTop) {
    drawGrid();
  }
}

// Updated grid drawing function with blur
function drawGrid() {
  if (params.gridBlur > 0) {
    push();
    drawingContext.filter = `blur(${params.gridBlur}px)`;
  }

  stroke(params.gridColor);
  strokeWeight(params.gridStrokeWeight);
  noFill();

  let cellWidth = params.gridSize / params.gridWidth;
  let cellHeight = params.gridSize / params.gridHeight;

  for (let i = 0; i <= params.gridHeight; i++) {
    line(0, i * cellHeight, params.gridSize, i * cellHeight);
  }
  for (let j = 0; j <= params.gridWidth; j++) {
    line(j * cellWidth, 0, j * cellWidth, params.gridSize);
  }

  if (params.gridBlur > 0) {
    drawingContext.filter = "none";
    pop();
  }
}

function drawPath() {
  // Draw the path line if either stroke or fill is enabled
  if (params.showPath || params.fillPath) {
    drawPathLine();
  }

  // Draw the shapes if enabled
  if (params.showShape) {
    if (params.booleanUnion && polybool) {
      drawBooleanUnionPath();
    } else {
      drawRegularPath();
    }
  }
}

// New function to draw just the path line
function drawPathLine() {
  let numSegments = params.closedLoop ? pathCells.length : pathCells.length - 1;
  let cellWidth = params.gridSize / params.gridWidth;
  let cellHeight = params.gridSize / params.gridHeight;

  // Apply blur if enabled
  if (params.pathBlur > 0) {
    push();
    drawingContext.filter = `blur(${params.pathBlur}px)`;
  }

  // Set stroke and fill independently based on toggles
  if (params.showPath) {
    stroke(params.pathStrokeColor);
    strokeWeight(params.pathStrokeWeight);

    // Apply the selected stroke cap style
    switch (params.pathStrokeCap) {
      case "round":
        strokeCap(ROUND);
        break;
      case "project":
        strokeCap(PROJECT);
        break;
      case "square":
      default:
        strokeCap(SQUARE);
        break;
    }

    // Apply the selected stroke join style
    switch (params.pathStrokeJoin) {
      case "round":
        strokeJoin(ROUND);
        break;
      case "bevel":
        strokeJoin(BEVEL);
        break;
      case "miter":
      default:
        strokeJoin(MITER);
        break;
    }
  } else {
    noStroke(); // Don't show stroke if showPath is false
  }

  // Set fill independently of stroke
  if (params.fillPath) {
    fill(params.pathFillColor);
  } else {
    noFill(); // Don't show fill if fillPath is false
  }

  // Only proceed with drawing if either stroke or fill is enabled
  if (!params.showPath && !params.fillPath) {
    return; // Skip drawing if both stroke and fill are disabled
  }

  // For paths with corner radius, we need to use a custom drawing approach
  if (params.pathCornerRadius > 0 && params.pathType !== "curved") {
    // Draw path with rounded corners
    drawPathWithRoundedCorners(cellWidth, cellHeight);
  } else {
    // Original path drawing code
    if (params.pathType === "curved") {
      beginShape();

      for (let i = 0; i < pathCells.length; i++) {
        let currentCell = pathCells[i];
        let x = currentCell.j * cellWidth + cellWidth / 2;
        let y = currentCell.i * cellHeight + cellHeight / 2;

        // For the first point, just move to it
        if (i === 0) {
          vertex(x, y);
          continue;
        }

        let prevCell = pathCells[i - 1];
        let prevX = prevCell.j * cellWidth + cellWidth / 2;
        let prevY = prevCell.i * cellHeight + cellHeight / 2;

        // Calculate control points for curves
        let midX = (prevX + x) / 2;
        let midY = (prevY + y) / 2;
        let perpX = -(y - prevY) * params.curveAmount;
        let perpY = (x - prevX) * params.curveAmount;

        if (params.constrainToGrid) {
          // Use the same constraint logic as in drawPathSegment
          function wouldCurveGoOutside(cpx, cpy) {
            let steps = 10;
            for (let s = 0; s <= steps; s++) {
              let t = s / steps;
              let bx = bezierPoint(prevX, cpx, cpx, x, t);
              let by = bezierPoint(prevY, cpy, cpy, y, t);

              let halfWidth = cellWidth / 2;
              let halfHeight = cellHeight / 2;
              if (
                bx - halfWidth < 0 ||
                bx + halfWidth > params.gridSize ||
                by - halfHeight < 0 ||
                by + halfHeight > params.gridSize
              ) {
                return true;
              }
            }
            return false;
          }

          function findSafeCurveAmount(
            perpX,
            perpY,
            midX,
            midY,
            invert = false
          ) {
            let minAmount = 0;
            let maxAmount = 1;
            let iterations = 6;
            let safeAmount = params.curveAmount;

            for (let s = 0; s < iterations; s++) {
              let testAmount = (minAmount + maxAmount) / 2;
              let testX = midX + perpX * testAmount * (invert ? -1 : 1);
              let testY = midY + perpY * testAmount * (invert ? -1 : 1);

              if (wouldCurveGoOutside(testX, testY)) {
                maxAmount = testAmount;
              } else {
                minAmount = testAmount;
                safeAmount = testAmount;
              }
            }

            return safeAmount;
          }

          let standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
          let invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

          if (standardOutside && invertedOutside) {
            let safeAmount = findSafeCurveAmount(perpX, perpY, midX, midY);
            perpX *= safeAmount / params.curveAmount;
            perpY *= safeAmount / params.curveAmount;
          } else if (standardOutside) {
            perpX *= -1;
            perpY *= -1;
          }
        }

        // Draw a bezier curve segment
        bezierVertex(
          midX + perpX,
          midY + perpY,
          midX + perpX,
          midY + perpY,
          x,
          y
        );
      }

      // Close the loop if needed
      if (params.closedLoop) {
        let firstCell = pathCells[0];
        let lastCell = pathCells[pathCells.length - 1];
        let firstX = firstCell.j * cellWidth + cellWidth / 2;
        let firstY = firstCell.i * cellHeight + cellHeight / 2;
        let lastX = lastCell.j * cellWidth + cellWidth / 2;
        let lastY = lastCell.i * cellHeight + cellHeight / 2;

        let midX = (lastX + firstX) / 2;
        let midY = (lastY + firstY) / 2;
        let perpX = -(firstY - lastY) * params.curveAmount;
        let perpY = (firstX - lastX) * params.curveAmount;

        // Apply constraints to the closing segment if needed
        if (params.constrainToGrid) {
          // Reuse the same constraint functions defined above
          function wouldCurveGoOutside(cpx, cpy) {
            let steps = 10;
            for (let s = 0; s <= steps; s++) {
              let t = s / steps;
              let bx = bezierPoint(lastX, cpx, cpx, firstX, t);
              let by = bezierPoint(lastY, cpy, cpy, firstY, t);

              let halfWidth = cellWidth / 2;
              let halfHeight = cellHeight / 2;
              if (
                bx - halfWidth < 0 ||
                bx + halfWidth > params.gridSize ||
                by - halfHeight < 0 ||
                by + halfHeight > params.gridSize
              ) {
                return true;
              }
            }
            return false;
          }

          function findSafeCurveAmount(
            perpX,
            perpY,
            midX,
            midY,
            invert = false
          ) {
            let minAmount = 0;
            let maxAmount = 1;
            let iterations = 6;
            let safeAmount = params.curveAmount;

            for (let s = 0; s < iterations; s++) {
              let testAmount = (minAmount + maxAmount) / 2;
              let testX = midX + perpX * testAmount * (invert ? -1 : 1);
              let testY = midY + perpY * testAmount * (invert ? -1 : 1);

              if (wouldCurveGoOutside(testX, testY)) {
                maxAmount = testAmount;
              } else {
                minAmount = testAmount;
                safeAmount = testAmount;
              }
            }

            return safeAmount;
          }

          let standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
          let invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

          if (standardOutside && invertedOutside) {
            let safeAmount = findSafeCurveAmount(perpX, perpY, midX, midY);
            perpX *= safeAmount / params.curveAmount;
            perpY *= safeAmount / params.curveAmount;
          } else if (standardOutside) {
            perpX *= -1;
            perpY *= -1;
          }
        }

        bezierVertex(
          midX + perpX,
          midY + perpY,
          midX + perpX,
          midY + perpY,
          firstX,
          firstY
        );
      }

      endShape(params.closedLoop ? CLOSE : OPEN);
    } else if (params.pathType === "continuous") {
      // For continuous path, draw straight lines
      beginShape();

      for (let i = 0; i < pathCells.length; i++) {
        let currentCell = pathCells[i];
        let x = currentCell.j * cellWidth + cellWidth / 2;
        let y = currentCell.i * cellHeight + cellHeight / 2;
        vertex(x, y);
      }

      if (params.closedLoop) {
        endShape(CLOSE);
      } else {
        endShape();
      }
    } else {
      // For straight path, draw simple lines
      beginShape();

      for (let i = 0; i < pathCells.length; i++) {
        let currentCell = pathCells[i];
        let x = currentCell.j * cellWidth + cellWidth / 2;
        let y = currentCell.i * cellHeight + cellHeight / 2;
        vertex(x, y);
      }

      if (params.closedLoop) {
        endShape(CLOSE);
      } else {
        endShape();
      }
    }
  }

  // Reset filter if blur was applied
  if (params.pathBlur > 0) {
    drawingContext.filter = "none";
    pop();
  }
}

// New function to draw paths with rounded corners
function drawPathWithRoundedCorners(cellWidth, cellHeight) {
  if (pathCells.length < 2) return;

  // Calculate path points
  let points = pathCells.map((cell) => {
    return {
      x: cell.j * cellWidth + cellWidth / 2,
      y: cell.i * cellHeight + cellHeight / 2,
    };
  });

  // For closed loop, add first point again at the end
  if (params.closedLoop) {
    points.push({
      x: points[0].x,
      y: points[0].y,
    });
  }

  // Draw the path with rounded corners
  beginShape();

  // Start at the first point
  vertex(points[0].x, points[0].y);

  // For each middle point, create rounded corners
  for (let i = 1; i < points.length - 1; i++) {
    let p1 = points[i - 1]; // Previous point
    let p2 = points[i]; // Current point
    let p3 = points[i + 1]; // Next point

    // Calculate vectors
    let v1 = { x: p2.x - p1.x, y: p2.y - p1.y }; // Vector from previous to current
    let v2 = { x: p3.x - p2.x, y: p3.y - p2.y }; // Vector from current to next

    // Normalize vectors
    let len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    let len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (len1 === 0 || len2 === 0) {
      // Skip degenerate segments
      vertex(p2.x, p2.y);
      continue;
    }

    let n1 = { x: v1.x / len1, y: v1.y / len1 };
    let n2 = { x: v2.x / len2, y: v2.y / len2 };

    // Calculate corner radius (constrained by segment lengths)
    let radius = min(params.pathCornerRadius, len1 / 2, len2 / 2);

    // Calculate points before and after the corner
    let beforeCorner = {
      x: p2.x - n1.x * radius,
      y: p2.y - n1.y * radius,
    };

    let afterCorner = {
      x: p2.x + n2.x * radius,
      y: p2.y + n2.y * radius,
    };

    // Draw line to the point before corner
    vertex(beforeCorner.x, beforeCorner.y);

    // Draw quadratic curve for the corner
    quadraticVertex(p2.x, p2.y, afterCorner.x, afterCorner.y);
  }

  // End at the last point
  if (points.length > 1) {
    vertex(points[points.length - 1].x, points[points.length - 1].y);
  }

  endShape(params.closedLoop ? CLOSE : OPEN);
}

function drawRegularPath() {
  let numSegments = params.closedLoop ? pathCells.length : pathCells.length - 1;
  let totalLength = 0;

  // Calculate total path length
  for (let i = 0; i < numSegments; i++) {
    let currentCell = pathCells[i];
    let nextCell = pathCells[(i + 1) % pathCells.length];
    let cellWidth = params.gridSize / params.gridWidth;
    let cellHeight = params.gridSize / params.gridHeight;
    let x1 = currentCell.j * cellWidth + cellWidth / 2;
    let y1 = currentCell.i * cellHeight + cellHeight / 2;
    let x2 = nextCell.j * cellWidth + cellWidth / 2;
    let y2 = nextCell.i * cellHeight + cellHeight / 2;
    totalLength += dist(x1, y1, x2, y2);
  }

  let accumulatedLength = 0;
  for (let i = 0; i < numSegments; i++) {
    let currentCell = pathCells[i];
    let nextCell = pathCells[(i + 1) % pathCells.length];
    let cellWidth = params.gridSize / params.gridWidth;
    let cellHeight = params.gridSize / params.gridHeight;
    let x1 = currentCell.j * cellWidth + cellWidth / 2;
    let y1 = currentCell.i * cellHeight + cellHeight / 2;
    let x2 = nextCell.j * cellWidth + cellWidth / 2;
    let y2 = nextCell.i * cellHeight + cellHeight / 2;

    drawPathSegment(
      x1,
      y1,
      x2,
      y2,
      currentCell,
      i,
      numSegments,
      accumulatedLength,
      totalLength
    );
    accumulatedLength += dist(x1, y1, x2, y2);
  }
}

function drawBooleanUnionPath() {
  if (!polybool) {
    console.warn(
      'PolyBool library not loaded. Add <script src="https://cdn.jsdelivr.net/npm/polybooljs@1.2.0/dist/polybool.min.js"></script> to your HTML'
    );
    drawRegularPath();
    return;
  }

  // Enforce minimum spacing for boolean union operations
  if (params.pathShapeSpacing < 10) {
    params.pathShapeSpacing = 10;
    // Update GUI if available
    if (gui) {
      for (let controller of gui.__folders.Path.__controllers) {
        if (controller.property === "pathShapeSpacing") {
          controller.updateDisplay();
          break;
        }
      }
    }
  }

  let shapes = collectAllShapes();
  if (shapes.length === 0) return;

  // Filter out invalid shapes
  shapes = shapes.filter(
    (shape) => shape && shape.regions && shape.regions.length > 0
  );
  if (shapes.length === 0) return;

  let unionResult = shapes[0];
  for (let i = 1; i < shapes.length; i++) {
    try {
      // Only perform union if both polygons are valid
      if (isValidPolygon(unionResult) && isValidPolygon(shapes[i])) {
        unionResult = polybool.union(unionResult, shapes[i]);
      }
    } catch (e) {
      console.warn("Boolean operation failed:", e);
      break;
    }
  }

  // Draw the unified shape with gradient
  drawUnifiedShape(unionResult);
}

function isValidPolygon(polygon) {
  return (
    polygon &&
    polygon.regions &&
    polygon.regions.length > 0 &&
    polygon.regions[0] &&
    polygon.regions[0].length >= 3
  );
}

function collectAllShapes() {
  let shapes = [];
  let numSegments = params.closedLoop ? pathCells.length : pathCells.length - 1;
  let totalLength = 0;

  // Calculate total path length
  for (let i = 0; i < numSegments; i++) {
    let currentCell = pathCells[i];
    let nextCell = pathCells[(i + 1) % pathCells.length];
    let cellWidth = params.gridSize / params.gridWidth;
    let cellHeight = params.gridSize / params.gridHeight;
    let x1 = currentCell.j * cellWidth + cellWidth / 2;
    let y1 = currentCell.i * cellHeight + cellHeight / 2;
    let x2 = nextCell.j * cellWidth + cellWidth / 2;
    let y2 = nextCell.i * cellHeight + cellHeight / 2;
    totalLength += dist(x1, y1, x2, y2);
  }

  let accumulatedLength = 0;
  for (let i = 0; i < numSegments; i++) {
    let currentCell = pathCells[i];
    let nextCell = pathCells[(i + 1) % pathCells.length];
    let cellWidth = params.gridSize / params.gridWidth;
    let cellHeight = params.gridSize / params.gridHeight;
    let x1 = currentCell.j * cellWidth + cellWidth / 2;
    let y1 = currentCell.i * cellHeight + cellHeight / 2;
    let x2 = nextCell.j * cellWidth + cellWidth / 2;
    let y2 = nextCell.i * cellHeight + cellHeight / 2;

    let segmentShapes = collectShapesFromSegment(
      x1,
      y1,
      x2,
      y2,
      currentCell,
      i,
      numSegments,
      accumulatedLength,
      totalLength
    );
    shapes = shapes.concat(segmentShapes);
    accumulatedLength += dist(x1, y1, x2, y2);
  }

  return shapes;
}

function collectShapesFromSegment(
  x1,
  y1,
  x2,
  y2,
  currentCell,
  segmentIndex,
  totalSegments,
  accumulatedLength,
  totalLength
) {
  let shapes = [];
  let cellWidth = params.gridSize / params.gridWidth;
  let cellHeight = params.gridSize / params.gridHeight;

  if (params.alignShapesToGrid) {
    // Find all grid cells that the line segment intersects with
    let gridCells = getIntersectingGridCells(x1, y1, x2, y2);

    for (let cell of gridCells) {
      // Use cell center for position
      let cellCenterX = cell.j * cellWidth + cellWidth / 2;
      let cellCenterY = cell.i * cellHeight + cellHeight / 2;

      // Calculate progress along total path for color interpolation
      let distFromStart = dist(x1, y1, cellCenterX, cellCenterY);
      let segmentLength = dist(x1, y1, x2, y2);
      let localProgress = distFromStart / segmentLength;
      let currentLength = accumulatedLength + segmentLength * localProgress;
      let progress = currentLength / totalLength;

      let shape = createShapePolygon(
        cellCenterX,
        cellCenterY,
        cellWidth,
        cellHeight,
        currentCell,
        progress,
        totalSegments,
        segmentIndex,
        cell.i * params.gridWidth + cell.j // Use cell index as step index
      );
      if (shape) shapes.push(shape);
    }
  } else {
    // Original shape collection logic
    if (params.pathType === "curved") {
      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2;
      let perpX = -(y2 - y1) * params.curveAmount;
      let perpY = (x2 - x1) * params.curveAmount;

      // Fix for curved paths in boolean union mode
      // Use the exact same control points and curve calculations as in drawPathSegment
      if (params.constrainToGrid) {
        let standardOutside = false;
        let invertedOutside = false;

        // Define wouldCurveGoOutside locally to ensure consistent behavior with drawPathSegment
        function wouldCurveGoOutside(cpx, cpy) {
          let steps = 10;
          for (let i = 0; i <= steps; i++) {
            let t = i / steps;
            let x = bezierPoint(x1, cpx, cpx, x2, t);
            let y = bezierPoint(y1, cpy, cpy, y2, t);

            let halfWidth = cellWidth / 2;
            let halfHeight = cellHeight / 2;
            if (
              x - halfWidth < 0 ||
              x + halfWidth > params.gridSize ||
              y - halfHeight < 0 ||
              y + halfHeight > params.gridSize
            ) {
              return true;
            }
          }
          return false;
        }

        // Define findSafeCurveAmount locally to match drawPathSegment
        function findSafeCurveAmount(perpX, perpY, midX, midY, invert = false) {
          let minAmount = 0;
          let maxAmount = 1;
          let iterations = 6;
          let safeAmount = params.curveAmount;

          for (let i = 0; i < iterations; i++) {
            let testAmount = (minAmount + maxAmount) / 2;
            let testX = midX + perpX * testAmount * (invert ? -1 : 1);
            let testY = midY + perpY * testAmount * (invert ? -1 : 1);

            if (wouldCurveGoOutside(testX, testY)) {
              maxAmount = testAmount;
            } else {
              minAmount = testAmount;
              safeAmount = testAmount;
            }
          }

          return safeAmount;
        }

        standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
        invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

        if (standardOutside && invertedOutside) {
          let safeAmount = findSafeCurveAmount(perpX, perpY, midX, midY);
          perpX *= safeAmount / params.curveAmount;
          perpY *= safeAmount / params.curveAmount;
        } else if (standardOutside) {
          perpX *= -1;
          perpY *= -1;
        }
      }

      let steps = floor(dist(x1, y1, x2, y2) / params.pathShapeSpacing) * 2;
      steps = max(1, steps); // Ensure at least one step

      for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        let x = bezierPoint(x1, midX + perpX, midX + perpX, x2, t);
        let y = bezierPoint(y1, midY + perpY, midY + perpY, y2, t);
        let segmentLength = dist(x1, y1, x2, y2);
        let currentLength = accumulatedLength + segmentLength * t;
        let progress = currentLength / totalLength;

        // Apply position noise only to interpolated shapes (not at t=0 or t=1)
        if (i > 0 && i < steps) {
          let noiseOffset = getPositionNoise(x, y, segmentIndex, i);
          x += noiseOffset.x;
          y += noiseOffset.y;
        }

        // Create shape polygon for boolean union
        let shape = createShapePolygon(
          x,
          y,
          cellWidth,
          cellHeight,
          currentCell,
          progress,
          totalSegments,
          segmentIndex,
          i // Pass the step index
        );
        if (shape) shapes.push(shape);
      }
    } else if (params.pathType === "continuous") {
      let prevCell =
        pathCells[(segmentIndex - 1 + pathCells.length) % pathCells.length];
      let nextNextCell = pathCells[(segmentIndex + 2) % pathCells.length];
      let nextCell = pathCells[(segmentIndex + 1) % pathCells.length];

      // Calculate distance for number of shapes
      let distance = dist(x1, y1, x2, y2);
      let numShapes = floor(distance / params.pathShapeSpacing);
      numShapes = max(1, numShapes);

      for (let i = 0; i <= numShapes; i++) {
        let t = i / numShapes;
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);

        // Apply position noise
        if (i > 0 && i < numShapes) {
          let noiseOffset = getPositionNoise(x, y, segmentIndex, i);
          x += noiseOffset.x;
          y += noiseOffset.y;
        }

        let currentLength = accumulatedLength + distance * t;
        let progress = currentLength / totalLength;

        // Create shape polygon for boolean union
        let shape = createShapePolygon(
          x,
          y,
          cellWidth,
          cellHeight,
          currentCell,
          progress,
          totalSegments,
          segmentIndex,
          i // Pass the step index
        );
        if (shape) shapes.push(shape);
      }
    } else {
      // Straight path
      let distance = dist(x1, y1, x2, y2);
      let numShapes = floor(distance / params.pathShapeSpacing);
      numShapes = max(1, numShapes); // Ensure at least one step

      for (let i = 0; i <= numShapes; i++) {
        let t = i / numShapes;
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);
        let currentLength = accumulatedLength + distance * t;
        let progress = currentLength / totalLength;

        // Apply position noise only to interpolated shapes (not at t=0 or t=1)
        if (i > 0 && i < numShapes) {
          let noiseOffset = getPositionNoise(x, y, segmentIndex, i);
          x += noiseOffset.x;
          y += noiseOffset.y;
        }

        // Create shape polygon for boolean union
        let shape = createShapePolygon(
          x,
          y,
          cellWidth,
          cellHeight,
          currentCell,
          progress,
          totalSegments,
          segmentIndex,
          i // Pass the step index
        );
        if (shape) shapes.push(shape);
      }
    }
  }

  return shapes;
}

function drawPathSegment(
  x1,
  y1,
  x2,
  y2,
  currentCell,
  segmentIndex,
  totalSegments,
  accumulatedLength,
  totalLength
) {
  let cellWidth = params.gridSize / params.gridWidth;
  let cellHeight = params.gridSize / params.gridHeight;

  function wouldCurveGoOutside(cpx, cpy) {
    let steps = 10;
    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let x = bezierPoint(x1, cpx, cpx, x2, t);
      let y = bezierPoint(y1, cpy, cpy, y2, t);

      let halfWidth = cellWidth / 2;
      let halfHeight = cellHeight / 2;
      if (
        x - halfWidth < 0 ||
        x + halfWidth > params.gridSize ||
        y - halfHeight < 0 ||
        y + halfHeight > params.gridSize
      ) {
        return true;
      }
    }
    return false;
  }

  function findSafeCurveAmount(perpX, perpY, midX, midY, invert = false) {
    let minAmount = 0;
    let maxAmount = 1;
    let iterations = 6;
    let safeAmount = params.curveAmount;

    for (let i = 0; i < iterations; i++) {
      let testAmount = (minAmount + maxAmount) / 2;
      let testX = midX + perpX * testAmount * (invert ? -1 : 1);
      let testY = midY + perpY * testAmount * (invert ? -1 : 1);

      if (wouldCurveGoOutside(testX, testY)) {
        maxAmount = testAmount;
      } else {
        minAmount = testAmount;
        safeAmount = testAmount;
      }
    }

    return safeAmount;
  }

  if (params.pathType === "curved") {
    let midX = (x1 + x2) / 2;
    let midY = (y1 + y2) / 2;
    let perpX = -(y2 - y1) * params.curveAmount;
    let perpY = (x2 - x1) * params.curveAmount;

    if (params.constrainToGrid) {
      let standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
      let invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

      if (standardOutside && invertedOutside) {
        let safeAmount = findSafeCurveAmount(perpX, perpY, midX, midY);
        perpX *= safeAmount / params.curveAmount;
        perpY *= safeAmount / params.curveAmount;
      } else if (standardOutside) {
        perpX *= -1;
        perpY *= -1;
      }
    }

    let steps = floor(dist(x1, y1, x2, y2) / params.pathShapeSpacing) * 2;
    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let x = bezierPoint(x1, midX + perpX, midX + perpX, x2, t);
      let y = bezierPoint(y1, midY + perpY, midY + perpY, y2, t);
      let segmentLength = dist(x1, y1, x2, y2);
      let currentLength = accumulatedLength + segmentLength * t;
      let progress = currentLength / totalLength;

      // Apply position noise only to interpolated shapes (not at t=0 or t=1)
      if (i > 0 && i < steps) {
        let noiseOffset = getPositionNoise(x, y, segmentIndex, i);
        x += noiseOffset.x;
        y += noiseOffset.y;
      }

      drawShapeAtPosition(
        x,
        y,
        cellWidth,
        cellHeight,
        currentCell,
        progress,
        totalSegments,
        segmentIndex,
        i // Pass the step index
      );
    }
  } else if (params.pathType === "continuous") {
    let prevCell =
      pathCells[(segmentIndex - 1 + pathCells.length) % pathCells.length];
    let nextNextCell = pathCells[(segmentIndex + 2) % pathCells.length];

    // Calculate control points for a smooth continuous curve
    let dx = nextCell.j - prevCell.j;
    let dy = nextCell.i - prevCell.i;

    // Calculate distance for number of shapes
    let distance = dist(x1, y1, x2, y2);
    let numShapes = floor(distance / params.pathShapeSpacing);
    numShapes = max(1, numShapes);

    for (let i = 0; i <= numShapes; i++) {
      let t = i / numShapes;
      let x = lerp(x1, x2, t);
      let y = lerp(y1, y2, t);

      // Apply position noise
      if (i > 0 && i < numShapes) {
        let noiseOffset = getPositionNoise(x, y, segmentIndex, i);
        x += noiseOffset.x;
        y += noiseOffset.y;
      }

      let currentLength = accumulatedLength + distance * t;
      let progress = currentLength / totalLength;

      drawShapeAtPosition(
        x,
        y,
        cellWidth,
        cellHeight,
        currentCell,
        progress,
        totalSegments,
        segmentIndex,
        i // Pass the step index
      );
    }
  } else {
    // Straight path
    let distance = dist(x1, y1, x2, y2);
    let numShapes = floor(distance / params.pathShapeSpacing);
    numShapes = max(1, numShapes); // Ensure at least one step

    for (let i = 0; i <= numShapes; i++) {
      let t = i / numShapes;
      let x = lerp(x1, x2, t);
      let y = lerp(y1, y2, t);
      let currentLength = accumulatedLength + distance * t;
      let progress = currentLength / totalLength;

      // Apply position noise only to interpolated shapes (not at t=0 or t=1)
      if (i > 0 && i < numShapes) {
        let noiseOffset = getPositionNoise(x, y, segmentIndex, i);
        x += noiseOffset.x;
        y += noiseOffset.y;
      }

      drawShapeAtPosition(
        x,
        y,
        cellWidth,
        cellHeight,
        currentCell,
        progress,
        totalSegments,
        segmentIndex,
        i // Pass the step index
      );
    }
  }

  if (params.alignShapesToGrid) {
    // Find all grid cells that the line segment intersects with
    let gridCells = getIntersectingGridCells(x1, y1, x2, y2);

    for (let cell of gridCells) {
      // Use cell center for position
      let cellCenterX = cell.j * cellWidth + cellWidth / 2;
      let cellCenterY = cell.i * cellHeight + cellHeight / 2;

      // Calculate progress along total path for color interpolation
      let distFromStart = dist(x1, y1, cellCenterX, cellCenterY);
      let segmentLength = dist(x1, y1, x2, y2);
      let localProgress = distFromStart / segmentLength;
      let currentLength = accumulatedLength + segmentLength * localProgress;
      let progress = currentLength / totalLength;

      drawShapeAtPosition(
        cellCenterX,
        cellCenterY,
        cellWidth,
        cellHeight,
        currentCell,
        progress,
        totalSegments,
        segmentIndex,
        cell.i * params.gridWidth + cell.j // Use cell index as step index
      );
    }
  }
}

function getIntersectingGridCells(x1, y1, x2, y2) {
  let cellWidth = params.gridSize / params.gridWidth;
  let cellHeight = params.gridSize / params.gridHeight;
  let cells = [];

  // Use Bresenham's line algorithm to find cells that the line passes through
  // This is a simplified version for grid traversal
  let startCellI = Math.floor(y1 / cellHeight);
  let startCellJ = Math.floor(x1 / cellWidth);
  let endCellI = Math.floor(y2 / cellHeight);
  let endCellJ = Math.floor(x2 / cellWidth);

  // Clamp to grid bounds
  startCellI = constrain(startCellI, 0, params.gridHeight - 1);
  startCellJ = constrain(startCellJ, 0, params.gridWidth - 1);
  endCellI = constrain(endCellI, 0, params.gridHeight - 1);
  endCellJ = constrain(endCellJ, 0, params.gridWidth - 1);

  // Add start cell
  cells.push({ i: startCellI, j: startCellJ });

  // If start and end are the same, just return the one cell
  if (startCellI === endCellI && startCellJ === endCellJ) {
    return cells;
  }

  // Calculate deltas and step directions
  let dx = Math.abs(endCellJ - startCellJ);
  let dy = Math.abs(endCellI - startCellI);
  let sx = startCellJ < endCellJ ? 1 : -1;
  let sy = startCellI < endCellI ? 1 : -1;
  let err = dx - dy;

  let currentI = startCellI;
  let currentJ = startCellJ;

  // Maximum number of steps to prevent infinite loops
  let maxSteps = params.gridWidth * params.gridHeight;
  let steps = 0;

  // Traverse the grid following the line
  while ((currentI !== endCellI || currentJ !== endCellJ) && steps < maxSteps) {
    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currentJ += sx;
    }
    if (e2 < dx) {
      err += dx;
      currentI += sy;
    }

    // Add the current cell if it's within grid bounds
    if (
      currentI >= 0 &&
      currentI < params.gridHeight &&
      currentJ >= 0 &&
      currentJ < params.gridWidth
    ) {
      cells.push({ i: currentI, j: currentJ });
    }

    steps++;
  }

  return cells;
}

function createShapePolygon(
  x,
  y,
  width,
  height,
  cell,
  progress,
  totalSegments,
  segmentIndex = 0,
  stepIndex = 0
) {
  let scale = params.shapeSize;

  // Apply size noise - this is the missing part for boolean union shapes
  let sizeNoiseFactor = getSizeNoise(segmentIndex, stepIndex);
  scale *= sizeNoiseFactor;

  let scaledWidth = width * scale;
  let scaledHeight = height * scale;
  let halfWidth = scaledWidth / 2;
  let halfHeight = scaledHeight / 2;

  // Ensure minimum size to avoid degenerate polygons
  if (halfWidth < 0.1 || halfHeight < 0.1) {
    return null;
  }

  if (params.shapeType === "rectangle") {
    // Create rectangle with proper winding order (counter-clockwise)
    let points = [
      [x - halfWidth, y - halfHeight],
      [x + halfWidth, y - halfHeight],
      [x + halfWidth, y + halfHeight],
      [x - halfWidth, y + halfHeight],
    ];

    return {
      regions: [points],
      inverted: false,
    };
  } else {
    // Create ellipse as polygon approximation with configurable resolution
    let points = [];
    let numPoints = params.ellipseResolution;

    // Ensure minimum resolution
    numPoints = Math.max(8, numPoints);

    for (let i = 0; i < numPoints; i++) {
      let angle = (i / numPoints) * TWO_PI;
      let px = x + cos(angle) * halfWidth;
      let py = y + sin(angle) * halfHeight;
      points.push([px, py]);
    }

    // Verify we have enough points for a valid polygon
    if (points.length < 3) {
      return null;
    }

    return {
      regions: [points],
      inverted: false,
    };
  }
}

function drawUnifiedShape(unionResult) {
  if (!unionResult || !unionResult.regions || unionResult.regions.length === 0)
    return;

  // Filter out degenerate regions (less than 3 points)
  let validRegions = unionResult.regions.filter(
    (region) => region && region.length >= 3
  );
  if (validRegions.length === 0) return;

  // Get bounds for consistency between stroke and fill
  let bounds = getUnionBounds({ regions: validRegions });

  // Apply full shape blur if enabled
  if (params.shapeBlur > 0) {
    if (params.insideBlur) {
      // Inside-only blur with mask for boolean union shapes
      let bounds = getUnionBounds({ regions: validRegions });
      let bufferSize = max(bounds.width, bounds.height) * 1.5;
      let offsetX = (bufferSize - bounds.width) / 2;
      let offsetY = (bufferSize - bounds.height) / 2;

      // Create buffer for blurred shape
      let shapeBuffer = createGraphics(bufferSize, bufferSize);
      shapeBuffer.translate(-bounds.minX + offsetX, -bounds.minY + offsetY);

      // Apply blur filter
      shapeBuffer.drawingContext.filter = `blur(${params.shapeBlur}px)`;

      // Set appearance and draw shape in buffer
      if (params.showPathShapeStroke) {
        shapeBuffer.stroke(params.shapeStrokeColor);
        shapeBuffer.strokeWeight(params.pathShapeStrokeWeight);
      } else {
        shapeBuffer.noStroke();
      }

      // Handle fill
      if (!params.showFill) {
        shapeBuffer.noFill();
      } else {
        // Apply solid fill (will handle gradient later)
        let fillColor = color(params.shapeFillColor);
        fillColor.setAlpha(params.shapeAlpha * 255);
        shapeBuffer.fill(fillColor);
      }

      // Draw all regions into buffer WITH corner radius
      for (let region of validRegions) {
        if (params.shapeCornerRadius > 0 && params.shapeType === "rectangle") {
          // Draw with rounded corners using custom function
          drawRoundedPolygon(shapeBuffer, region, params.shapeCornerRadius);
        } else {
          // Standard polygon drawing
          shapeBuffer.beginShape();
          for (let point of region) {
            if (
              Array.isArray(point) &&
              point.length >= 2 &&
              typeof point[0] === "number" &&
              typeof point[1] === "number" &&
              !isNaN(point[0]) &&
              !isNaN(point[1])
            ) {
              shapeBuffer.vertex(point[0], point[1]);
            }
          }
          shapeBuffer.endShape(CLOSE);
        }
      }

      // Create mask buffer
      let maskBuffer = createGraphics(bufferSize, bufferSize);
      maskBuffer.translate(-bounds.minX + offsetX, -bounds.minY + offsetY);
      maskBuffer.noStroke();
      maskBuffer.fill(255); // White for mask

      // Draw all regions into mask WITH THE SAME corner radius
      for (let region of validRegions) {
        if (params.shapeCornerRadius > 0 && params.shapeType === "rectangle") {
          // Draw with rounded corners using the same custom function
          drawRoundedPolygon(maskBuffer, region, params.shapeCornerRadius);
        } else {
          // Standard polygon drawing
          maskBuffer.beginShape();
          for (let point of region) {
            if (
              Array.isArray(point) &&
              point.length >= 2 &&
              typeof point[0] === "number" &&
              typeof point[1] === "number" &&
              !isNaN(point[0]) &&
              !isNaN(point[1])
            ) {
              maskBuffer.vertex(point[0], point[1]);
            }
          }
          maskBuffer.endShape(CLOSE);
        }
      }

      // Convert Graphics objects to Images for masking
      let shapeImg = createImage(bufferSize, bufferSize);
      shapeImg.copy(
        shapeBuffer,
        0,
        0,
        bufferSize,
        bufferSize,
        0,
        0,
        bufferSize,
        bufferSize
      );

      let maskImg = createImage(bufferSize, bufferSize);
      maskImg.copy(
        maskBuffer,
        0,
        0,
        bufferSize,
        bufferSize,
        0,
        0,
        bufferSize,
        bufferSize
      );

      // Apply the mask
      shapeImg.mask(maskImg);

      // Draw the masked image
      image(shapeImg, bounds.minX - offsetX, bounds.minY - offsetY);

      // Clean up
      shapeBuffer.remove();
      maskBuffer.remove();
      return;
    } else {
      // Original full blur code
      push();
      drawingContext.filter = `blur(${params.shapeBlur}px)`;

      // Set up appearance
      if (params.showPathShapeStroke) {
        stroke(params.shapeStrokeColor);
        strokeWeight(params.pathShapeStrokeWeight);
      } else {
        noStroke();
      }

      // Handle fill based on showFill
      if (!params.showFill) {
        noFill();
        // If neither stroke nor fill, exit early
        if (!params.showPathShapeStroke) {
          pop();
          return;
        }
      } else {
        // Apply gradient or solid fill
        if (params.gradientType === "none") {
          let fillColor = color(params.shapeFillColor);
          fillColor.setAlpha(params.shapeAlpha * 255);
          fill(fillColor);
        } else if (params.gradientType === "length") {
          // For boolean union, use middle color for length gradient
          let fillColor;
          if (params.gradientColors === "2") {
            fillColor = lerpColor(
              color(params.shapeFillColor),
              color(params.shapeFillColor2),
              0.5
            );
          } else {
            fillColor = color(params.shapeFillColor2); // Use middle color
          }
          fillColor.setAlpha(params.shapeAlpha * 255);
          fill(fillColor);
        } else {
          // Use gradient with canvas context
          let ctx = drawingContext;
          let gradient = createGradientForBounds(ctx, bounds);
          ctx.save();
          ctx.fillStyle = gradient;
          drawUnionWithContext(ctx, { regions: validRegions });
          ctx.restore();
          pop(); // End the push from shape blur
          return;
        }
      }

      // Draw all regions with p5.js
      for (let region of validRegions) {
        beginShape();
        for (let point of region) {
          if (
            Array.isArray(point) &&
            point.length >= 2 &&
            typeof point[0] === "number" &&
            typeof point[1] === "number" &&
            !isNaN(point[0]) &&
            !isNaN(point[1])
          ) {
            vertex(point[0], point[1]);
          }
        }
        endShape(CLOSE);
      }

      drawingContext.filter = "none";
      pop();
      return;
    }
  }

  // Apply stroke without blur (removed blur code)
  if (params.showPathShapeStroke) {
    // Normal stroke without blur
    stroke(params.shapeStrokeColor);
    strokeWeight(params.pathShapeStrokeWeight);
  } else {
    noStroke();
  }

  // Handle fill based on the showFill toggle
  if (!params.showFill) {
    noFill();

    // If no stroke and no fill, exit early
    if (!params.showPathShapeStroke) {
      return;
    }
  } else {
    // Apply gradient or solid color based on gradient type
    if (params.gradientType === "none") {
      let fillColor = color(params.shapeFillColor);
      fillColor.setAlpha(params.shapeAlpha * 255);
      fill(fillColor);
    } else if (params.gradientType === "length") {
      // For boolean union, use middle color for length gradient
      let fillColor;
      if (params.gradientColors === "2") {
        fillColor = lerpColor(
          color(params.shapeFillColor),
          color(params.shapeFillColor2),
          0.5
        );
      } else {
        fillColor = color(params.shapeFillColor2); // Use middle color
      }
      fillColor.setAlpha(params.shapeAlpha * 255);
      fill(fillColor);
    } else {
      // Use gradient with canvas context
      let ctx = drawingContext;
      let gradient = createGradientForBounds(ctx, bounds);

      ctx.save();
      ctx.fillStyle = gradient;
      drawUnionWithContext(ctx, { regions: validRegions });
      ctx.restore();
      return;
    }
  }

  // Draw with p5.js fill - only valid regions
  for (let region of validRegions) {
    beginShape();
    for (let point of region) {
      // Validate point coordinates
      if (
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === "number" &&
        typeof point[1] === "number" &&
        !isNaN(point[0]) &&
        !isNaN(point[1])
      ) {
        vertex(point[0], point[1]);
      }
    }
    endShape(CLOSE);
  }
}

function getUnionBounds(unionResult) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (let region of unionResult.regions) {
    for (let point of region) {
      minX = min(minX, point[0]);
      minY = min(minY, point[1]);
      maxX = max(maxX, point[0]);
      maxY = max(maxY, point[1]);
    }
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function createGradientForBounds(ctx, bounds) {
  let gradient;
  switch (params.gradientType) {
    case "horizontal":
      gradient = ctx.createLinearGradient(bounds.minX, 0, bounds.maxX, 0);
      break;
    case "vertical":
      gradient = ctx.createLinearGradient(0, bounds.minY, 0, bounds.maxY);
      break;
    case "diagonal":
      gradient = ctx.createLinearGradient(
        bounds.minX,
        bounds.minY,
        bounds.maxX,
        bounds.maxY
      );
      break;
    case "radial":
      let centerX = bounds.minX + bounds.width / 2;
      let centerY = bounds.minY + bounds.height / 2;
      gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        max(bounds.width, bounds.height) / 2
      );
      break;
    case "conic":
      let cCenterX = bounds.minX + bounds.width / 2;
      let cCenterY = bounds.minY + bounds.height / 2;
      gradient = ctx.createConicGradient(-PI / 2, cCenterX, cCenterY);
      break;
  }

  // Create colors with proper alpha value
  let c1 = color(params.shapeFillColor);
  let c2 = color(params.shapeFillColor2);
  let c3 = color(params.shapeFillColor3);

  // Apply alpha to all colors
  c1.setAlpha(params.shapeAlpha * 255);
  c2.setAlpha(params.shapeAlpha * 255);
  c3.setAlpha(params.shapeAlpha * 255);

  // Add color stops with rgba format to preserve transparency
  if (params.gradientColors === "2") {
    gradient.addColorStop(
      0,
      `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${params.shapeAlpha})`
    );
    gradient.addColorStop(
      1,
      `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${params.shapeAlpha})`
    );
  } else {
    gradient.addColorStop(
      0,
      `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${params.shapeAlpha})`
    );
    gradient.addColorStop(
      0.5,
      `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${params.shapeAlpha})`
    );
    gradient.addColorStop(
      1,
      `rgba(${red(c3)}, ${green(c3)}, ${blue(c3)}, ${params.shapeAlpha})`
    );
  }

  return gradient;
}

// Update drawUnionWithContext to fix the right corner issue
function drawUnionWithContext(ctx, unionResult, strokeOnly = false) {
  for (let region of unionResult.regions) {
    if (!region || region.length < 3) continue;

    ctx.beginPath();

    // For rounded corners in polygon regions
    if (params.shapeCornerRadius > 0 && params.shapeType === "rectangle") {
      // Get points for this region
      let points = region.filter(
        (point) =>
          Array.isArray(point) &&
          point.length >= 2 &&
          typeof point[0] === "number" &&
          typeof point[1] === "number" &&
          !isNaN(point[0]) &&
          !isNaN(point[1])
      );

      if (points.length < 3) continue;

      // First analyze the polygon to determine a safe corner radius
      let minEdgeLength = Infinity;
      for (let i = 0; i < points.length; i++) {
        let p1 = points[i];
        let p2 = points[(i + 1) % points.length];
        let edgeLength = Math.sqrt(
          Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
        );
        minEdgeLength = Math.min(minEdgeLength, edgeLength);
      }

      // Limit the radius to prevent overlap on short edges
      let maxRadius = Math.min(params.shapeCornerRadius, minEdgeLength * 0.4);

      // Start path at a reasonable position
      let startPoint = points[0];
      let endPoint = points[1];
      let startVector = [
        endPoint[0] - startPoint[0],
        endPoint[1] - startPoint[1],
      ];
      let startDist = Math.sqrt(
        startVector[0] * startVector[0] + startVector[1] * startVector[1]
      );
      let unitStartVector = [
        startVector[0] / startDist,
        startVector[1] / startDist,
      ];

      ctx.moveTo(
        startPoint[0] + unitStartVector[0] * maxRadius,
        startPoint[1] + unitStartVector[1] * maxRadius
      );

      // Draw each segment with rounded corners
      for (let i = 1; i < points.length; i++) {
        let p0 = points[i - 1];
        let p1 = points[i];
        let p2 = points[(i + 1) % points.length];

        // Calculate vectors
        let v1 = [p1[0] - p0[0], p1[1] - p0[1]];
        let v2 = [p2[0] - p1[0], p2[1] - p1[1]];

        // Calculate lengths
        let len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        let len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

        let unitV1 = [v1[0] / len1, v1[1] / len1];
        let unitV2 = [v2[0] / len2, v2[1] / len2];

        // Draw line to the point before the corner
        let beforeCorner = [
          p1[0] - unitV1[0] * maxRadius,
          p1[1] - unitV1[1] * maxRadius,
        ];

        // Calculate the point after the corner
        let afterCorner = [
          p1[0] + unitV2[0] * maxRadius,
          p1[1] + unitV2[1] * maxRadius,
        ];

        // Draw the actual corner with a quadratic curve
        ctx.quadraticCurveTo(p1[0], p1[1], afterCorner[0], afterCorner[1]);
      }

      // Connect back to the start with rounded corner
      let lastPoint = points[points.length - 1];
      let firstPoint = points[0];
      let secondPoint = points[1];

      let lastVector = [
        firstPoint[0] - lastPoint[0],
        firstPoint[1] - lastPoint[1],
      ];
      let nextVector = [
        secondPoint[0] - firstPoint[0],
        secondPoint[1] - firstPoint[1],
      ];

      let lastLen = Math.sqrt(
        lastVector[0] * lastVector[0] + lastVector[1] * lastVector[1]
      );
      let nextLen = Math.sqrt(
        nextVector[0] * nextVector[0] + nextVector[1] * nextVector[1]
      );

      let unitLast = [lastVector[0] / lastLen, lastVector[1] / lastLen];
      let unitNext = [nextVector[0] / nextLen, nextVector[1] / nextLen];

      // Draw line to the point before the first corner
      let beforeFirst = [
        firstPoint[0] - unitLast[0] * maxRadius,
        firstPoint[1] - unitLast[1] * maxRadius,
      ];
      ctx.lineTo(beforeFirst[0], beforeFirst[1]);

      // Draw the rounded corner to close the path
      let afterFirst = [
        firstPoint[0] + unitNext[0] * maxRadius,
        firstPoint[1] + unitNext[1] * maxRadius,
      ];
      ctx.quadraticCurveTo(
        firstPoint[0],
        firstPoint[1],
        afterFirst[0],
        afterFirst[1]
      );
    } else {
      // Standard polygon drawing without rounded corners
      if (
        Array.isArray(region[0]) &&
        region[0].length >= 2 &&
        typeof region[0][0] === "number" &&
        typeof region[0][1] === "number" &&
        !isNaN(region[0][0]) &&
        !isNaN(region[0][1])
      ) {
        ctx.moveTo(region[0][0], region[0][1]);

        for (let i = 1; i < region.length; i++) {
          if (
            Array.isArray(region[i]) &&
            region[i].length >= 2 &&
            typeof region[i][0] === "number" &&
            typeof region[i][1] === "number" &&
            !isNaN(region[i][0]) &&
            !isNaN(region[i][1])
          ) {
            ctx.lineTo(region[i][0], region[i][1]);
          }
        }
      }
    }

    ctx.closePath();

    // Handle different drawing modes
    if (strokeOnly) {
      ctx.stroke();
    } else if (!params.showPathShapeStroke || params.strokeBlur > 0) {
      // Fill only (if stroke is off or stroke has blur applied separately)
      ctx.fill();
    } else {
      // Both fill and stroke
      ctx.fill();
      ctx.stroke();
    }
  }
}

// Fix the drawRoundedPolygon function - remove the incorrect code
function drawRoundedPolygon(buffer, points, cornerRadius) {
  if (!points || points.length < 3) return;

  // First analyze the polygon to determine a safe corner radius
  let minEdgeLength = Infinity;
  for (let i = 0; i < points.length; i++) {
    let p1 = points[i];
    let p2 = points[(i + 1) % points.length];
    if (!p1 || !p2 || !Array.isArray(p1) || !Array.isArray(p2)) continue;

    let edgeLength = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
    );
    minEdgeLength = Math.min(minEdgeLength, edgeLength);
  }

  // Limit the radius to prevent overlap on short edges
  let maxRadius = Math.min(cornerRadius, minEdgeLength * 0.4);

  buffer.beginShape();

  for (let i = 0; i < points.length; i++) {
    let p0 = points[(i - 1 + points.length) % points.length];
    let p1 = points[i];
    let p2 = points[(i + 1) % points.length];

    if (
      !p0 ||
      !p1 ||
      !p2 ||
      !Array.isArray(p0) ||
      !Array.isArray(p1) ||
      !Array.isArray(p2)
    ) {
      continue;
    }

    // Calculate vectors for this corner
    let v1 = [p1[0] - p0[0], p1[1] - p0[1]];
    let v2 = [p2[0] - p1[0], p2[1] - p1[1]];

    // Calculate lengths
    let len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    let len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

    if (len1 === 0 || len2 === 0) {
      buffer.vertex(p1[0], p1[1]);
      continue;
    }

    // Calculate unit vectors (normalized)
    let unitV1 = [v1[0] / len1, v1[1] / len1];
    let unitV2 = [v2[0] / len2, v2[1] / len2];

    // Calculate points before and after the corner
    let beforeCorner = [
      p1[0] - unitV1[0] * maxRadius,
      p1[1] - unitV1[1] * maxRadius,
    ];

    let afterCorner = [
      p1[0] + unitV2[0] * maxRadius,
      p1[1] + unitV2[1] * maxRadius,
    ];

    // Draw line to point before corner
    buffer.vertex(beforeCorner[0], beforeCorner[1]);

    // Draw quadratic curve for corner
    buffer.quadraticVertex(p1[0], p1[1], afterCorner[0], afterCorner[1]);
  }

  buffer.endShape(CLOSE);
}

function drawShapeAtPosition(
  x,
  y,
  width,
  height,
  cell,
  progress,
  totalSegments,
  segmentIndex = 0,
  stepIndex = 0
) {
  let scale = params.shapeSize;

  // Apply size noise
  let sizeNoiseFactor = getSizeNoise(segmentIndex, stepIndex);
  scale *= sizeNoiseFactor;

  let scaledWidth = width * scale;
  let scaledHeight = height * scale;

  // Apply shape blur if needed
  if (params.shapeBlur > 0) {
    // Inside-only blur with mask
    if (params.insideBlur) {
      // Create graphics buffer for blurred shape
      let shapeBuffer = createGraphics(scaledWidth * 1.5, scaledHeight * 1.5);
      shapeBuffer.translate(scaledWidth * 0.25, scaledHeight * 0.25);

      // Draw the blurred shape on the buffer
      shapeBuffer.drawingContext.filter = `blur(${params.shapeBlur}px)`;
      if (params.showPathShapeStroke) {
        shapeBuffer.stroke(params.shapeStrokeColor);
        shapeBuffer.strokeWeight(params.pathShapeStrokeWeight);
      } else {
        shapeBuffer.noStroke();
      }

      // Set fill based on showFill parameter
      if (params.showFill) {
        // Apply gradient or solid color
        if (params.gradientType === "none") {
          let fillColor = color(params.shapeFillColor);
          fillColor.setAlpha(params.shapeAlpha * 255);
          shapeBuffer.fill(fillColor);
        } else if (params.gradientType === "length" && progress !== null) {
          let fillColor;
          if (params.gradientColors === "2") {
            fillColor = lerpColor(
              color(params.shapeFillColor),
              color(params.shapeFillColor2),
              progress
            );
          } else {
            fillColor =
              progress < 0.5
                ? lerpColor(colors[0], colors[1], progress * 2)
                : lerpColor(colors[1], colors[2], (progress - 0.5) * 2);
          }
          fillColor.setAlpha(params.shapeAlpha * 255);
          shapeBuffer.fill(fillColor);
        } else {
          // For complex gradients, use a solid color here and apply gradient later
          let fillColor = color(params.shapeFillColor);
          fillColor.setAlpha(params.shapeAlpha * 255);
          shapeBuffer.fill(fillColor);
        }
      } else {
        shapeBuffer.noFill();
      }

      // Draw the shape
      if (params.shapeType === "rectangle") {
        if (params.shapeCornerRadius > 0) {
          let radius = min(
            params.shapeCornerRadius,
            scaledWidth / 2,
            scaledHeight / 2
          );
          shapeBuffer.rect(0, 0, scaledWidth, scaledHeight, radius);
        } else {
          shapeBuffer.rect(0, 0, scaledWidth, scaledHeight);
        }
      } else if (params.shapeType === "ellipse") {
        shapeBuffer.ellipse(
          scaledWidth / 2,
          scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      }

      // Create mask buffer with shape outline
      let maskBuffer = createGraphics(scaledWidth * 1.5, scaledHeight * 1.5);
      maskBuffer.translate(scaledWidth * 0.25, scaledHeight * 0.25);
      maskBuffer.noStroke();
      maskBuffer.fill(255); // White for mask

      // Draw the shape mask
      if (params.shapeType === "rectangle") {
        if (params.shapeCornerRadius > 0) {
          let radius = min(
            params.shapeCornerRadius,
            scaledWidth / 2,
            scaledHeight / 2
          );
          maskBuffer.rect(0, 0, scaledWidth, scaledHeight, radius);
        } else {
          maskBuffer.rect(0, 0, scaledWidth, scaledHeight);
        }
      } else if (params.shapeType === "ellipse") {
        maskBuffer.ellipse(
          scaledWidth / 2,
          scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      }

      // Convert Graphics objects to Images for masking
      let shapeImg = createImage(scaledWidth * 1.5, scaledHeight * 1.5);
      shapeImg.copy(
        shapeBuffer,
        0,
        0,
        scaledWidth * 1.5,
        scaledHeight * 1.5,
        0,
        0,
        scaledWidth * 1.5,
        scaledHeight * 1.5
      );

      let maskImg = createImage(scaledWidth * 1.5, scaledHeight * 1.5);
      maskImg.copy(
        maskBuffer,
        0,
        0,
        scaledWidth * 1.5,
        scaledHeight * 1.5,
        0,
        0,
        scaledWidth * 1.5,
        scaledHeight * 1.5
      );

      // Apply the mask
      shapeImg.mask(maskImg);

      // Draw the masked image
      image(shapeImg, -scaledWidth * 0.25, -scaledHeight * 0.25);

      // Apply gradient if needed
      if (
        params.showFill &&
        params.gradientType !== "none" &&
        params.gradientType !== "length"
      ) {
        // Apply gradient using source-atop to only show within the shape
        let ctx = drawingContext;
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";

        translate(0, 0);
        let gradient = createGradient(ctx, scaledWidth, scaledHeight);
        ctx.fillStyle = gradient;

        if (params.shapeType === "rectangle") {
          if (params.shapeCornerRadius > 0) {
            let radius = min(
              params.shapeCornerRadius,
              scaledWidth / 2,
              scaledHeight / 2
            );
            ctx.beginPath();
            roundedRect(ctx, 0, 0, scaledWidth, scaledHeight, radius);
          } else {
            ctx.fillRect(0, 0, scaledWidth, scaledHeight);
          }
        } else if (params.shapeType === "ellipse") {
          ctx.beginPath();
          ctx.ellipse(
            scaledWidth / 2,
            scaledHeight / 2,
            scaledWidth / 2,
            scaledHeight / 2,
            0,
            0,
            TWO_PI
          );
          ctx.fill();
        }

        ctx.restore();
      }

      // Clean up
      shapeBuffer.remove();
      maskBuffer.remove();
    } else {
      // Standard blur (both inside and outside)
      push();
      drawingContext.filter = `blur(${params.shapeBlur}px)`;
      translate(x - scaledWidth / 2, y - scaledHeight / 2);
      drawShapeWithGradient(0, 0, scaledWidth, scaledHeight, progress);
      drawingContext.filter = "none";
      pop();
    }
  } else {
    // Original drawing without blur
    push();
    translate(x - scaledWidth / 2, y - scaledHeight / 2);
    drawShapeWithGradient(0, 0, scaledWidth, scaledHeight, progress);
    pop();
  }
}

function drawShapeWithGradient(x, y, width, height, progress = null) {
  // Set up colors
  let colors = [];
  colors.push(color(params.shapeFillColor));
  colors[0].setAlpha(params.shapeAlpha * 255);

  if (params.gradientType !== "none") {
    colors.push(color(params.shapeFillColor2));
    colors[1].setAlpha(params.shapeAlpha * 255);

    if (params.gradientColors === "3") {
      colors.push(color(params.shapeFillColor3));
      colors[2].setAlpha(params.shapeAlpha * 255);
    }
  }

  // Handle stroke settings normally (removed stroke blur code)
  if (params.showPathShapeStroke) {
    stroke(params.shapeStrokeColor);
    strokeWeight(params.pathShapeStrokeWeight);
  } else {
    noStroke();
  }

  // Skip fill drawing if showFill is false
  if (!params.showFill) {
    // If showPathShapeStroke is also false, we need to draw something
    if (!params.showPathShapeStroke) {
      return;
    }

    // If we're here, we need to draw the shape with stroke but no fill
    push();
    translate(x, y);
    noFill();
    drawShape(0, 0, width, height);
    pop();
    return;
  }

  push();
  translate(x, y);

  // Handle different gradient types
  if (params.gradientType === "none") {
    fill(colors[0]);
    drawShape(0, 0, width, height);
  } else if (params.gradientType === "length" && progress !== null) {
    let fillColor;
    if (params.gradientColors === "2") {
      fillColor = lerpColor(colors[0], colors[1], progress);
    } else {
      fillColor =
        progress < 0.5
          ? lerpColor(colors[0], colors[1], progress * 2)
          : lerpColor(colors[1], colors[2], (progress - 0.5) * 2);
    }
    fill(fillColor);
    drawShape(0, 0, width, height);
  } else {
    let ctx = drawingContext;
    let gradient = createGradient(ctx, width, height);

    // Apply gradient to shape
    ctx.save();
    ctx.fillStyle = gradient;
    drawShapeWithContext(ctx, width, height);
    ctx.restore();
  }

  pop();
}

function drawShape(x, y, width, height) {
  if (params.shapeType === "rectangle") {
    if (params.shapeCornerRadius > 0) {
      let radius = min(params.shapeCornerRadius, width / 2, height / 2);
      rect(x, y, width, height, radius);
    } else {
      rect(x, y, width, height);
    }
  } else if (params.shapeType === "ellipse") {
    ellipse(x + width / 2, y + height / 2, width, height);
  }
}

function drawShapeWithContext(ctx, width, height) {
  if (params.shapeType === "rectangle") {
    if (params.shapeCornerRadius > 0) {
      let radius = min(params.shapeCornerRadius, width / 2, height / 2);
      roundedRect(ctx, 0, 0, width, height, radius);
    } else {
      ctx.fillRect(0, 0, width, height);
      if (params.showPathShapeStroke) {
        ctx.strokeRect(0, 0, width, height);
      }
    }
  } else if (params.shapeType === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, TWO_PI);
    ctx.fill();
    if (params.showPathShapeStroke) {
      ctx.stroke();
    }
  }
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  if (params.showPathShapeStroke) {
    ctx.stroke();
  }
}

function createGradient(ctx, width, height) {
  let gradient;
  switch (params.gradientType) {
    case "horizontal":
      gradient = ctx.createLinearGradient(0, 0, width, 0);
      break;
    case "vertical":
      gradient = ctx.createLinearGradient(0, 0, 0, height);
      break;
    case "diagonal":
      gradient = ctx.createLinearGradient(0, 0, width, height);
      break;
    case "radial":
      gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        max(width, height) / 2
      );
      break;
    case "conic":
      gradient = ctx.createConicGradient(-PI / 2, width / 2, height / 2);
      break;
    default:
      gradient = ctx.createLinearGradient(0, 0, width, 0);
  }

  // Create colors with proper alpha value
  let c1 = color(params.shapeFillColor);
  let c2 = color(params.shapeFillColor2);
  let c3 = color(params.shapeFillColor3);

  // Apply alpha to all colors
  c1.setAlpha(params.shapeAlpha * 255);
  c2.setAlpha(params.shapeAlpha * 255);
  c3.setAlpha(params.shapeAlpha * 255);

  // Add color stops with rgba format to preserve transparency
  if (params.gradientColors === "2") {
    gradient.addColorStop(
      0,
      `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${params.shapeAlpha})`
    );
    gradient.addColorStop(
      1,
      `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${params.shapeAlpha})`
    );
  } else {
    gradient.addColorStop(
      0,
      `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${params.shapeAlpha})`
    );
    gradient.addColorStop(
      0.5,
      `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${params.shapeAlpha})`
    );
    gradient.addColorStop(
      1,
      `rgba(${red(c3)}, ${green(c3)}, ${blue(c3)}, ${params.shapeAlpha})`
    );
  }

  return gradient;
}

function getPositionNoise(x, y, segmentIndex, stepIndex) {
  if (params.positionNoise === 0) {
    return { x: 0, y: 0 };
  }

  // Create a unique seed for each shape position to ensure consistent displacement
  let seed = segmentIndex * 1000 + stepIndex;

  // Use the seed to create deterministic but seemingly random values
  let randomX = (sin(seed * 0.123) + cos(seed * 0.456)) * 0.5;
  let randomY = (sin(seed * 0.789) + cos(seed * 0.321)) * 0.5;

  // Create random angle and distance
  let angle = randomX * TWO_PI;
  let distance = abs(randomY) * params.positionNoise;

  return {
    x: cos(angle) * distance,
    y: sin(angle) * distance,
  };
}

function getSizeNoise(segmentIndex, stepIndex) {
  if (params.sizeNoise === 0) {
    return 1.0; // No change in size
  }

  // Create a unique seed for each shape position to ensure consistent size variation
  // Use prime numbers and irrational multipliers for better randomness distribution
  let seed = segmentIndex * 1031 + stepIndex * 491 + 127.753;

  // Use multiple trigonometric functions with different frequencies
  // to create more varied, less repeating patterns
  let noise1 = sin(seed * 0.567) * 0.5;
  let noise2 = cos(seed * 0.891 + 2.31) * 0.3;
  let noise3 = sin(seed * 0.247 - 1.53) * 0.2;

  // Combine the noise values for more randomness
  let randomFactor = noise1 + noise2 + noise3;

  // Map the random factor to a size multiplier between 1-sizeNoise and 1+sizeNoise
  // Constrain to ensure we don't get extreme values
  let sizeMultiplier =
    1.0 + constrain(randomFactor, -0.95, 0.95) * params.sizeNoise;

  return sizeMultiplier;
}

// Add this function to your sketch.js file
function updatePathCells() {
  pathCells = [];
  cellSizes = {};

  // Initialize newPathCells to prevent reference errors
  let newPathCells = [];

  // First handle the initial cell selection based on the includeSides parameter
  let positions = [];
  let usedRows = new Set();
  let usedCols = new Set();
  let startPoint = null;
  let endPoint = null;

  // If using side connections, select edge points
  if (params.includeSides && !params.closedLoop) {
    // Generate specific middle points on each edge
    let edgePoints = [];

    // Middle point of top edge
    edgePoints.push({
      i: 0,
      j: Math.floor(params.gridWidth / 2),
      edge: "top",
    });

    // Middle point of right edge
    edgePoints.push({
      i: Math.floor(params.gridHeight / 2),
      j: params.gridWidth - 1,
      edge: "right",
    });

    // Middle point of bottom edge
    edgePoints.push({
      i: params.gridHeight - 1,
      j: Math.floor(params.gridWidth / 2),
      edge: "bottom",
    });

    // Middle point of left edge
    edgePoints.push({
      i: Math.floor(params.gridHeight / 2),
      j: 0,
      edge: "left",
    });

    // Choose two random distinct edge points
    if (edgePoints.length >= 2) {
      let idx1 = Math.floor(random(edgePoints.length));
      startPoint = edgePoints[idx1];

      // Remove the first point from options
      edgePoints.splice(idx1, 1);

      let idx2 = Math.floor(random(edgePoints.length));
      endPoint = edgePoints[idx2];
    }

    if (startPoint) {
      pathCells.push(startPoint);
      usedRows.add(startPoint.i);
      usedCols.add(startPoint.j);
    }

    if (endPoint) {
      // Only add end point to usedRows/usedCols if not closed loop
      if (!params.closedLoop) {
        usedRows.add(endPoint.i);
        usedCols.add(endPoint.j);
      }
    }
  }

  // Calculate how many cells we need to add
  // (selected count minus edge points already added)
  let cellsNeeded = params.selectedCells - pathCells.length;
  if (params.includeSides && !params.closedLoop && endPoint) {
    cellsNeeded -= 1; // Reserve space for end point
  }

  // Create a list of all valid cells
  for (let i = 0; i < params.gridHeight; i++) {
    for (let j = 0; j < params.gridWidth; j++) {
      if (params.uniqueRowsCols && (usedRows.has(i) || usedCols.has(j))) {
        continue;
      }

      // Skip cells already in pathCells
      let alreadyUsed = false;
      for (let cell of pathCells) {
        if (cell.i === i && cell.j === j) {
          alreadyUsed = true;
          break;
        }
      }

      if (!alreadyUsed) {
        positions.push({ i, j });
      }
    }
  }

  // Randomly select cells
  while (pathCells.length < cellsNeeded && positions.length > 0) {
    let index = Math.floor(random(positions.length));
    let cell = positions[index];

    pathCells.push(cell);
    positions.splice(index, 1);

    if (params.uniqueRowsCols) {
      // Remove cells in the same row/column
      positions = positions.filter(
        (pos) => pos.i !== cell.i && pos.j !== cell.j
      );

      // Add to used rows/columns
      usedRows.add(cell.i);
      usedCols.add(cell.j);
    }
  }

  // Add the end point if using side connections
  if (params.includeSides && !params.closedLoop && endPoint) {
    pathCells.push(endPoint);
  }

  // Apply path direction constraints if enabled
  if (params.pathDirection !== "any" && pathCells.length > 0) {
    // Save edge points if includeSides is true
    let edgePoints = [];
    if (params.includeSides && !params.closedLoop) {
      // First and last points should be preserved as edge points
      edgePoints = [pathCells[0], pathCells[pathCells.length - 1]];
      // Remove edge points from path for now
      pathCells = pathCells.slice(1, -1);
    }

    // Start with first cell in the path
    let firstCell =
      params.includeSides && !params.closedLoop ? edgePoints[0] : pathCells[0];

    // Clear the existing path except for the first cell
    newPathCells = [firstCell];
    usedRows = new Set([firstCell.i]);
    usedCols = new Set([firstCell.j]);

    // Get all cells that could be part of the path
    let remainingCells = [];

    // Calculate target count based on original selected cells
    let targetCount =
      params.includeSides && !params.closedLoop
        ? params.selectedCells - 1 // Leave room for the end edge point
        : params.selectedCells;

    // Collect all possible cells for path segments
    for (let i = 0; i < params.gridHeight; i++) {
      for (let j = 0; j < params.gridWidth; j++) {
        // Skip the cells already in the path
        if (i === firstCell.i && j === firstCell.j) continue;

        // If using unique rows/cols, skip cells in used rows/cols
        if (params.uniqueRowsCols && (usedRows.has(i) || usedCols.has(j)))
          continue;

        remainingCells.push({ i, j });
      }
    }

    // Build the constrained path
    while (newPathCells.length < targetCount - 1 && remainingCells.length > 0) {
      let lastCell = newPathCells[newPathCells.length - 1];

      // Find valid neighbors based on the selected path direction
      let validNeighbors = remainingCells.filter((cell) => {
        // Determine direction type based on relative positions
        let isVerticalOrHorizontal =
          (cell.i === lastCell.i && cell.j !== lastCell.j) || // Same row, different column
          (cell.j === lastCell.j && cell.i !== lastCell.i); // Same column, different row

        let isDiagonal =
          Math.abs(cell.i - lastCell.i) === Math.abs(cell.j - lastCell.j) && // Equal change in row and column
          Math.abs(cell.i - lastCell.i) > 0; // Ensure it's not the same cell

        // Apply filter based on path direction setting
        switch (params.pathDirection) {
          case "90":
            return isVerticalOrHorizontal;
          case "45":
            return isDiagonal;
          case "90+45":
            return isVerticalOrHorizontal || isDiagonal;
          default:
            return true; // "any" - allow any direction
        }
      });

      // If we have valid neighbors, pick one randomly
      if (validNeighbors.length > 0) {
        let randomIndex = Math.floor(random(validNeighbors.length));
        let nextCell = validNeighbors[randomIndex];

        // Add to path
        newPathCells.push(nextCell);
        usedRows.add(nextCell.i);
        usedCols.add(nextCell.j);

        // Remove from remaining cells
        let indexToRemove = remainingCells.findIndex(
          (cell) => cell.i === nextCell.i && cell.j === nextCell.j
        );
        if (indexToRemove !== -1) {
          remainingCells.splice(indexToRemove, 1);
        }

        // If uniqueRowsCols is enabled, remove cells in same row/column
        if (params.uniqueRowsCols) {
          remainingCells = remainingCells.filter(
            (cell) => cell.i !== nextCell.i && cell.j !== nextCell.j
          );
        }
      } else {
        // No valid neighbors, break the loop
        break;
      }
    }

    // If we're using includeSides, handle connection to the end edge point
    if (params.includeSides && !params.closedLoop && edgePoints.length > 1) {
      let lastCell = newPathCells[newPathCells.length - 1];
      let endPoint = edgePoints[1];
      let canConnectDirectly = false;

      // Check if we can connect directly based on path direction
      switch (params.pathDirection) {
        case "90":
          canConnectDirectly =
            endPoint.i === lastCell.i || // Same row
            endPoint.j === lastCell.j; // Same column
          break;
        case "45":
          canConnectDirectly =
            Math.abs(endPoint.i - lastCell.i) ===
            Math.abs(endPoint.j - lastCell.j);
          break;
        case "90+45":
          canConnectDirectly =
            endPoint.i === lastCell.i || // Same row
            endPoint.j === lastCell.j || // Same column
            Math.abs(endPoint.i - lastCell.i) ===
              Math.abs(endPoint.j - lastCell.j); // Diagonal
          break;
        default: // "any"
          canConnectDirectly = true;
          break;
      }

      if (canConnectDirectly) {
        // Direct connection is possible with current direction constraint
        newPathCells.push(endPoint);
      } else {
        // Need intermediate points to maintain path direction constraints
        let intermediatePoints = [];

        if (params.pathDirection === "90" || params.pathDirection === "90+45") {
          // Try an intermediate point with either same row or column
          let intermediateCell = {
            i: lastCell.i, // Same row as last cell
            j: endPoint.j, // Same column as end point
          };

          if (
            !params.uniqueRowsCols ||
            (!usedRows.has(intermediateCell.i) &&
              !usedCols.has(intermediateCell.j))
          ) {
            intermediatePoints.push(intermediateCell);
          } else {
            // Try the other orientation
            intermediateCell = {
              i: endPoint.i, // Same row as end point
              j: lastCell.j, // Same column as last cell
            };

            if (
              !params.uniqueRowsCols ||
              (!usedRows.has(intermediateCell.i) &&
                !usedCols.has(intermediateCell.j))
            ) {
              intermediatePoints.push(intermediateCell);
            }
          }
        }

        if (params.pathDirection === "45" || params.pathDirection === "90+45") {
          // For 45° paths, we might need intermediate points to create a diagonal path
          let di = endPoint.i - lastCell.i;
          let dj = endPoint.j - lastCell.j;

          // If the end point isn't reachable with a single diagonal move
          if (Math.abs(di) !== Math.abs(dj)) {
            // Calculate an intermediate point that allows diagonal movement
            // by adjusting either row or column
            let adjustRow = Math.abs(di) < Math.abs(dj);
            let intermediate1 = {
              i: adjustRow
                ? lastCell.i + di
                : lastCell.i + Math.sign(di) * Math.abs(dj),
              j: adjustRow
                ? lastCell.j + Math.sign(dj) * Math.abs(di)
                : lastCell.j + dj,
            };

            // Make sure it's within grid bounds
            if (
              intermediate1.i >= 0 &&
              intermediate1.i < params.gridHeight &&
              intermediate1.j >= 0 &&
              intermediate1.j < params.gridWidth
            ) {
              intermediatePoints.push(intermediate1);
            }
          }
        }

        // Add all valid intermediate points
        for (let point of intermediatePoints) {
          newPathCells.push(point);
          usedRows.add(point.i);
          usedCols.add(point.j);
        }

        // Finally add the end point
        newPathCells.push(endPoint);
      }
    }

    // Replace the original pathCells with our new constrained path
    pathCells = newPathCells;
  }

  // Initialize random cell sizes for each cell
  for (let cell of pathCells) {
    let key = `${cell.i},${cell.j}`;
    cellSizes[key] = random(0.5, 1.5);
  }
}

// Add the keyPressed function to handle keyboard shortcuts
function keyPressed() {
  // Check for specific keys
  if (key === "r" || key === "R") {
    // Trigger regenerate function
    params.regeneratePath();
  } else if (key === "s" || key === "S") {
    // Trigger save image function
    params.exportImage();
  } else if (key === "e" || key === "E") {
    // Trigger save package versions function
    params.exportPackageVersions();
  }

  // Prevent default behavior for these keys
  if (["r", "R", "s", "S", "e", "E"].includes(key)) {
    return false;
  }

  return true;
}
