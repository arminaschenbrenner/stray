let gui;

// Global variables for path management
let pathCells = [];
let cellSizes = {};

// Path Generator module
const PathGenerator = {
  generatePath() {
    pathCells = [];
    cellSizes = {};

    // Initialize positions, used rows/columns, and edge points
    let positions = [];
    let usedRows = new Set();
    let usedCols = new Set();
    let startPoint = null;
    let endPoint = null;

    // Handle side connections if enabled
    if (ParamsManager.params.includeSides && !ParamsManager.params.closedLoop) {
      // Generate middle points on each edge
      let edgePoints = [
        {
          i: 0,
          j: Math.floor(ParamsManager.params.gridWidth / 2),
          edge: "top",
        },
        {
          i: Math.floor(ParamsManager.params.gridHeight / 2),
          j: ParamsManager.params.gridWidth - 1,
          edge: "right",
        },
        {
          i: ParamsManager.params.gridHeight - 1,
          j: Math.floor(ParamsManager.params.gridWidth / 2),
          edge: "bottom",
        },
        {
          i: Math.floor(ParamsManager.params.gridHeight / 2),
          j: 0,
          edge: "left",
        },
      ];

      // Choose two random distinct edge points
      if (edgePoints.length >= 2) {
        let idx1 = Math.floor(random(edgePoints.length));
        startPoint = edgePoints[idx1];
        edgePoints.splice(idx1, 1);

        let idx2 = Math.floor(random(edgePoints.length));
        endPoint = edgePoints[idx2];
      }

      if (startPoint) {
        pathCells.push(startPoint);
        usedRows.add(startPoint.i);
        usedCols.add(startPoint.j);
      }

      if (endPoint && !ParamsManager.params.closedLoop) {
        usedRows.add(endPoint.i);
        usedCols.add(endPoint.j);
      }
    }

    // Calculate cells needed
    let cellsNeeded = ParamsManager.params.selectedCells - pathCells.length;
    if (
      ParamsManager.params.includeSides &&
      !ParamsManager.params.closedLoop &&
      endPoint
    ) {
      cellsNeeded -= 1; // Reserve space for end point
    }

    // Create list of valid cells
    for (let i = 0; i < ParamsManager.params.gridHeight; i++) {
      for (let j = 0; j < ParamsManager.params.gridWidth; j++) {
        if (
          ParamsManager.params.uniqueRowsCols &&
          (usedRows.has(i) || usedCols.has(j))
        ) {
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

      if (ParamsManager.params.uniqueRowsCols) {
        // Remove cells in same row/column
        positions = positions.filter(
          (pos) => pos.i !== cell.i && pos.j !== cell.j
        );

        // Add to used rows/columns
        usedRows.add(cell.i);
        usedCols.add(cell.j);
      }
    }

    // Add end point if using side connections
    if (
      ParamsManager.params.includeSides &&
      !ParamsManager.params.closedLoop &&
      endPoint
    ) {
      pathCells.push(endPoint);
    }

    // Apply path direction constraints
    if (ParamsManager.params.pathDirection !== "any" && pathCells.length > 0) {
      this.applyDirectionConstraints(usedRows, usedCols, startPoint, endPoint);
    }

    // Initialize random cell sizes
    for (let cell of pathCells) {
      let key = `${cell.i},${cell.j}`;
      cellSizes[key] = random(0.5, 1.5);
    }
  },

  applyDirectionConstraints(usedRows, usedCols, startPoint, endPoint) {
    // Save edge points if needed
    let edgePoints = [];
    if (ParamsManager.params.includeSides && !ParamsManager.params.closedLoop) {
      edgePoints = [pathCells[0], pathCells[pathCells.length - 1]];
      pathCells = pathCells.slice(1, -1);
    }

    // Start with first cell
    let firstCell =
      ParamsManager.params.includeSides && !ParamsManager.params.closedLoop
        ? edgePoints[0]
        : pathCells[0];

    // Clear path and start fresh
    let newPathCells = [firstCell];
    usedRows = new Set([firstCell.i]);
    usedCols = new Set([firstCell.j]);

    // Calculate target count
    let targetCount =
      ParamsManager.params.includeSides && !ParamsManager.params.closedLoop
        ? ParamsManager.params.selectedCells - 1
        : ParamsManager.params.selectedCells;

    // Get all possible cells
    let remainingCells = [];
    for (let i = 0; i < ParamsManager.params.gridHeight; i++) {
      for (let j = 0; j < ParamsManager.params.gridWidth; j++) {
        // Skip cells already in the path
        if (i === firstCell.i && j === firstCell.j) continue;

        // Skip cells in used rows/cols if uniqueRowsCols is enabled
        if (
          ParamsManager.params.uniqueRowsCols &&
          (usedRows.has(i) || usedCols.has(j))
        )
          continue;

        remainingCells.push({ i, j });
      }
    }

    // Build constrained path
    while (newPathCells.length < targetCount - 1 && remainingCells.length > 0) {
      let lastCell = newPathCells[newPathCells.length - 1];

      // Find valid neighbors based on direction constraints
      let validNeighbors = remainingCells.filter((cell) => {
        // Determine direction type
        let isVerticalOrHorizontal =
          (cell.i === lastCell.i && cell.j !== lastCell.j) || // Same row
          (cell.j === lastCell.j && cell.i !== lastCell.i); // Same column

        let isDiagonal =
          Math.abs(cell.i - lastCell.i) === Math.abs(cell.j - lastCell.j) && // Equal change
          Math.abs(cell.i - lastCell.i) > 0; // Not the same cell

        // Apply direction constraint
        switch (ParamsManager.params.pathDirection) {
          case "90":
            return isVerticalOrHorizontal;
          case "45":
            return isDiagonal;
          case "90+45":
            return isVerticalOrHorizontal || isDiagonal;
          default:
            return true; // "any"
        }
      });

      // Select next cell if valid neighbors exist
      if (validNeighbors.length > 0) {
        let randomIndex = Math.floor(random(validNeighbors.length));
        let nextCell = validNeighbors[randomIndex];

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

        // Remove cells in same row/col if uniqueRowsCols is enabled
        if (ParamsManager.params.uniqueRowsCols) {
          remainingCells = remainingCells.filter(
            (cell) => cell.i !== nextCell.i && cell.j !== nextCell.j
          );
        }
      } else {
        break; // No valid neighbors
      }
    }

    // Handle connection to end edge point
    if (
      ParamsManager.params.includeSides &&
      !ParamsManager.params.closedLoop &&
      edgePoints.length > 1
    ) {
      let lastCell = newPathCells[newPathCells.length - 1];
      let endPoint = edgePoints[1];
      let canConnectDirectly = false;

      // Check if direct connection respects direction constraints
      switch (ParamsManager.params.pathDirection) {
        case "90":
          canConnectDirectly =
            endPoint.i === lastCell.i || endPoint.j === lastCell.j;
          break;
        case "45":
          canConnectDirectly =
            Math.abs(endPoint.i - lastCell.i) ===
            Math.abs(endPoint.j - lastCell.j);
          break;
        case "90+45":
          canConnectDirectly =
            endPoint.i === lastCell.i ||
            endPoint.j === lastCell.j ||
            Math.abs(endPoint.i - lastCell.i) ===
              Math.abs(endPoint.j - lastCell.j);
          break;
        default: // "any"
          canConnectDirectly = true;
          break;
      }

      if (canConnectDirectly) {
        newPathCells.push(endPoint);
      } else {
        // Need intermediate points
        let intermediatePoints = [];

        if (
          ParamsManager.params.pathDirection === "90" ||
          ParamsManager.params.pathDirection === "90+45"
        ) {
          // Try intermediate point with same row or column
          let intermediateCell = {
            i: lastCell.i, // Same row as last cell
            j: endPoint.j, // Same column as end point
          };

          if (
            !ParamsManager.params.uniqueRowsCols ||
            (!usedRows.has(intermediateCell.i) &&
              !usedCols.has(intermediateCell.j))
          ) {
            intermediatePoints.push(intermediateCell);
          } else {
            // Try other orientation
            intermediateCell = {
              i: endPoint.i, // Same row as end point
              j: lastCell.j, // Same column as last cell
            };

            if (
              !ParamsManager.params.uniqueRowsCols ||
              (!usedRows.has(intermediateCell.i) &&
                !usedCols.has(intermediateCell.j))
            ) {
              intermediatePoints.push(intermediateCell);
            }
          }
        }

        if (
          ParamsManager.params.pathDirection === "45" ||
          ParamsManager.params.pathDirection === "90+45"
        ) {
          // For diagonal paths
          let di = endPoint.i - lastCell.i;
          let dj = endPoint.j - lastCell.j;

          if (Math.abs(di) !== Math.abs(dj)) {
            // Calculate intermediate point for diagonal movement
            let adjustRow = Math.abs(di) < Math.abs(dj);
            let intermediate = {
              i: adjustRow
                ? lastCell.i + di
                : lastCell.i + Math.sign(di) * Math.abs(dj),
              j: adjustRow
                ? lastCell.j + Math.sign(dj) * Math.abs(di)
                : lastCell.j + dj,
            };

            // Ensure it's within grid bounds
            if (
              intermediate.i >= 0 &&
              intermediate.i < ParamsManager.params.gridHeight &&
              intermediate.j >= 0 &&
              intermediate.j < ParamsManager.params.gridWidth
            ) {
              intermediatePoints.push(intermediate);
            }
          }
        }

        // Add intermediate points
        for (let point of intermediatePoints) {
          newPathCells.push(point);
          usedRows.add(point.i);
          usedCols.add(point.j);
        }

        // Add end point
        newPathCells.push(endPoint);
      }
    }

    // Replace original path with constrained path
    pathCells = newPathCells;
  },

  getIntersectingGridCells(x1, y1, x2, y2) {
    let cellWidth =
      ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
    let cellHeight =
      ParamsManager.params.gridSize / ParamsManager.params.gridHeight;
    let cells = [];

    // Use Bresenham's line algorithm to find cells along the line
    let startCellI = Math.floor(y1 / cellHeight);
    let startCellJ = Math.floor(x1 / cellWidth);
    let endCellI = Math.floor(y2 / cellHeight);
    let endCellJ = Math.floor(x2 / cellWidth);

    // Clamp to grid bounds
    startCellI = constrain(startCellI, 0, ParamsManager.params.gridHeight - 1);
    startCellJ = constrain(startCellJ, 0, ParamsManager.params.gridWidth - 1);
    endCellI = constrain(endCellI, 0, ParamsManager.params.gridHeight - 1);
    endCellJ = constrain(endCellJ, 0, ParamsManager.params.gridWidth - 1);

    // Add start cell
    cells.push({ i: startCellI, j: startCellJ });

    // If start and end are the same, return single cell
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

    // Maximum steps to prevent infinite loops
    let maxSteps =
      ParamsManager.params.gridWidth * ParamsManager.params.gridHeight;
    let steps = 0;

    // Traverse the grid
    while (
      (currentI !== endCellI || currentJ !== endCellJ) &&
      steps < maxSteps
    ) {
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentJ += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentI += sy;
      }

      // Add cell if within bounds
      if (
        currentI >= 0 &&
        currentI < ParamsManager.params.gridHeight &&
        currentJ >= 0 &&
        currentJ < ParamsManager.params.gridWidth
      ) {
        cells.push({ i: currentI, j: currentJ });
      }

      steps++;
    }

    return cells;
  },
};

// Grid System module
const GridSystem = {
  draw() {
    if (ParamsManager.params.gridBlur > 0) {
      push();
      drawingContext.filter = `blur(${ParamsManager.params.gridBlur}px)`;
    }

    stroke(ParamsManager.params.gridColor);
    strokeWeight(ParamsManager.params.gridStrokeWeight);
    noFill();

    let cellWidth =
      ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
    let cellHeight =
      ParamsManager.params.gridSize / ParamsManager.params.gridHeight;

    // Draw the grid lines
    for (let i = 0; i <= ParamsManager.params.gridHeight; i++) {
      line(0, i * cellHeight, ParamsManager.params.gridSize, i * cellHeight);
    }

    for (let j = 0; j <= ParamsManager.params.gridWidth; j++) {
      line(j * cellWidth, 0, j * cellWidth, ParamsManager.params.gridSize);
    }

    // Draw padding boundary if enabled
    if (ParamsManager.params.gridPadding > 0) {
      let paddingColor = color(ParamsManager.params.gridColor);
      paddingColor.setAlpha(100); // Semi-transparent
      stroke(paddingColor);
      strokeWeight(ParamsManager.params.gridStrokeWeight * 0.5);

      // Draw outer padding boundary
      rect(
        -ParamsManager.params.gridPadding,
        -ParamsManager.params.gridPadding,
        ParamsManager.params.gridSize + ParamsManager.params.gridPadding * 2,
        ParamsManager.params.gridSize + ParamsManager.params.gridPadding * 2
      );
    }

    if (ParamsManager.params.gridBlur > 0) {
      drawingContext.filter = "none";
      pop();
    }
  },
};

// Global constants
const DEFAULT_PARAMS = {
  // Grid parameters
  gridWidth: 7,
  gridHeight: 7,
  gridSize: 500,
  squareGrid: true,
  showGrid: true,
  gridOnTop: false,
  gridStrokeWeight: 2,
  gridBlur: 0,

  // Shape parameters
  shapeType: "rectangle",
  shapeCornerRadius: 0,
  showPathShapeStroke: false,
  pathShapeStrokeWeight: 1,
  shapeBlur: 0,
  insideBlur: false,
  shapeSize: 1.0,
  booleanUnion: false,
  ellipseResolution: 32,
  positionNoise: 0,
  sizeNoise: 0,
  showShape: true,

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
  showPath: false,
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
  pathCornerRadius: 0,
  pathStrokeCap: "square",
  pathStrokeJoin: "miter",

  // Gradient parameters
  gradientType: "none",
  gradientColors: "2",

  // Shape style
  shapeStyle: "default",
};

// Style presets
const ShapeStylePresets = {
  default: {}, // Default values come from DEFAULT_PARAMS
  paint: {
    showShape: false,
    showPath: true,
    pathBlur: 10,
    pathStrokeWeight: 75,
    pathType: "curved",
    curveAmount: 0.05,
    pathStrokeCap: "round",
    pathStrokeJoin: "round",
    selectedCells: 10,
  },
  grid: {
    booleanUnion: true,
    shapeCornerRadius: 20,
    showPathShapeStroke: true,
    pathShapeStrokeWeight: 30,
    shapeBlur: 15,
    insideBlur: true,
    shapeSize: 1.1,
    alignShapesToGrid: true,
    showShape: true,
    selectedCells: 5,
    shapeType: "rectangle",
    showPath: false,
  },
  pixel: {
    booleanUnion: true,
    positionNoise: 10,
    sizeNoise: 0.5,
    showPathShapeStroke: true,
    pathShapeStrokeWeight: 5,
    selectedCells: 8,
    shapeSize: 0.5,
    shapeType: "rectangle",
    showShape: true,
    showPath: false,
    gradientType: "vertical",
    gradientColors: "2",
  },
  pipe: {
    shapeType: "ellipse",
    selectedCells: 8,
    gradientType: "diagonal",
  },
  cloud: {
    shapeType: "ellipse",
    booleanUnion: true,
    positionNoise: 50,
    sizeNoise: 0.5,
    showPathShapeStroke: true,
    pathShapeStrokeWeight: 20,
    shapeBlur: 10,
    insideBlur: true,
    shapeSize: 0.8,
  },
  bubbles: {
    shapeType: "ellipse",
    positionNoise: 50,
    sizeNoise: 0.5,
    showPathShapeStroke: true,
    shapeSize: 0.2,
    pathType: "curved",
    curveAmount: 0.1,
    pathShapeSpacing: 2,
    gradientType: "radial",
    gradientColors: "3",
  },
  smoke: {
    selectedCells: 7,
    pathType: "curved",
    curveAmount: 0.3,
    shapeAlpha: 0.03,
    gradientType: "conic",
  },
  square: {
    shapeSize: 0.9,
    selectedCells: 15,
    pathDirection: "90",
    gradientType: "horizontal",
  },
};

// Parameter Manager
const ParamsManager = {
  params: {},

  init() {
    // Clone the default parameters
    this.params = JSON.parse(JSON.stringify(DEFAULT_PARAMS));

    // Add function properties
    this.params.regeneratePath = () => {
      PathGenerator.generatePath();
    };

    this.params.exportImage = () => {
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
    };

    this.params.exportPackageVersions = () => {
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
      let originalShowGrid = this.params.showGrid;
      let originalBgColor = this.params.backgroundColor;
      let originalUseTransparent = window.useTransparentBackground || false;

      // Version 1: With grid (if not already showing)
      if (!originalShowGrid) {
        this.params.showGrid = true;
        redraw();
      }
      saveCanvas(dateString + "_Atico_Stray_grid_bg", "png");

      // Version 2: Without grid
      this.params.showGrid = false;
      redraw();
      saveCanvas(dateString + "_Atico_Stray_nogrid_bg", "png");

      // Add transparent mode flag
      window.useTransparentBackground = true;

      // Version 3: With grid + transparent background
      this.params.showGrid = true;
      redraw();
      saveCanvas(dateString + "_Atico_Stray_grid_nobg", "png");

      // Version 4: Without grid + transparent background
      this.params.showGrid = false;
      redraw();
      saveCanvas(dateString + "_Atico_Stray_nobg", "png");

      // Restore original state
      this.params.showGrid = originalShowGrid;
      this.params.backgroundColor = originalBgColor;
      window.useTransparentBackground = originalUseTransparent;
      redraw();
    };
  },

  resetToDefaults() {
    // Reset all parameters to defaults
    for (const key in DEFAULT_PARAMS) {
      if (
        this.params.hasOwnProperty(key) &&
        typeof DEFAULT_PARAMS[key] !== "function"
      ) {
        this.params[key] = DEFAULT_PARAMS[key];
      }
    }

    // Update GUI and regenerate path
    UIManager.updateAllControllers();
    PathGenerator.generatePath();
  },

  applyStyle(style) {
    // First reset to defaults
    for (const key in DEFAULT_PARAMS) {
      if (
        this.params.hasOwnProperty(key) &&
        typeof DEFAULT_PARAMS[key] !== "function"
      ) {
        this.params[key] = DEFAULT_PARAMS[key];
      }
    }

    // Apply the selected style preset
    if (ShapeStylePresets[style]) {
      Object.assign(this.params, ShapeStylePresets[style]);
    }

    // Update UI and regenerate path
    UIManager.updateAllControllers();
    PathGenerator.generatePath();
  },
};

function setup() {
  createCanvas(windowWidth, windowHeight);

  ParamsManager.init();

  // Initialize transparent background flag
  window.useTransparentBackground = false;

  // Initialize polybool if available
  if (typeof PolyBool !== "undefined") {
    polybool = PolyBool;
  }

  UIManager.setupGUI();

  PathGenerator.generatePath();
}

// UI Manager
const UIManager = {
  gui: null,
  folders: {
    general: null,
    grid: null,
    shape: null,
    path: null,
    color: null,
  },

  setupGUI() {
    this.gui = new dat.GUI();
    this.gui.width = 400;

    this.setupGeneralFolder();
    this.setupGridFolder();
    this.setupShapeFolder();
    this.setupPathFolder();
    this.setupColorFolder();

    // Open all folders
    for (let key in this.folders) {
      this.folders[key].open();
    }
  },

  setupGeneralFolder() {
    this.folders.general = this.gui.addFolder("General");

    this.folders.general
      .add(ParamsManager.params, "regeneratePath")
      .name("Regenerate (R)");
    this.folders.general
      .add(ParamsManager.params, "exportImage")
      .name("Save (S)");
    this.folders.general
      .add(ParamsManager.params, "exportPackageVersions")
      .name("Save (package) (E)");

    this.folders.general
      .add(ParamsManager.params, "shapeStyle", Object.keys(ShapeStylePresets))
      .name("Shape Style")
      .onChange((value) => ParamsManager.applyStyle(value));
  },

  setupGridFolder() {
    this.folders.grid = this.gui.addFolder("Grid");

    this.folders.grid.add(ParamsManager.params, "showGrid").name("Show Grid");
    this.folders.grid
      .add(ParamsManager.params, "gridOnTop")
      .name("Grid on Top");
    this.folders.grid
      .add(ParamsManager.params, "squareGrid")
      .name("Square Grid");

    let widthControl = this.folders.grid
      .add(ParamsManager.params, "gridWidth", 1, 20, 1)
      .onChange(() => {
        if (ParamsManager.params.squareGrid) {
          ParamsManager.params.gridHeight = ParamsManager.params.gridWidth;
          // Update height controller
          for (let controller of this.folders.grid.__controllers) {
            if (controller.property === "gridHeight") {
              controller.updateDisplay();
              break;
            }
          }
        }
        PathGenerator.generatePath();
      });

    let heightControl = this.folders.grid
      .add(ParamsManager.params, "gridHeight", 1, 20, 1)
      .onChange(() => {
        if (ParamsManager.params.squareGrid) {
          ParamsManager.params.gridWidth = ParamsManager.params.gridHeight;
          // Update width controller
          for (let controller of this.folders.grid.__controllers) {
            if (controller.property === "gridWidth") {
              controller.updateDisplay();
              break;
            }
          }
        }
        PathGenerator.generatePath();
      });

    this.folders.grid
      .add(ParamsManager.params, "gridSize", 100, 1000)
      .name("Grid Size");
    this.folders.grid
      .add(ParamsManager.params, "gridStrokeWeight", 0.1, 5)
      .name("Grid Stroke Weight");
    this.folders.grid
      .add(ParamsManager.params, "gridBlur", 0, 20)
      .name("Grid Blur");
  },

  setupShapeFolder() {
    this.folders.shape = this.gui.addFolder("Shape");

    this.folders.shape
      .add(ParamsManager.params, "shapeType", ["rectangle", "ellipse"])
      .name("Shape Type");

    this.folders.shape
      .add(ParamsManager.params, "showShape")
      .name("Show Shape");

    let booleanUnionController = this.folders.shape
      .add(ParamsManager.params, "booleanUnion")
      .name("Boolean Union")
      .onChange((value) => {
        if (value === true && ParamsManager.params.pathShapeSpacing < 10) {
          // Enforce minimum spacing
          ParamsManager.params.pathShapeSpacing = 10;

          // Update spacing controller
          for (let controller of this.folders.path.__controllers) {
            if (controller.property === "pathShapeSpacing") {
              controller.updateDisplay();
              break;
            }
          }
        }

        // Enable/disable insideBlur toggle
        for (let controller of this.folders.shape.__controllers) {
          if (controller.property === "insideBlur") {
            controller.domElement.parentElement.style.pointerEvents = value
              ? "auto"
              : "none";
            controller.domElement.parentElement.style.opacity = value
              ? "1"
              : "0.5";

            // Turn off insideBlur if boolean union is off
            if (!value && ParamsManager.params.insideBlur) {
              ParamsManager.params.insideBlur = false;
              controller.updateDisplay();
            }
            break;
          }
        }
      });
    this.folders.shape
      .add(ParamsManager.params, "ellipseResolution", 8, 32, 1)
      .name("Ellipse Resolution");
    this.folders.shape
      .add(ParamsManager.params, "positionNoise", 0, 50)
      .name("Position Noise");
    this.folders.shape
      .add(ParamsManager.params, "sizeNoise", 0, 1, 0.1)
      .name("Size Noise");
    this.folders.shape
      .add(ParamsManager.params, "shapeCornerRadius", 0, 50)
      .name("Shape Corner Radius");
    this.folders.shape
      .add(ParamsManager.params, "showPathShapeStroke")
      .name("Show Shape Stroke");
    this.folders.shape
      .add(ParamsManager.params, "pathShapeStrokeWeight", 0.1, 50)
      .name("Shape Stroke Weight");
    this.folders.shape
      .add(ParamsManager.params, "shapeBlur", 0, 50)
      .name("Shape Blur");
    this.folders.shape
      .add(ParamsManager.params, "insideBlur")
      .name("Inside-Only Blur");
    this.folders.shape
      .add(ParamsManager.params, "shapeSize", 0.1, 2)
      .name("Shape Size");
  },

  setupPathFolder() {
    this.folders.path = this.gui.addFolder("Path");

    this.folders.path
      .add(ParamsManager.params, "showPath")
      .name("Show Path Stroke");
    this.folders.path
      .add(ParamsManager.params, "fillPath")
      .name("Show Path Fill");
    this.folders.path
      .add(ParamsManager.params, "pathBlur", 0, 50)
      .name("Path Blur");
    this.folders.path
      .add(ParamsManager.params, "pathStrokeWeight", 0.1, 100)
      .name("Path Stroke Weight");

    this.folders.path
      .add(ParamsManager.params, "pathType", [
        "straight",
        "curved",
        "continuous",
      ])
      .name("Path Type");

    this.folders.path
      .add(ParamsManager.params, "selectedCells", 2, 50, 1)
      .name("Number of Cells")
      .onChange(() => {
        // Regenerate path on cell count change
        PathGenerator.generatePath();
      });

    let spacingController = this.folders.path
      .add(ParamsManager.params, "pathShapeSpacing", 1, 500)
      .name("Shape Spacing")
      .onChange((value) => {
        // Enforce minimum spacing if boolean union is active
        if (ParamsManager.params.booleanUnion && value < 10) {
          ParamsManager.params.pathShapeSpacing = 10;
          spacingController.updateDisplay();
        }
      });

    this.folders.path
      .add(ParamsManager.params, "alignShapesToGrid")
      .name("Align Shapes to Grid");
    this.folders.path
      .add(ParamsManager.params, "curveAmount", 0, 1)
      .name("Curvature");
    this.folders.path
      .add(ParamsManager.params, "constrainToGrid")
      .name("Constrain to Grid");
    this.folders.path
      .add(ParamsManager.params, "closedLoop")
      .name("Close Loop");

    this.folders.path
      .add(ParamsManager.params, "uniqueRowsCols")
      .name("Unique Rows/Cols")
      .onChange(() => {
        // Regenerate path on unique rows/cols change
        PathGenerator.generatePath();
      });

    this.folders.path
      .add(ParamsManager.params, "pathDirection", ["any", "90", "45", "90+45"])
      .name("Path Direction")
      .onChange(() => {
        // Regenerate path on direction change
        PathGenerator.generatePath();
      });

    this.folders.path
      .add(ParamsManager.params, "includeSides")
      .name("Side Connections")
      .onChange(() => {
        // Regenerate path on side connections change
        PathGenerator.generatePath();
      });

    this.folders.path
      .add(ParamsManager.params, "pathCornerRadius", 0, 50)
      .name("Path Corner Radius");

    this.folders.path
      .add(ParamsManager.params, "pathStrokeCap", [
        "round",
        "square",
        "project",
      ])
      .name("Path Stroke Cap");

    this.folders.path
      .add(ParamsManager.params, "pathStrokeJoin", ["miter", "round", "bevel"])
      .name("Path Stroke Join");
  },

  setupColorFolder() {
    this.folders.color = this.gui.addFolder("Colors");

    this.folders.color
      .addColor(ParamsManager.params, "backgroundColor")
      .name("Background Color");
    this.folders.color
      .addColor(ParamsManager.params, "gridColor")
      .name("Grid Color");
    this.folders.color
      .addColor(ParamsManager.params, "shapeStrokeColor")
      .name("Shape Stroke Color");
    this.folders.color
      .addColor(ParamsManager.params, "pathStrokeColor")
      .name("Path Stroke Color");
    this.folders.color
      .addColor(ParamsManager.params, "pathFillColor")
      .name("Path Fill Color");
    this.folders.color
      .add(ParamsManager.params, "showFill")
      .name("Show Shape Fill");
    this.folders.color
      .add(ParamsManager.params, "shapeAlpha", 0, 1)
      .step(0.01)
      .name("Shape Transparency");

    this.folders.color
      .add(ParamsManager.params, "gradientType", [
        "none",
        "horizontal",
        "vertical",
        "length",
        "radial",
        "diagonal",
        "conic",
      ])
      .name("Gradient Type");

    this.folders.color
      .add(ParamsManager.params, "gradientColors", ["2", "3"])
      .name("Gradient Colors");
    this.folders.color
      .addColor(ParamsManager.params, "shapeFillColor")
      .name("Shape Fill Color 1");
    this.folders.color
      .addColor(ParamsManager.params, "shapeFillColor2")
      .name("Shape Fill Color 2");
    this.folders.color
      .addColor(ParamsManager.params, "shapeFillColor3")
      .name("Shape Fill Color 3");
  },

  updateAllControllers() {
    // Update all controllers to reflect current parameter values
    for (let folder in this.gui.__folders) {
      for (let controller of this.gui.__folders[folder].__controllers) {
        controller.updateDisplay();
      }
    }
  },
};

function draw() {
  // Check if we should use transparent background
  if (window.useTransparentBackground) {
    // For transparent background, use clear() instead of background()
    clear();
  } else {
    // Regular opaque background
    background(ParamsManager.params.backgroundColor);
  }

  translate(
    (width - ParamsManager.params.gridSize) / 2,
    (height - ParamsManager.params.gridSize) / 2
  );

  if (ParamsManager.params.showGrid && !ParamsManager.params.gridOnTop) {
    GridSystem.draw();
  }

  // Draw the path and shapes as needed
  if (
    ParamsManager.params.showShape ||
    ParamsManager.params.showPath ||
    ParamsManager.params.fillPath
  ) {
    PathRenderer.drawPath();
  }

  if (ParamsManager.params.showGrid && ParamsManager.params.gridOnTop) {
    GridSystem.draw();
  }
}

function drawCurvedPath(cellWidth, cellHeight) {
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
    let perpX = -(y - prevY) * ParamsManager.params.curveAmount;
    let perpY = (x - prevX) * ParamsManager.params.curveAmount;

    if (ParamsManager.params.constrainToGrid) {
      // Apply constraints to keep curve within grid
      let safeControlPoint = PathRenderer.findSafeControlPoint(
        prevX,
        prevY,
        x,
        y,
        midX,
        midY,
        perpX,
        perpY,
        cellWidth,
        cellHeight
      );

      perpX = safeControlPoint.perpX;
      perpY = safeControlPoint.perpY;
    }

    // Draw bezier curve segment
    bezierVertex(midX + perpX, midY + perpY, midX + perpX, midY + perpY, x, y);
  }

  // Close the loop if needed
  if (ParamsManager.params.closedLoop) {
    let firstCell = pathCells[0];
    let lastCell = pathCells[pathCells.length - 1];
    let firstX = firstCell.j * cellWidth + cellWidth / 2;
    let firstY = firstCell.i * cellHeight + cellHeight / 2;
    let lastX = lastCell.j * cellWidth + cellWidth / 2;
    let lastY = lastCell.i * cellHeight + cellHeight / 2;

    let midX = (lastX + firstX) / 2;
    let midY = (lastY + firstY) / 2;
    let perpX = -(firstY - lastY) * ParamsManager.params.curveAmount;
    let perpY = (firstX - lastX) * ParamsManager.params.curveAmount;

    if (ParamsManager.params.constrainToGrid) {
      // Apply constraints to closing segment
      let safeControlPoint = PathRenderer.findSafeControlPoint(
        lastX,
        lastY,
        firstX,
        firstY,
        midX,
        midY,
        perpX,
        perpY,
        cellWidth,
        cellHeight
      );

      perpX = safeControlPoint.perpX;
      perpY = safeControlPoint.perpY;
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

  endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
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
  if (ParamsManager.params.closedLoop) {
    points.push({
      x: points[0].x,
      y: points[0].y,
    });
  }

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
    let radius = min(ParamsManager.params.pathCornerRadius, len1 / 2, len2 / 2);

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

  endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
}

// Path Renderer module
const PathRenderer = {
  drawPath() {
    // Draw the path line if either stroke or fill is enabled
    if (ParamsManager.params.showPath || ParamsManager.params.fillPath) {
      this.drawPathLine();
    }

    // Draw the shapes if enabled
    if (ParamsManager.params.showShape) {
      if (ParamsManager.params.booleanUnion && polybool) {
        this.drawBooleanUnionPath();
      } else {
        this.drawRegularPath();
      }
    }
  },

  drawPathLine() {
    let numSegments = ParamsManager.params.closedLoop
      ? pathCells.length
      : pathCells.length - 1;
    let cellWidth =
      ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
    let cellHeight =
      ParamsManager.params.gridSize / ParamsManager.params.gridHeight;

    // Apply blur if enabled
    if (ParamsManager.params.pathBlur > 0) {
      push();
      drawingContext.filter = `blur(${ParamsManager.params.pathBlur}px)`;
    }

    // Set stroke and fill independently
    if (ParamsManager.params.showPath) {
      stroke(ParamsManager.params.pathStrokeColor);
      strokeWeight(ParamsManager.params.pathStrokeWeight);

      // Apply stroke cap style
      switch (ParamsManager.params.pathStrokeCap) {
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

      // Apply stroke join style
      switch (ParamsManager.params.pathStrokeJoin) {
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
      noStroke();
    }

    // Set fill
    if (ParamsManager.params.fillPath) {
      fill(ParamsManager.params.pathFillColor);
    } else {
      noFill();
    }

    // Skip drawing if both stroke and fill are disabled
    if (!ParamsManager.params.showPath && !ParamsManager.params.fillPath) {
      return;
    }

    // For paths with corner radius, use custom drawing
    if (
      ParamsManager.params.pathCornerRadius > 0 &&
      ParamsManager.params.pathType !== "curved"
    ) {
      this.drawPathWithRoundedCorners(cellWidth, cellHeight);
    } else {
      // Standard path drawing
      if (ParamsManager.params.pathType === "curved") {
        this.drawCurvedPath(cellWidth, cellHeight);
      } else {
        // Both straight and continuous use the same vertex-based approach
        beginShape();

        for (let i = 0; i < pathCells.length; i++) {
          let currentCell = pathCells[i];
          let x = currentCell.j * cellWidth + cellWidth / 2;
          let y = currentCell.i * cellHeight + cellHeight / 2;
          vertex(x, y);
        }

        if (ParamsManager.params.closedLoop) {
          endShape(CLOSE);
        } else {
          endShape();
        }
      }
    }

    // Reset filter if blur was applied
    if (ParamsManager.params.pathBlur > 0) {
      drawingContext.filter = "none";
      pop();
    }
  },

  drawCurvedPath(cellWidth, cellHeight) {
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
      let perpX = -(y - prevY) * ParamsManager.params.curveAmount;
      let perpY = (x - prevX) * ParamsManager.params.curveAmount;

      if (ParamsManager.params.constrainToGrid) {
        // Apply constraints to keep curve within grid
        let safeControlPoint = this.findSafeControlPoint(
          prevX,
          prevY,
          x,
          y,
          midX,
          midY,
          perpX,
          perpY,
          cellWidth,
          cellHeight
        );

        perpX = safeControlPoint.perpX;
        perpY = safeControlPoint.perpY;
      }

      // Draw bezier curve segment
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
    if (ParamsManager.params.closedLoop) {
      let firstCell = pathCells[0];
      let lastCell = pathCells[pathCells.length - 1];
      let firstX = firstCell.j * cellWidth + cellWidth / 2;
      let firstY = firstCell.i * cellHeight + cellHeight / 2;
      let lastX = lastCell.j * cellWidth + cellWidth / 2;
      let lastY = lastCell.i * cellHeight + cellHeight / 2;

      let midX = (lastX + firstX) / 2;
      let midY = (lastY + firstY) / 2;
      let perpX = -(firstY - lastY) * ParamsManager.params.curveAmount;
      let perpY = (firstX - lastX) * ParamsManager.params.curveAmount;

      if (ParamsManager.params.constrainToGrid) {
        // Apply constraints to closing segment
        let safeControlPoint = this.findSafeControlPoint(
          lastX,
          lastY,
          firstX,
          firstY,
          midX,
          midY,
          perpX,
          perpY,
          cellWidth,
          cellHeight
        );

        perpX = safeControlPoint.perpX;
        perpY = safeControlPoint.perpY;
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

    endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
  },

  drawPathWithRoundedCorners(cellWidth, cellHeight) {
    if (pathCells.length < 2) return;

    // Calculate path points
    let points = pathCells.map((cell) => {
      return {
        x: cell.j * cellWidth + cellWidth / 2,
        y: cell.i * cellHeight + cellHeight / 2,
      };
    });

    // For closed loop, add first point again at the end
    if (ParamsManager.params.closedLoop) {
      points.push({
        x: points[0].x,
        y: points[0].y,
      });
    }

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
      let radius = min(
        ParamsManager.params.pathCornerRadius,
        len1 / 2,
        len2 / 2
      );

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

    endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
  },

  findSafeControlPoint(
    x1,
    y1,
    x2,
    y2,
    midX,
    midY,
    perpX,
    perpY,
    cellWidth,
    cellHeight
  ) {
    // Helper function to check if curve would go outside grid
    const wouldCurveGoOutside = (cpx, cpy) => {
      let steps = 10;
      for (let s = 0; s <= steps; s++) {
        let t = s / steps;
        let bx = bezierPoint(x1, cpx, cpx, x2, t);
        let by = bezierPoint(y1, cpy, cpy, y2, t);

        let halfWidth = cellWidth / 2;
        let halfHeight = cellHeight / 2;

        if (
          bx - halfWidth < 0 ||
          bx + halfWidth > ParamsManager.params.gridSize ||
          by - halfHeight < 0 ||
          by + halfHeight > ParamsManager.params.gridSize
        ) {
          return true;
        }
      }
      return false;
    };

    let standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
    let invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

    // If standard orientation goes outside but inverted doesn't, invert
    if (standardOutside && !invertedOutside) {
      return { perpX: -perpX, perpY: -perpY };
    }

    // If both orientations go outside or neither does, use binary search to find safe amount
    if (standardOutside && invertedOutside) {
      // Binary search for safe curve amount
      let minAmount = 0;
      let maxAmount = 1;
      let iterations = 6; // More iterations = more precise
      let safeAmount = ParamsManager.params.curveAmount;

      for (let i = 0; i < iterations; i++) {
        let testAmount = (minAmount + maxAmount) / 2;
        let testX =
          midX + perpX * (testAmount / ParamsManager.params.curveAmount);
        let testY =
          midY + perpY * (testAmount / ParamsManager.params.curveAmount);

        if (wouldCurveGoOutside(testX, testY)) {
          maxAmount = testAmount;
        } else {
          minAmount = testAmount;
          safeAmount = testAmount;
        }
      }

      return {
        perpX: perpX * (safeAmount / ParamsManager.params.curveAmount),
        perpY: perpY * (safeAmount / ParamsManager.params.curveAmount),
      };
    }

    // Original perpendicular values are fine
    return { perpX, perpY };
  },

  drawRegularPath() {
    let numSegments = ParamsManager.params.closedLoop
      ? pathCells.length
      : pathCells.length - 1;
    let totalLength = 0;

    // Calculate total path length
    for (let i = 0; i < numSegments; i++) {
      let currentCell = pathCells[i];
      let nextCell = pathCells[(i + 1) % pathCells.length];
      let cellWidth =
        ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
      let cellHeight =
        ParamsManager.params.gridSize / ParamsManager.params.gridHeight;
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
      let cellWidth =
        ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
      let cellHeight =
        ParamsManager.params.gridSize / ParamsManager.params.gridHeight;
      let x1 = currentCell.j * cellWidth + cellWidth / 2;
      let y1 = currentCell.i * cellHeight + cellHeight / 2;
      let x2 = nextCell.j * cellWidth + cellWidth / 2;
      let y2 = nextCell.i * cellHeight + cellHeight / 2;

      this.drawPathSegment(
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
  },

  drawBooleanUnionPath() {
    if (!polybool) {
      console.warn(
        'PolyBool library not loaded. Add <script src="https://cdn.jsdelivr.net/npm/polybooljs@1.2.0/dist/polybool.min.js"></script> to your HTML'
      );
      this.drawRegularPath();
      return;
    }

    // Enforce minimum spacing for boolean union operations
    if (ParamsManager.params.pathShapeSpacing < 10) {
      ParamsManager.params.pathShapeSpacing = 10;
      // Update GUI if available
      for (let controller of UIManager.folders.path.__controllers) {
        if (controller.property === "pathShapeSpacing") {
          controller.updateDisplay();
          break;
        }
      }
    }

    let shapes = this.collectAllShapes();
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
        if (
          this.isValidPolygon(unionResult) &&
          this.isValidPolygon(shapes[i])
        ) {
          unionResult = polybool.union(unionResult, shapes[i]);
        }
      } catch (e) {
        console.warn("Boolean operation failed:", e);
        break;
      }
    }

    // Draw the unified shape with gradient
    drawUnifiedShape(unionResult);
  },

  isValidPolygon(polygon) {
    return (
      polygon &&
      polygon.regions &&
      polygon.regions.length > 0 &&
      polygon.regions[0] &&
      polygon.regions[0].length >= 3
    );
  },

  collectAllShapes() {
    let shapes = [];
    let numSegments = ParamsManager.params.closedLoop
      ? pathCells.length
      : pathCells.length - 1;
    let totalLength = 0;

    // Calculate total path length
    for (let i = 0; i < numSegments; i++) {
      let currentCell = pathCells[i];
      let nextCell = pathCells[(i + 1) % pathCells.length];
      let cellWidth =
        ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
      let cellHeight =
        ParamsManager.params.gridSize / ParamsManager.params.gridHeight;
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
      let cellWidth =
        ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
      let cellHeight =
        ParamsManager.params.gridSize / ParamsManager.params.gridHeight;
      let x1 = currentCell.j * cellWidth + cellWidth / 2;
      let y1 = currentCell.i * cellHeight + cellHeight / 2;
      let x2 = nextCell.j * cellWidth + cellWidth / 2;
      let y2 = nextCell.i * cellHeight + cellHeight / 2;

      let segmentShapes = this.collectShapesFromSegment(
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
  },

  collectShapesFromSegment(
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
    let cellWidth =
      ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
    let cellHeight =
      ParamsManager.params.gridSize / ParamsManager.params.gridHeight;

    if (ParamsManager.params.alignShapesToGrid) {
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
          cell.i * ParamsManager.params.gridWidth + cell.j // Use cell index as step index
        );
        if (shape) shapes.push(shape);
      }
    } else {
      // Original shape collection logic
      if (ParamsManager.params.pathType === "curved") {
        let midX = (x1 + x2) / 2;
        let midY = (y1 + y2) / 2;
        let perpX = -(y2 - y1) * ParamsManager.params.curveAmount;
        let perpY = (x2 - x1) * ParamsManager.params.curveAmount;

        // Fix for curved paths in boolean union mode
        // Use the exact same control points and curve calculations as in drawPathSegment
        if (ParamsManager.params.constrainToGrid) {
          let standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
          let invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

          if (standardOutside && invertedOutside) {
            let safeAmount = findSafeCurveAmount(perpX, perpY, midX, midY);
            perpX *= safeAmount / ParamsManager.params.curveAmount;
            perpY *= safeAmount / ParamsManager.params.curveAmount;
          } else if (standardOutside) {
            perpX *= -1;
            perpY *= -1;
          }
        }

        let steps =
          floor(dist(x1, y1, x2, y2) / ParamsManager.params.pathShapeSpacing) *
          2;
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
            let noiseOffset = Utils.getPositionNoise(x, y, segmentIndex, i);
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
      } else if (ParamsManager.params.pathType === "continuous") {
        let prevCell =
          pathCells[(segmentIndex - 1 + pathCells.length) % pathCells.length];
        let nextNextCell = pathCells[(segmentIndex + 2) % pathCells.length];
        let nextCell = pathCells[(segmentIndex + 1) % pathCells.length];

        // Calculate distance for number of shapes
        let distance = dist(x1, y1, x2, y2);
        let numShapes = floor(distance / ParamsManager.params.pathShapeSpacing);
        numShapes = max(1, numShapes);

        for (let i = 0; i <= numShapes; i++) {
          let t = i / numShapes;
          let x = lerp(x1, x2, t);
          let y = lerp(y1, y2, t);

          // Apply position noise
          if (i > 0 && i < numShapes) {
            let noiseOffset = Utils.getPositionNoise(x, y, segmentIndex, i);
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
        let numShapes = floor(distance / ParamsManager.params.pathShapeSpacing);
        numShapes = max(1, numShapes); // Ensure at least one step

        for (let i = 0; i <= numShapes; i++) {
          let t = i / numShapes;
          let x = lerp(x1, x2, t);
          let y = lerp(y1, y2, t);
          let currentLength = accumulatedLength + distance * t;
          let progress = currentLength / totalLength;

          // Apply position noise only to interpolated shapes (not at t=0 or t=1)
          if (i > 0 && i < numShapes) {
            let noiseOffset = Utils.getPositionNoise(x, y, segmentIndex, i);
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
  },

  drawPathSegment(
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
    let cellWidth =
      ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
    let cellHeight =
      ParamsManager.params.gridSize / ParamsManager.params.gridHeight;

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
          x + halfWidth > ParamsManager.params.gridSize ||
          y - halfHeight < 0 ||
          y + halfHeight > ParamsManager.params.gridSize
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
      let safeAmount = ParamsManager.params.curveAmount;

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

    if (ParamsManager.params.pathType === "curved") {
      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2;
      let perpX = -(y2 - y1) * ParamsManager.params.curveAmount;
      let perpY = (x2 - x1) * ParamsManager.params.curveAmount;

      if (ParamsManager.params.constrainToGrid) {
        let standardOutside = wouldCurveGoOutside(midX + perpX, midY + perpY);
        let invertedOutside = wouldCurveGoOutside(midX - perpX, midY - perpY);

        if (standardOutside && invertedOutside) {
          let safeAmount = findSafeCurveAmount(perpX, perpY, midX, midY);
          perpX *= safeAmount / ParamsManager.params.curveAmount;
          perpY *= safeAmount / ParamsManager.params.curveAmount;
        } else if (standardOutside) {
          perpX *= -1;
          perpY *= -1;
        }
      }

      let steps =
        floor(dist(x1, y1, x2, y2) / ParamsManager.params.pathShapeSpacing) * 2;
      for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        let x = bezierPoint(x1, midX + perpX, midX + perpX, x2, t);
        let y = bezierPoint(y1, midY + perpY, midY + perpY, y2, t);
        let segmentLength = dist(x1, y1, x2, y2);
        let currentLength = accumulatedLength + segmentLength * t;
        let progress = currentLength / totalLength;

        // Apply position noise only to interpolated shapes (not at t=0 or t=1)
        if (i > 0 && i < steps) {
          let noiseOffset = Utils.getPositionNoise(x, y, segmentIndex, i);
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
    } else if (ParamsManager.params.pathType === "continuous") {
      let prevCell =
        pathCells[(segmentIndex - 1 + pathCells.length) % pathCells.length];
      let nextNextCell = pathCells[(segmentIndex + 2) % pathCells.length];

      // Calculate control points for a smooth continuous curve
      let dx = nextCell.j - prevCell.j;
      let dy = nextCell.i - prevCell.i;

      // Calculate distance for number of shapes
      let distance = dist(x1, y1, x2, y2);
      let numShapes = floor(distance / ParamsManager.params.pathShapeSpacing);
      numShapes = max(1, numShapes);

      for (let i = 0; i <= numShapes; i++) {
        let t = i / numShapes;
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);

        // Apply position noise
        if (i > 0 && i < numShapes) {
          let noiseOffset = Utils.getPositionNoise(x, y, segmentIndex, i);
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
      let numShapes = floor(distance / ParamsManager.params.pathShapeSpacing);
      numShapes = max(1, numShapes); // Ensure at least one step

      for (let i = 0; i <= numShapes; i++) {
        let t = i / numShapes;
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);
        let currentLength = accumulatedLength + distance * t;
        let progress = currentLength / totalLength;

        // Apply position noise only to interpolated shapes (not at t=0 or t=1)
        if (i > 0 && i < numShapes) {
          let noiseOffset = Utils.getPositionNoise(x, y, segmentIndex, i);
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

    if (ParamsManager.params.alignShapesToGrid) {
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
          cell.i * ParamsManager.params.gridWidth + cell.j // Use cell index as step index
        );
      }
    }
  },
};

function getIntersectingGridCells(x1, y1, x2, y2) {
  let cellWidth =
    ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
  let cellHeight =
    ParamsManager.params.gridSize / ParamsManager.params.gridHeight;
  let cells = [];

  // Use a simplified version of Bresenham's line algorithm to find cells along the line
  let startCellI = Math.floor(y1 / cellHeight);
  let startCellJ = Math.floor(x1 / cellWidth);
  let endCellI = Math.floor(y2 / cellHeight);
  let endCellJ = Math.floor(x2 / cellWidth);

  // Clamp to grid bounds
  startCellI = constrain(startCellI, 0, ParamsManager.params.gridHeight - 1);
  startCellJ = constrain(startCellJ, 0, ParamsManager.params.gridWidth - 1);
  endCellI = constrain(endCellI, 0, ParamsManager.params.gridHeight - 1);
  endCellJ = constrain(endCellJ, 0, ParamsManager.params.gridWidth - 1);

  // Add start cell
  cells.push({ i: startCellI, j: startCellJ });

  // If start and end are the same, return single cell
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

  // Maximum steps to prevent infinite loops
  let maxSteps =
    ParamsManager.params.gridWidth * ParamsManager.params.gridHeight;
  let steps = 0;

  // Traverse the grid
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

    // Add cell if within bounds
    if (
      currentI >= 0 &&
      currentI < ParamsManager.params.gridHeight &&
      currentJ >= 0 &&
      currentJ < ParamsManager.params.gridWidth
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
  let scale = ParamsManager.params.shapeSize;

  // Apply size noise - this is the missing part for boolean union shapes
  let sizeNoiseFactor = Utils.getSizeNoise(segmentIndex, stepIndex);
  scale *= sizeNoiseFactor;

  let scaledWidth = width * scale;
  let scaledHeight = height * scale;
  let halfWidth = scaledWidth / 2;
  let halfHeight = scaledHeight / 2;

  // Ensure minimum size to avoid degenerate polygons
  if (halfWidth < 0.1 || halfHeight < 0.1) {
    return null;
  }

  if (ParamsManager.params.shapeType === "rectangle") {
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
    let numPoints = ParamsManager.params.ellipseResolution;

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
  if (ParamsManager.params.shapeBlur > 0) {
    if (ParamsManager.params.insideBlur) {
      // Inside-only blur with mask for boolean union shapes
      let bounds = getUnionBounds({ regions: validRegions });
      let bufferSize = max(bounds.width, bounds.height) * 1.5;
      let offsetX = (bufferSize - bounds.width) / 2;
      let offsetY = (bufferSize - bounds.height) / 2;

      // Create buffer for blurred shape
      let shapeBuffer = createGraphics(bufferSize, bufferSize);
      shapeBuffer.translate(-bounds.minX + offsetX, -bounds.minY + offsetY);

      // Apply blur filter
      shapeBuffer.drawingContext.filter = `blur(${ParamsManager.params.shapeBlur}px)`;

      // Set appearance and draw shape in buffer
      if (ParamsManager.params.showPathShapeStroke) {
        shapeBuffer.stroke(ParamsManager.params.shapeStrokeColor);
        shapeBuffer.strokeWeight(ParamsManager.params.pathShapeStrokeWeight);
      } else {
        shapeBuffer.noStroke();
      }

      // Handle fill
      if (!ParamsManager.params.showFill) {
        shapeBuffer.noFill();
      } else {
        // Apply solid fill (will handle gradient later)
        let fillColor = color(ParamsManager.params.shapeFillColor);
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        shapeBuffer.fill(fillColor);
      }

      // Draw all regions into buffer WITH corner radius
      for (let region of validRegions) {
        if (
          ParamsManager.params.shapeCornerRadius > 0 &&
          ParamsManager.params.shapeType === "rectangle"
        ) {
          // Draw with rounded corners using custom function
          drawRoundedPolygon(
            shapeBuffer,
            region,
            ParamsManager.params.shapeCornerRadius
          );
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
        if (
          ParamsManager.params.shapeCornerRadius > 0 &&
          ParamsManager.params.shapeType === "rectangle"
        ) {
          // Draw with rounded corners using the same custom function
          drawRoundedPolygon(
            maskBuffer,
            region,
            ParamsManager.params.shapeCornerRadius
          );
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
      drawingContext.filter = `blur(${ParamsManager.params.shapeBlur}px)`;

      // Set up appearance
      if (ParamsManager.params.showPathShapeStroke) {
        stroke(ParamsManager.params.shapeStrokeColor);
        strokeWeight(ParamsManager.params.pathShapeStrokeWeight);
      } else {
        noStroke();
      }

      // Handle fill based on showFill
      if (!ParamsManager.params.showFill) {
        noFill();
        // If neither stroke nor fill, exit early
        if (!ParamsManager.params.showPathShapeStroke) {
          pop();
          return;
        }
      } else {
        // Apply gradient or solid fill
        if (ParamsManager.params.gradientType === "none") {
          let fillColor = color(ParamsManager.params.shapeFillColor);
          fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
          fill(fillColor);
        } else if (ParamsManager.params.gradientType === "length") {
          // For boolean union, use middle color for length gradient
          let fillColor;
          if (ParamsManager.params.gradientColors === "2") {
            fillColor = lerpColor(
              color(ParamsManager.params.shapeFillColor),
              color(ParamsManager.params.shapeFillColor2),
              0.5
            );
          } else {
            fillColor = color(ParamsManager.params.shapeFillColor2); // Use middle color
          }
          fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
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
  if (ParamsManager.params.showPathShapeStroke) {
    // Normal stroke without blur
    stroke(ParamsManager.params.shapeStrokeColor);
    strokeWeight(ParamsManager.params.pathShapeStrokeWeight);
  } else {
    noStroke();
  }

  // Handle fill based on the showFill toggle
  if (!ParamsManager.params.showFill) {
    noFill();

    // If no stroke and no fill, exit early
    if (!ParamsManager.params.showPathShapeStroke) {
      return;
    }
  } else {
    // Apply gradient or solid color based on gradient type
    if (ParamsManager.params.gradientType === "none") {
      let fillColor = color(ParamsManager.params.shapeFillColor);
      fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
      fill(fillColor);
    } else if (ParamsManager.params.gradientType === "length") {
      // For boolean union, use middle color for length gradient
      let fillColor;
      if (ParamsManager.params.gradientColors === "2") {
        fillColor = lerpColor(
          color(ParamsManager.params.shapeFillColor),
          color(ParamsManager.params.shapeFillColor2),
          0.5
        );
      } else {
        fillColor = color(ParamsManager.params.shapeFillColor2); // Use middle color
      }
      fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
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
  switch (ParamsManager.params.gradientType) {
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
  let c1 = color(ParamsManager.params.shapeFillColor);
  let c2 = color(ParamsManager.params.shapeFillColor2);
  let c3 = color(ParamsManager.params.shapeFillColor3);

  // Apply alpha to all colors
  c1.setAlpha(ParamsManager.params.shapeAlpha * 255);
  c2.setAlpha(ParamsManager.params.shapeAlpha * 255);
  c3.setAlpha(ParamsManager.params.shapeAlpha * 255);

  // Add color stops with rgba format to preserve transparency
  if (ParamsManager.params.gradientColors === "2") {
    gradient.addColorStop(
      0,
      `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${
        ParamsManager.params.shapeAlpha
      })`
    );
    gradient.addColorStop(
      1,
      `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${
        ParamsManager.params.shapeAlpha
      })`
    );
  } else {
    gradient.addColorStop(
      0,
      `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${
        ParamsManager.params.shapeAlpha
      })`
    );
    gradient.addColorStop(
      0.5,
      `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${
        ParamsManager.params.shapeAlpha
      })`
    );
    gradient.addColorStop(
      1,
      `rgba(${red(c3)}, ${green(c3)}, ${blue(c3)}, ${
        ParamsManager.params.shapeAlpha
      })`
    );
  }

  return gradient;
}

function drawUnionWithContext(ctx, unionResult, strokeOnly = false) {
  for (let region of unionResult.regions) {
    if (!region || region.length < 3) continue;

    ctx.beginPath();

    // For rounded corners in polygon regions
    if (
      ParamsManager.params.shapeCornerRadius > 0 &&
      ParamsManager.params.shapeType === "rectangle"
    ) {
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
      let maxRadius = Math.min(
        ParamsManager.params.shapeCornerRadius,
        minEdgeLength * 0.4
      );

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

        if (len1 === 0 || len2 === 0) {
          ctx.lineTo(p1[0], p1[1]);
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
        ctx.lineTo(beforeCorner[0], beforeCorner[1]);

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
    } else if (
      !ParamsManager.params.showPathShapeStroke ||
      ParamsManager.params.strokeBlur > 0
    ) {
      // Fill only (if stroke is off or stroke has blur applied separately)
      ctx.fill();
    } else {
      // Both fill and stroke
      ctx.fill();
      ctx.stroke();
    }
  }
}

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

function drawShapeAtPosition(x, y, width, height, options) {
  const {
    cell,
    progress,
    totalSegments,
    segmentIndex = 0,
    stepIndex = 0,
  } = options;

  let scale = ParamsManager.params.shapeSize;

  // Apply size noise
  let sizeNoiseFactor = Utils.getSizeNoise(segmentIndex, stepIndex);
  scale *= sizeNoiseFactor;

  let scaledWidth = width * scale;
  let scaledHeight = height * scale;

  // Check if shape extends beyond padding boundary
  let position = Utils.adjustPositionToBounds(x, y, scaledWidth, scaledHeight);

  // Apply shape blur if needed
  if (ParamsManager.params.shapeBlur > 0) {
    if (ParamsManager.params.insideBlur) {
      this.drawInsideBlurredShape(
        position.x,
        position.y,
        scaledWidth,
        scaledHeight,
        progress
      );
    } else {
      push();
      drawingContext.filter = `blur(${ParamsManager.params.shapeBlur}px)`;
      translate(position.x - scaledWidth / 2, position.y - scaledHeight / 2);
      this.drawShapeWithGradient(0, 0, scaledWidth, scaledHeight, progress);
      drawingContext.filter = "none";
      pop();
    }
  } else {
    // Standard drawing without blur
    push();
    translate(position.x - scaledWidth / 2, position.y - scaledHeight / 2);
    this.drawShapeWithGradient(0, 0, scaledWidth, scaledHeight, progress);
    pop();
  }
}

function drawInsideBlurredShape(x, y, width, height, progress) {
  // Create graphics buffer for blurred shape
  let shapeBuffer = createGraphics(width * 1.5, height * 1.5);
  shapeBuffer.translate(width * 0.25, height * 0.25);

  // Apply blur
  shapeBuffer.drawingContext.filter = `blur(${ParamsManager.params.shapeBlur}px)`;

  // Set stroke properties
  if (ParamsManager.params.showPathShapeStroke) {
    shapeBuffer.stroke(ParamsManager.params.shapeStrokeColor);
    shapeBuffer.strokeWeight(ParamsManager.params.pathShapeStrokeWeight);
  } else {
    shapeBuffer.noStroke();
  }

  // Set fill based on parameters
  if (ParamsManager.params.showFill) {
    if (ParamsManager.params.gradientType === "none") {
      let fillColor = color(ParamsManager.params.shapeFillColor);
      fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
      shapeBuffer.fill(fillColor);
    } else if (
      ParamsManager.params.gradientType === "length" &&
      progress !== null
    ) {
      let fillColor;
      if (ParamsManager.params.gradientColors === "2") {
        fillColor = lerpColor(
          color(ParamsManager.params.shapeFillColor),
          color(ParamsManager.params.shapeFillColor2),
          progress
        );
      } else {
        let colors = [
          color(ParamsManager.params.shapeFillColor),
          color(ParamsManager.params.shapeFillColor2),
          color(ParamsManager.params.shapeFillColor3),
        ];

        fillColor =
          progress < 0.5
            ? lerpColor(colors[0], colors[1], progress * 2)
            : lerpColor(colors[1], colors[2], (progress - 0.5) * 2);
      }
      fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
      shapeBuffer.fill(fillColor);
    } else {
      // Use solid color for complex gradients
      let fillColor = color(ParamsManager.params.shapeFillColor);
      fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
      shapeBuffer.fill(fillColor);
    }
  } else {
    shapeBuffer.noFill();
  }

  // Draw the shape
  if (ParamsManager.params.shapeType === "rectangle") {
    if (ParamsManager.params.shapeCornerRadius > 0) {
      let radius = min(
        ParamsManager.params.shapeCornerRadius,
        width / 2,
        height / 2
      );
      shapeBuffer.rect(0, 0, width, height, radius);
    } else {
      shapeBuffer.rect(0, 0, width, height);
    }
  } else if (ParamsManager.params.shapeType === "ellipse") {
    shapeBuffer.ellipse(width / 2, height / 2, width, height);
  }

  // Create mask buffer
  let maskBuffer = createGraphics(width * 1.5, height * 1.5);
  maskBuffer.translate(width * 0.25, height * 0.25);
  maskBuffer.noStroke();
  maskBuffer.fill(255); // White for mask

  // Draw the shape mask
  if (ParamsManager.params.shapeType === "rectangle") {
    if (ParamsManager.params.shapeCornerRadius > 0) {
      let radius = min(
        ParamsManager.params.shapeCornerRadius,
        width / 2,
        height / 2
      );
      maskBuffer.rect(0, 0, width, height, radius);
    } else {
      maskBuffer.rect(0, 0, width, height);
    }
  } else if (ParamsManager.params.shapeType === "ellipse") {
    maskBuffer.ellipse(width / 2, height / 2, width, height);
  }

  // Convert Graphics to Images for masking
  let shapeImg = createImage(width * 1.5, height * 1.5);
  shapeImg.copy(
    shapeBuffer,
    0,
    0,
    width * 1.5,
    height * 1.5,
    0,
    0,
    width * 1.5,
    height * 1.5
  );

  let maskImg = createImage(width * 1.5, height * 1.5);
  maskImg.copy(
    maskBuffer,
    0,
    0,
    width * 1.5,
    height * 1.5,
    0,
    0,
    width * 1.5,
    height * 1.5
  );

  // Apply the mask
  shapeImg.mask(maskImg);

  // Draw the masked image
  image(shapeImg, x - width * 0.25 - width / 2, y - height * 0.25 - height / 2);

  // Apply gradient if needed
  if (
    ParamsManager.params.showFill &&
    ParamsManager.params.gradientType !== "none" &&
    ParamsManager.params.gradientType !== "length"
  ) {
    let ctx = drawingContext;
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";

    translate(x - width / 2, y - height / 2);
    let gradient = Utils.createGradient(ctx, width, height);
    ctx.fillStyle = gradient;

    if (ParamsManager.params.shapeType === "rectangle") {
      if (ParamsManager.params.shapeCornerRadius > 0) {
        let radius = min(
          ParamsManager.params.shapeCornerRadius,
          width / 2,
          height / 2
        );
        ctx.beginPath();
        Utils.roundedRect(ctx, 0, 0, width, height, radius);
      } else {
        ctx.fillRect(0, 0, width, height);
      }
    } else if (ParamsManager.params.shapeType === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, TWO_PI);
      ctx.fill();
    }

    ctx.restore();
  }

  // Clean up
  shapeBuffer.remove();
  maskBuffer.remove();
}

function drawShapeWithGradient(x, y, width, height, progress = null) {
  // Set up colors
  let colors = [];
  colors.push(color(ParamsManager.params.shapeFillColor));
  colors[0].setAlpha(ParamsManager.params.shapeAlpha * 255);

  if (ParamsManager.params.gradientType !== "none") {
    colors.push(color(ParamsManager.params.shapeFillColor2));
    colors[1].setAlpha(ParamsManager.params.shapeAlpha * 255);

    if (ParamsManager.params.gradientColors === "3") {
      colors.push(color(ParamsManager.params.shapeFillColor3));
      colors[2].setAlpha(ParamsManager.params.shapeAlpha * 255);
    }
  }

  // Handle stroke
  if (ParamsManager.params.showPathShapeStroke) {
    stroke(ParamsManager.params.shapeStrokeColor);
    strokeWeight(ParamsManager.params.pathShapeStrokeWeight);
  } else {
    noStroke();
  }

  // Skip fill if disabled
  if (!ParamsManager.params.showFill) {
    if (!ParamsManager.params.showPathShapeStroke) {
      return; // Nothing to draw
    }

    // Draw shape with stroke but no fill
    push();
    translate(x, y);
    noFill();
    this.drawShape(0, 0, width, height);
    pop();
    return;
  }

  push();
  translate(x, y);

  // Handle different gradient types
  if (ParamsManager.params.gradientType === "none") {
    fill(colors[0]);
    this.drawShape(0, 0, width, height);
  } else if (
    ParamsManager.params.gradientType === "length" &&
    progress !== null
  ) {
    let fillColor;
    if (ParamsManager.params.gradientColors === "2") {
      fillColor = lerpColor(colors[0], colors[1], progress);
    } else {
      fillColor =
        progress < 0.5
          ? lerpColor(colors[0], colors[1], progress * 2)
          : lerpColor(colors[1], colors[2], (progress - 0.5) * 2);
    }
    fill(fillColor);
    this.drawShape(0, 0, width, height);
  } else {
    let ctx = drawingContext;
    let gradient = Utils.createGradient(ctx, width, height);

    ctx.save();
    ctx.fillStyle = gradient;
    this.drawShapeWithContext(ctx, width, height);
    ctx.restore();
  }

  pop();
}

function drawShape(x, y, width, height) {
  if (ParamsManager.params.shapeType === "rectangle") {
    if (ParamsManager.params.shapeCornerRadius > 0) {
      let radius = min(
        ParamsManager.params.shapeCornerRadius,
        width / 2,
        height / 2
      );
      rect(x, y, width, height, radius);
    } else {
      rect(x, y, width, height);
    }
  } else if (ParamsManager.params.shapeType === "ellipse") {
    ellipse(x + width / 2, y + height / 2, width, height);
  }
}

function drawShapeWithContext(ctx, width, height) {
  if (ParamsManager.params.shapeType === "rectangle") {
    if (ParamsManager.params.shapeCornerRadius > 0) {
      let radius = min(
        ParamsManager.params.shapeCornerRadius,
        width / 2,
        height / 2
      );
      Utils.roundedRect(ctx, 0, 0, width, height, radius);
    } else {
      ctx.fillRect(0, 0, width, height);
      if (ParamsManager.params.showPathShapeStroke) {
        ctx.strokeRect(0, 0, width, height);
      }
    }
  } else if (ParamsManager.params.shapeType === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, TWO_PI);
    ctx.fill();
    if (ParamsManager.params.showPathShapeStroke) {
      ctx.stroke();
    }
  }
}

const Utils = {
  // Adjust position to respect boundaries
  adjustPositionToBounds(x, y, width, height) {
    const { gridSize, gridPadding } = ParamsManager.params;

    // Define boundaries for external padding
    const leftBoundary = -gridPadding;
    const rightBoundary = gridSize + gridPadding;
    const topBoundary = -gridPadding;
    const bottomBoundary = gridSize + gridPadding;

    // Calculate half dimensions for checking boundaries
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Adjust position to stay within boundaries
    let adjustedX = x;
    let adjustedY = y;

    if (x - halfWidth < leftBoundary) {
      adjustedX = leftBoundary + halfWidth;
    } else if (x + halfWidth > rightBoundary) {
      adjustedX = rightBoundary - halfWidth;
    }

    if (y - halfHeight < topBoundary) {
      adjustedY = topBoundary + halfHeight;
    } else if (y + halfHeight > bottomBoundary) {
      adjustedY = bottomBoundary - halfHeight;
    }

    return { x: adjustedX, y: adjustedY };
  },

  createGradient(ctx, width, height) {
    // Move existing createGradient code here
    let gradient;
    switch (ParamsManager.params.gradientType) {
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
    let c1 = color(ParamsManager.params.shapeFillColor);
    let c2 = color(ParamsManager.params.shapeFillColor2);
    let c3 = color(ParamsManager.params.shapeFillColor3);

    // Apply alpha to all colors
    c1.setAlpha(ParamsManager.params.shapeAlpha * 255);
    c2.setAlpha(ParamsManager.params.shapeAlpha * 255);
    c3.setAlpha(ParamsManager.params.shapeAlpha * 255);

    // Add color stops with rgba format to preserve transparency
    if (ParamsManager.params.gradientColors === "2") {
      gradient.addColorStop(
        0,
        `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${
          ParamsManager.params.shapeAlpha
        })`
      );
      gradient.addColorStop(
        1,
        `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${
          ParamsManager.params.shapeAlpha
        })`
      );
    } else {
      gradient.addColorStop(
        0,
        `rgba(${red(c1)}, ${green(c1)}, ${blue(c1)}, ${
          ParamsManager.params.shapeAlpha
        })`
      );
      gradient.addColorStop(
        0.5,
        `rgba(${red(c2)}, ${green(c2)}, ${blue(c2)}, ${
          ParamsManager.params.shapeAlpha
        })`
      );
      gradient.addColorStop(
        1,
        `rgba(${red(c3)}, ${green(c3)}, ${blue(c3)}, ${
          ParamsManager.params.shapeAlpha
        })`
      );
    }

    return gradient;
  },

  // Move other utility functions here (getPositionNoise, getSizeNoise, etc.)
  getPositionNoise(x, y, segmentIndex, stepIndex) {
    if (ParamsManager.params.positionNoise === 0) {
      return { x: 0, y: 0 };
    }

    // Create a unique seed for each shape position to ensure consistent displacement
    let seed = segmentIndex * 1000 + stepIndex;

    // Use the seed to create deterministic but seemingly random values
    let randomX = (sin(seed * 0.123) + cos(seed * 0.456)) * 0.5;
    let randomY = (sin(seed * 0.789) + cos(seed * 0.321)) * 0.5;

    // Create random angle and distance
    let angle = randomX * TWO_PI;
    let distance = abs(randomY) * ParamsManager.params.positionNoise;

    return {
      x: cos(angle) * distance,
      y: sin(angle) * distance,
    };
  },

  getSizeNoise(segmentIndex, stepIndex) {
    if (ParamsManager.params.sizeNoise === 0) {
      return 1.0; // No change in size
    }

    // Create a unique seed for each shape position to ensure consistent size variation
    let seed = segmentIndex * 1031 + stepIndex * 491 + 127.753;

    // Use multiple trigonometric functions with different frequencies for varied patterns
    let noise1 = sin(seed * 0.567) * 0.5;
    let noise2 = cos(seed * 0.891 + 2.31) * 0.3;
    let noise3 = sin(seed * 0.247 - 1.53) * 0.2;

    // Combine the noise values for more randomness
    let randomFactor = noise1 + noise2 + noise3;

    // Map to a size multiplier between 1-sizeNoise and 1+sizeNoise
    let sizeMultiplier =
      1.0 +
      constrain(randomFactor, -0.95, 0.95) * ParamsManager.params.sizeNoise;

    return sizeMultiplier;
  },

  roundedRect(ctx, x, y, width, height, radius) {
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
    if (ParamsManager.params.showPathShapeStroke) {
      ctx.stroke();
    }
  },
};
