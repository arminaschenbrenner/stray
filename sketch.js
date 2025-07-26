// Global variables
let gui;
let pathCells = [];
let cellSizes = {};

// Global constants for default parameters
const DefaultParams = {
  // Export parameters
  exportDPI: 300,
  exportSizeCM: 14,
  exportSizePixels: 1654,

  // Grid parameters
  canvasSize: 800,
  gridSize: 500,
  gridWidth: 7,
  gridHeight: 7,
  squareGrid: true,
  showGrid: true,
  gridOnTop: false,
  gridStrokeWeight: 2,
  gridBlur: 0,
  gridPadding: 10,
  showPadding: false,
  gridMargin: 28,

  // Shape parameters
  shapeType: "rectangle",
  shapeCornerRadius: 0,
  showPathShapeStroke: false,
  pathShapeStrokeWeight: 1,
  shapeBlur: 0,
  insideBlur: false,
  shapeSize: 1.0,
  booleanUnion: false,
  ellipseResolution: 64,
  positionNoise: 0,
  sizeNoise: 0,
  showShape: true,

  // Color parameters
  shapeFillColor: "Blue2",
  shapeFillColor2: "Purple2",
  shapeFillColor3: "Pink2",
  shapeAlpha: 1.0,
  showFill: true,
  backgroundColor: "White",
  gridColor: "Blue1",
  shapeStrokeColor: "Pink1",
  pathStrokeColor: "Green1",
  pathFillColor: "Yellow3",

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
  default: {}, // Default values come from DefaultParams
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
  stairs: {
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
    shapeSize: 1.3,
  },
  square: {
    shapeSize: 0.9,
    selectedCells: 15,
    pathDirection: "90",
    gradientType: "horizontal",
  },
};

// Parameter Manager module
const ParamsManager = {
  params: {},

  init() {
    // Clone the default parameters
    this.params = JSON.parse(JSON.stringify(DefaultParams));

    // Add function properties
    this.params.regeneratePath = () => {
      PathGenerator.generatePath();
    };

    this.params.exportCustomSize = () => {
      // Create timestamp for filename
      let now = new Date();
      let dateString =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "_" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");

      // Store original parameters
      const originalParams = {
        gridSize: this.params.gridSize,
        gridMargin: this.params.gridMargin,
        canvasSize: this.params.canvasSize,
        scaleFactor: window.currentScaleFactor,
      };

      // Get current display density
      const displayDensityFactor = pixelDensity();
      console.log(`Display density factor: ${displayDensityFactor}`);

      try {
        // Create an off-screen canvas at the desired export size
        const exportCanvas = createGraphics(
          this.params.exportSizePixels,
          this.params.exportSizePixels
        );

        // CRITICAL: Set pixel density to 1 for the export canvas
        exportCanvas.pixelDensity(1);

        // Apply background
        if (window.useTransparentBackground) {
          exportCanvas.clear();
        } else {
          exportCanvas.background(this.params.backgroundColor);
        }

        // IMPORTANT: Calculate the precise viewport ratio between margin and canvas
        // This ratio should be preserved exactly in the export
        const viewportMarginRatio =
          originalParams.gridMargin / originalParams.canvasSize;

        // Apply the same ratio to get the export margin in pixels
        const exportMargin = Math.round(
          this.params.exportSizePixels * viewportMarginRatio
        );

        // Calculate export grid size (export canvas size minus margins on both sides)
        const exportGridSize = this.params.exportSizePixels - exportMargin * 2;

        // Set export parameters
        const exportParams = {
          canvasSize: this.params.exportSizePixels,
          gridMargin: exportMargin,
          gridSize: exportGridSize,
        };

        // Store current parameters
        const currentParams = {
          canvasSize: this.params.canvasSize,
          gridMargin: this.params.gridMargin,
          gridSize: this.params.gridSize,
        };

        // Temporarily update parameters for drawing
        this.params.canvasSize = exportParams.canvasSize;
        this.params.gridMargin = exportParams.gridMargin;
        this.params.gridSize = exportParams.gridSize;

        // Update scale factor for proper scaling during export
        window.currentScaleFactor = exportGridSize / 500;

        console.log(
          `Export: size=${this.params.exportSizePixels}px, density=${displayDensityFactor}, ` +
            `viewport margin ratio=${viewportMarginRatio}, ` +
            `export margin=${exportMargin}, grid=${exportGridSize}, ` +
            `scaleFactor=${window.currentScaleFactor}`
        );

        // Draw to export canvas with correct grid position
        exportCanvas.push();
        exportCanvas.translate(exportMargin, exportMargin);

        // Draw grid if enabled (behind content)
        if (this.params.showGrid && !this.params.gridOnTop) {
          GridSystem.drawToCanvas(exportCanvas);
        }

        // Draw path content
        if (
          this.params.showShape ||
          this.params.showPath ||
          this.params.fillPath
        ) {
          PathRenderer.drawPathToCanvas(exportCanvas);
        }

        // Draw grid on top if needed
        if (this.params.showGrid && this.params.gridOnTop) {
          GridSystem.drawToCanvas(exportCanvas);
        }

        exportCanvas.pop();

        // Save the export canvas
        saveCanvas(
          exportCanvas,
          dateString +
            `_Atico_Stray_${this.params.exportSizePixels}px_${this.params.exportDPI}dpi`,
          "png"
        );

        // Clean up
        exportCanvas.remove();

        // Log export info
        console.log(
          `Exported at ${this.params.exportDPI} DPI, ` +
            `${this.params.exportSizeCM}cm (${this.params.exportSizePixels}px)`
        );
      } finally {
        // CRITICAL: Restore ALL original parameters exactly as they were
        this.params.gridSize = originalParams.gridSize;
        this.params.gridMargin = originalParams.gridMargin;
        this.params.canvasSize = originalParams.canvasSize;
        window.currentScaleFactor = originalParams.scaleFactor;

        // Force redraw to restore the view
        redraw();
      }
    };

    this.params.exportCustomSizePackage = () => {
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

      // Store original parameters for export size
      const originalParams = {
        gridSize: this.params.gridSize,
        gridMargin: this.params.gridMargin,
        canvasSize: this.params.canvasSize,
        scaleFactor: window.currentScaleFactor,
      };

      // Get current display density
      const displayDensityFactor = pixelDensity();

      try {
        // Common export parameters calculation
        const viewportMarginRatio =
          originalParams.gridMargin / originalParams.canvasSize;
        const exportMargin = Math.round(
          this.params.exportSizePixels * viewportMarginRatio
        );
        const exportGridSize = this.params.exportSizePixels - exportMargin * 2;

        // Function to perform each export variation
        const performExport = (showGrid, useTransparentBg, suffix) => {
          // Create a new export canvas for this variation
          const exportCanvas = createGraphics(
            this.params.exportSizePixels,
            this.params.exportSizePixels
          );

          // Set pixel density to 1
          exportCanvas.pixelDensity(1);

          // Set parameters for this export
          this.params.showGrid = showGrid;
          window.useTransparentBackground = useTransparentBg;

          // Update parameters for export size
          this.params.canvasSize = this.params.exportSizePixels;
          this.params.gridMargin = exportMargin;
          this.params.gridSize = exportGridSize;
          window.currentScaleFactor = exportGridSize / 500;

          // Apply background
          if (useTransparentBg) {
            exportCanvas.clear();
          } else {
            exportCanvas.background(this.params.backgroundColor);
          }

          // Draw to export canvas
          exportCanvas.push();
          exportCanvas.translate(exportMargin, exportMargin);

          // Draw grid if enabled (behind content)
          if (showGrid && !this.params.gridOnTop) {
            GridSystem.drawToCanvas(exportCanvas);
          }

          // Draw path content
          if (
            this.params.showShape ||
            this.params.showPath ||
            this.params.fillPath
          ) {
            PathRenderer.drawPathToCanvas(exportCanvas);
          }

          // Draw grid on top if needed
          if (showGrid && this.params.gridOnTop) {
            GridSystem.drawToCanvas(exportCanvas);
          }

          exportCanvas.pop();

          // Save with suffix to indicate variation
          saveCanvas(
            exportCanvas,
            dateString +
              `_Atico_Stray_${this.params.exportSizePixels}px_${this.params.exportDPI}dpi_${suffix}`,
            "png"
          );

          // Clean up
          exportCanvas.remove();
        };

        // Export all four variations
        performExport(true, false, "grid_bg"); // Version 1: With grid + background
        performExport(false, false, "nogrid_bg"); // Version 2: No grid + background
        performExport(true, true, "grid_nobg"); // Version 3: With grid + transparent
        performExport(false, true, "nogrid_nobg"); // Version 4: No grid + transparent

        console.log(
          `Exported package at ${this.params.exportDPI} DPI, ` +
            `${this.params.exportSizeCM}cm (${this.params.exportSizePixels}px)`
        );
      } finally {
        // Restore all original parameters
        this.params.gridSize = originalParams.gridSize;
        this.params.gridMargin = originalParams.gridMargin;
        this.params.canvasSize = originalParams.canvasSize;
        window.currentScaleFactor = originalParams.scaleFactor;

        // Restore original display settings
        this.params.showGrid = originalShowGrid;
        this.params.backgroundColor = originalBgColor;
        window.useTransparentBackground = originalUseTransparent;

        // Force redraw to restore the view
        redraw();
      }
    };
  },

  resetToDefaults() {
    // Reset all parameters to defaults
    for (const key in DefaultParams) {
      if (
        this.params.hasOwnProperty(key) &&
        typeof DefaultParams[key] !== "function"
      ) {
        this.params[key] = DefaultParams[key];
      }
    }

    // Update GUI and regenerate path
    UIManager.updateAllControllers();
    PathGenerator.generatePath();
  },

  applyStyle(style) {
    // Store current color values before resetting
    const colorSettings = {};

    // List of all color-related properties to preserve
    const colorProps = [
      "backgroundColor",
      "gridColor",
      "shapeStrokeColor",
      "pathStrokeColor",
      "pathFillColor",
      "shapeFillColor",
      "shapeFillColor2",
      "shapeFillColor3",
    ];

    // Save current color values
    colorProps.forEach((prop) => {
      colorSettings[prop] = this.params[prop];
    });

    // First reset to defaults
    for (const key in DefaultParams) {
      if (
        this.params.hasOwnProperty(key) &&
        typeof DefaultParams[key] !== "function"
      ) {
        this.params[key] = DefaultParams[key];
      }
    }

    // Apply the selected style preset
    if (ShapeStylePresets[style]) {
      // For any color property in the style preset, convert from hex to name if needed
      const styledParams = { ...ShapeStylePresets[style] };

      // Convert any hex colors in the style preset to names for UI display
      colorProps.forEach((prop) => {
        if (styledParams[prop] && styledParams[prop].startsWith("#")) {
          styledParams[prop] =
            ColorPalette.getNameByHex(styledParams[prop]) || styledParams[prop];
        }
      });

      Object.assign(this.params, styledParams);
    }

    // Restore color settings if not specifically defined in the style preset
    colorProps.forEach((prop) => {
      if (
        ShapeStylePresets[style] &&
        !ShapeStylePresets[style].hasOwnProperty(prop)
      ) {
        this.params[prop] = colorSettings[prop];
      }
    });

    // Update UI
    UIManager.updateAllControllers();

    // After UI update, convert color names to hex for drawing
    this.convertNamedColorsToHex();

    // Regenerate path
    PathGenerator.generatePath();
  },

  convertNamedColorsToHex() {
    // List of all color parameters to convert
    const colorProps = [
      "backgroundColor",
      "gridColor",
      "shapeStrokeColor",
      "pathStrokeColor",
      "pathFillColor",
      "shapeFillColor",
      "shapeFillColor2",
      "shapeFillColor3",
    ];

    // Convert each color name to its hex value
    colorProps.forEach((prop) => {
      if (typeof this.params[prop] === "string") {
        const hexValue = ColorPalette.getHexByName(this.params[prop]);
        // Only update the actual parameter used for drawing
        this.params[prop] = hexValue;
      }
    });
  },

  getScaledParam(paramName) {
    // Parameters that should scale with grid size
    const scalingParams = [
      "gridStrokeWeight",
      "pathStrokeWeight",
      "pathShapeStrokeWeight",
      "gridBlur",
      "shapeBlur",
      "pathBlur",
      "shapeCornerRadius",
      "pathCornerRadius",
      "positionNoise",
      "pathShapeSpacing",
      "gridPadding",
    ];

    // If this is a parameter that should scale, apply the scale factor
    if (scalingParams.includes(paramName)) {
      return this.params[paramName] * Utils.getGridScaleFactor();
    }

    // For non-scaling parameters, return the original value
    return this.params[paramName];
  },

  getScaledParams() {
    const scaledParams = {};

    // Copy all parameters
    for (const key in this.params) {
      scaledParams[key] = this.params[key];
    }

    // Apply scaling to specific parameters
    const scaleFactor = Utils.getGridScaleFactor();

    // Visual styling parameters
    scaledParams.gridStrokeWeight *= scaleFactor;
    scaledParams.pathStrokeWeight *= scaleFactor;
    scaledParams.pathShapeStrokeWeight *= scaleFactor;
    scaledParams.gridBlur *= scaleFactor;
    scaledParams.shapeBlur *= scaleFactor;
    scaledParams.pathBlur *= scaleFactor;

    // Shape details
    scaledParams.shapeCornerRadius *= scaleFactor;
    scaledParams.pathCornerRadius *= scaleFactor;

    // Spacing and noise parameters
    scaledParams.positionNoise *= scaleFactor;
    scaledParams.pathShapeSpacing *= scaleFactor;

    // Grid parameters
    scaledParams.gridPadding *= scaleFactor;

    return scaledParams;
  },
};

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
    const scaleFactor = window.currentScaleFactor;

    // Calculate scaled padding consistently
    const scaledGridPadding = ParamsManager.params.gridPadding * scaleFactor;

    if (ParamsManager.params.gridBlur * scaleFactor > 0) {
      push();
      drawingContext.filter = `blur(${
        ParamsManager.params.gridBlur * scaleFactor
      }px)`;
    }

    stroke(ParamsManager.params.gridColor);
    strokeWeight(ParamsManager.params.gridStrokeWeight * scaleFactor);
    noFill();

    const { cellWidth, cellHeight } = Utils.getCellDimensions();

    // Draw the grid lines
    for (let i = 0; i <= ParamsManager.params.gridHeight; i++) {
      line(0, i * cellHeight, ParamsManager.params.gridSize, i * cellHeight);
    }

    for (let j = 0; j <= ParamsManager.params.gridWidth; j++) {
      line(j * cellWidth, 0, j * cellWidth, ParamsManager.params.gridSize);
    }

    // Draw padding boundary if visible
    if (
      ParamsManager.params.gridPadding > 0 &&
      ParamsManager.params.showPadding
    ) {
      let paddingColor = color(ParamsManager.params.gridColor);
      paddingColor.setAlpha(100); // Semi-transparent
      stroke(paddingColor);
      strokeWeight(ParamsManager.params.gridStrokeWeight * scaleFactor * 0.5);

      // Draw outer padding boundary using scaled padding
      rect(
        -scaledGridPadding,
        -scaledGridPadding,
        ParamsManager.params.gridSize + scaledGridPadding * 2,
        ParamsManager.params.gridSize + scaledGridPadding * 2
      );
    }

    if (ParamsManager.params.gridBlur * scaleFactor > 0) {
      drawingContext.filter = "none";
      pop();
    }
  },

  // Draw to a specific canvas (for export)
  drawToCanvas(targetCanvas) {
    const scaleFactor = window.currentScaleFactor;

    // Calculate scaled padding consistently
    const scaledGridPadding = ParamsManager.params.gridPadding * scaleFactor;

    if (ParamsManager.params.gridBlur * scaleFactor > 0) {
      targetCanvas.push();
      targetCanvas.drawingContext.filter = `blur(${
        ParamsManager.params.gridBlur * scaleFactor
      }px)`;
    }

    targetCanvas.stroke(ParamsManager.params.gridColor);
    targetCanvas.strokeWeight(
      ParamsManager.params.gridStrokeWeight * scaleFactor
    );
    targetCanvas.noFill();

    const { cellWidth, cellHeight } = Utils.getCellDimensions();

    // Draw the grid lines
    for (let i = 0; i <= ParamsManager.params.gridHeight; i++) {
      targetCanvas.line(
        0,
        i * cellHeight,
        ParamsManager.params.gridSize,
        i * cellHeight
      );
    }

    for (let j = 0; j <= ParamsManager.params.gridWidth; j++) {
      targetCanvas.line(
        j * cellWidth,
        0,
        j * cellWidth,
        ParamsManager.params.gridSize
      );
    }

    // Draw padding boundary if visible
    if (
      ParamsManager.params.gridPadding > 0 &&
      ParamsManager.params.showPadding
    ) {
      let paddingColor = targetCanvas.color(ParamsManager.params.gridColor);
      paddingColor.setAlpha(100); // Semi-transparent
      targetCanvas.stroke(paddingColor);
      targetCanvas.strokeWeight(
        ParamsManager.params.gridStrokeWeight * scaleFactor * 0.5
      );

      // Draw outer padding boundary using scaled padding
      targetCanvas.rect(
        -scaledGridPadding,
        -scaledGridPadding,
        ParamsManager.params.gridSize + scaledGridPadding * 2,
        ParamsManager.params.gridSize + scaledGridPadding * 2
      );
    }

    if (ParamsManager.params.gridBlur * scaleFactor > 0) {
      targetCanvas.drawingContext.filter = "none";
      targetCanvas.pop();
    }
  },
};

// UI Manager module
const UIManager = {
  gui: null,
  folders: {
    general: null,
    export: null,
    grid: null,
    shape: null,
    path: null,
    color: null,
  },

  setupGUI() {
    this.gui = new dat.GUI();
    this.gui.width = 400;

    this.setupGeneralFolder();
    this.setupExportFolder();
    this.setupGridFolder();
    this.setupShapeFolder();
    this.setupPathFolder();
    this.setupColorFolder();

    // Open all folders
    for (let key in this.folders) {
      this.folders[key].open();
    }

    // Keep Grid, Shape and Path folders closed
    this.folders.grid.close();
    this.folders.shape.close();
    this.folders.path.close();

    // Convert color names to hex values for all color parameters after UI setup
    ParamsManager.convertNamedColorsToHex();
  },

  setupGeneralFolder() {
    this.folders.general = this.gui.addFolder("General");

    this.folders.general
      .add(ParamsManager.params, "regeneratePath")
      .name("Regenerate (R)");
    this.folders.general
      .add(ParamsManager.params, "exportCustomSize")
      .name("Save (S)");
    this.folders.general
      .add(ParamsManager.params, "exportCustomSizePackage")
      .name("Save (package) (E)");

    this.folders.general
      .add(ParamsManager.params, "shapeStyle", Object.keys(ShapeStylePresets))
      .name("Shape Style")
      .onChange((value) => ParamsManager.applyStyle(value));
  },

  setupExportFolder() {
    this.folders.export = this.gui.addFolder("Export Settings");

    // DPI selector
    this.folders.export
      .add(ParamsManager.params, "exportDPI", [72, 150, 300, 600])
      .name("Export DPI")
      .onChange(() => {
        // Update pixel size when DPI changes
        this.updateExportSizePixels();
      });

    // Size in centimeters
    this.folders.export
      .add(ParamsManager.params, "exportSizeCM", 1, 100)
      .name("Size (cm)")
      .onChange(() => {
        // Update pixel size when cm size changes
        this.updateExportSizePixels();
      });

    // Size in pixels
    this.folders.export
      .add(ParamsManager.params, "exportSizePixels", 100, 10000)
      .step(1)
      .name("Size (px)")
      .onChange(() => {
        // Update cm size when pixel size changes
        this.updateExportSizeCM();
      });
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
      .add(ParamsManager.params, "gridStrokeWeight", 0.1, 5)
      .name("Grid Stroke Weight");
    this.folders.grid
      .add(ParamsManager.params, "gridBlur", 0, 20)
      .name("Grid Blur");
    this.folders.grid
      .add(ParamsManager.params, "gridMargin", 0, 300)
      .name("Margin")
      .onChange(() => redraw());
    this.folders.grid
      .add(ParamsManager.params, "gridPadding", 0, 200)
      .name("Padding")
      .onChange(() => redraw());
    this.folders.grid
      .add(ParamsManager.params, "showPadding")
      .name("Show Padding")
      .onChange(() => redraw());
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
        if (value === true) {
          // For boolean union, ensure minimum spacing as percentage of grid size
          // Use 2% of grid size as minimum
          const minSpacingPercentage = 0.02;
          const minSpacing =
            ParamsManager.params.gridSize * minSpacingPercentage;

          // Set raw parameter value (not scaled)
          if (ParamsManager.params.pathShapeSpacing < minSpacing) {
            ParamsManager.params.pathShapeSpacing = minSpacing;

            // Update spacing controller
            for (let controller of this.folders.path.__controllers) {
              if (controller.property === "pathShapeSpacing") {
                controller.updateDisplay();
                break;
              }
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
      .add(ParamsManager.params, "ellipseResolution", 8, 64, 1)
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

    // Track original color names for UI display
    ParamsManager.colorNames = {};

    // For each color parameter, create an entry in colorNames
    const colorProps = [
      "backgroundColor",
      "gridColor",
      "shapeStrokeColor",
      "pathStrokeColor",
      "pathFillColor",
      "shapeFillColor",
      "shapeFillColor2",
      "shapeFillColor3",
    ];

    // Initialize color names from default params
    colorProps.forEach((prop) => {
      ParamsManager.colorNames[prop] = ParamsManager.params[prop];
    });

    // Background color dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames, // Use colorNames object for UI display
        "backgroundColor",
        ColorPalette.getBackgroundColorNames()
      )
      .name("Background Color")
      .onChange((value) => {
        // Update both name and hex
        ParamsManager.colorNames.backgroundColor = value;
        ParamsManager.params.backgroundColor = ColorPalette.getHexByName(value);
      });

    // Grid color dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "gridColor",
        ColorPalette.getMainColorNames()
      )
      .name("Grid Color")
      .onChange((value) => {
        ParamsManager.colorNames.gridColor = value;
        ParamsManager.params.gridColor = ColorPalette.getHexByName(value);
      });

    // Shape stroke color dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "shapeStrokeColor",
        ColorPalette.getMainColorNames()
      )
      .name("Shape Stroke Color")
      .onChange((value) => {
        ParamsManager.colorNames.shapeStrokeColor = value;
        ParamsManager.params.shapeStrokeColor =
          ColorPalette.getHexByName(value);
      });

    // Path stroke color dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "pathStrokeColor",
        ColorPalette.getMainColorNames()
      )
      .name("Path Stroke Color")
      .onChange((value) => {
        ParamsManager.colorNames.pathStrokeColor = value;
        ParamsManager.params.pathStrokeColor = ColorPalette.getHexByName(value);
      });

    // Path fill color dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "pathFillColor",
        ColorPalette.getMainColorNames()
      )
      .name("Path Fill Color")
      .onChange((value) => {
        ParamsManager.colorNames.pathFillColor = value;
        ParamsManager.params.pathFillColor = ColorPalette.getHexByName(value);
      });

    // Show shape fill toggle
    this.folders.color
      .add(ParamsManager.params, "showFill")
      .name("Show Shape Fill");

    // Shape transparency slider
    this.folders.color
      .add(ParamsManager.params, "shapeAlpha", 0, 1)
      .step(0.01)
      .name("Shape Transparency");

    // Gradient type dropdown
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

    // Gradient colors count
    this.folders.color
      .add(ParamsManager.params, "gradientColors", ["2", "3"])
      .name("Gradient Colors");

    // Shape fill color 1 dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "shapeFillColor",
        ColorPalette.getMainColorNames()
      )
      .name("Shape Fill Color 1")
      .onChange((value) => {
        ParamsManager.colorNames.shapeFillColor = value;
        ParamsManager.params.shapeFillColor = ColorPalette.getHexByName(value);
      });

    // Shape fill color 2 dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "shapeFillColor2",
        ColorPalette.getMainColorNames()
      )
      .name("Shape Fill Color 2")
      .onChange((value) => {
        ParamsManager.colorNames.shapeFillColor2 = value;
        ParamsManager.params.shapeFillColor2 = ColorPalette.getHexByName(value);
      });

    // Shape fill color 3 dropdown
    this.folders.color
      .add(
        ParamsManager.colorNames,
        "shapeFillColor3",
        ColorPalette.getMainColorNames()
      )
      .name("Shape Fill Color 3")
      .onChange((value) => {
        ParamsManager.colorNames.shapeFillColor3 = value;
        ParamsManager.params.shapeFillColor3 = ColorPalette.getHexByName(value);
      });
  },

  updateAllControllers() {
    // Update all controllers to reflect current parameter values
    for (let folder in this.gui.__folders) {
      for (let controller of this.gui.__folders[folder].__controllers) {
        controller.updateDisplay();
      }
    }
  },

  // Helper method to update pixel size based on cm and DPI
  updateExportSizePixels() {
    // Calculate pixels from cm: cm * DPI / 2.54 (cm per inch)
    const newSizePixels = Math.round(
      (ParamsManager.params.exportSizeCM * ParamsManager.params.exportDPI) /
        2.54
    );

    // Update the parameter
    ParamsManager.params.exportSizePixels = newSizePixels;

    // Update the controller display
    for (let controller of this.folders.export.__controllers) {
      if (controller.property === "exportSizePixels") {
        controller.updateDisplay();
        break;
      }
    }
  },

  // Helper method to update cm size based on pixels and DPI
  updateExportSizeCM() {
    // Calculate cm from pixels: pixels * 2.54 / DPI
    const newSizeCM =
      (ParamsManager.params.exportSizePixels * 2.54) /
      ParamsManager.params.exportDPI;

    // Update the parameter (round to 2 decimal places)
    ParamsManager.params.exportSizeCM = Math.round(newSizeCM * 100) / 100;

    // Update the controller display
    for (let controller of this.folders.export.__controllers) {
      if (controller.property === "exportSizeCM") {
        controller.updateDisplay();
        break;
      }
    }
  },
};

// Color Palette module
const ColorPalette = {
  // Main palette colors
  mainColors: [
    { name: "Yellow1", hex: "#a69f19" },
    { name: "Yellow2", hex: "#f4ef9b" },
    { name: "Yellow3", hex: "#fbf9db" },
    { name: "Green1", hex: "#284325" },
    { name: "Green2", hex: "#6fa369" },
    { name: "Green3", hex: "#d9e8d9" },
    { name: "Pink1", hex: "#731a4d" },
    { name: "Pink2", hex: "#dd7cb1" },
    { name: "Pink3", hex: "#f4d1e5" },
    { name: "Purple1", hex: "#53396a" },
    { name: "Purple2", hex: "#ab8fc3" },
    { name: "Purple3", hex: "#e1d8e9" },
    { name: "Orange1", hex: "#6c150f" },
    { name: "Orange2", hex: "#e74310" },
    { name: "Orange3", hex: "#F9B99F" },
    { name: "Blue1", hex: "#1c3966" },
    { name: "Blue2", hex: "#195da9" },
    { name: "Blue3", hex: "#97bde6" },
  ],

  // Background colors
  backgroundColors: [
    { name: "White", hex: "#fbfcf5" },
    { name: "Grey", hex: "#292e34" },
  ],

  // Get array of all color names for dropdown
  getMainColorNames() {
    return this.mainColors.map((color) => color.name);
  },

  // Get array of all background color names for dropdown
  getBackgroundColorNames() {
    return [
      ...this.getMainColorNames(),
      ...this.backgroundColors.map((color) => color.name),
    ];
  },

  // Get hex code by color name
  getHexByName(name) {
    // Search in main colors first
    const mainColor = this.mainColors.find((color) => color.name === name);
    if (mainColor) return mainColor.hex;

    // Then search in background colors
    const bgColor = this.backgroundColors.find((color) => color.name === name);
    if (bgColor) return bgColor.hex;

    // If not found, return the input (might be a hex value)
    return name;
  },

  // Get color name by hex code
  getNameByHex(hex) {
    // Normalize hex to lowercase
    const normalizedHex = hex.toLowerCase();

    // Search in main colors first
    const mainColor = this.mainColors.find(
      (color) => color.hex.toLowerCase() === normalizedHex
    );
    if (mainColor) return mainColor.name;

    // Then search in background colors
    const bgColor = this.backgroundColors.find(
      (color) => color.hex.toLowerCase() === normalizedHex
    );
    if (bgColor) return bgColor.name;

    // If not found, return the hex
    return hex;
  },
};

function setup() {
  createCanvas(
    ParamsManager.params.canvasSize,
    ParamsManager.params.canvasSize
  );

  ParamsManager.init();

  // Explicitly resize the canvas after initialization to ensure correct size
  resizeCanvas(
    ParamsManager.params.canvasSize,
    ParamsManager.params.canvasSize
  );

  // Initialize transparent background flag
  window.useTransparentBackground = false;

  // Initialize polybool if available
  if (typeof PolyBool !== "undefined") {
    polybool = PolyBool;
  }

  UIManager.setupGUI();

  // Convert color names to hex values for all color parameters
  ParamsManager.convertNamedColorsToHex();

  PathGenerator.generatePath();
}

function draw() {
  // Calculate and set the current scale factor first thing
  window.currentScaleFactor = Utils.getGridScaleFactor();

  Renderer.draw();
}

function keyPressed() {
  // Regenerate path with 'r' key
  if (key === "r" || key === "R") {
    ParamsManager.params.regeneratePath();
    return false;
  }

  // Save image with 's' key
  if (key === "s" || key === "S") {
    ParamsManager.params.exportCustomSize();
    return false;
  }

  // Export package versions with 'e' key
  if (key === "e" || key === "E") {
    ParamsManager.params.exportCustomSizePackage();
    return false;
  }

  if (key === "d" || key === "D") {
    window.showScalingDebug = !window.showScalingDebug;
    return false;
  }

  return true;
}

// Main Renderer module
const Renderer = {
  draw() {
    // Calculate current scale factor
    window.currentScaleFactor = this.calculateScaleFactor();

    // Calculate grid position in the canvas
    const gridPosition = this.calculateGridPosition();

    // Handle transparent background
    if (window.useTransparentBackground) {
      clear();
    } else {
      background(ParamsManager.params.backgroundColor);
    }

    // Translate to grid position
    push();
    translate(gridPosition.x, gridPosition.y);

    // Draw grid if needed (behind content)
    if (ParamsManager.params.showGrid && !ParamsManager.params.gridOnTop) {
      GridSystem.draw();
    }

    // Draw path content
    if (
      ParamsManager.params.showShape ||
      ParamsManager.params.showPath ||
      ParamsManager.params.fillPath
    ) {
      PathRenderer.drawPath();
    }

    // Draw grid on top if needed
    if (ParamsManager.params.showGrid && ParamsManager.params.gridOnTop) {
      GridSystem.draw();
    }

    pop();

    // Draw debug information if needed
    if (window.showScalingDebug) {
      Utils.drawScalingDebug();
    }
  },

  calculateGridPosition() {
    // Get canvas size and margin
    const { canvasSize, gridMargin } = ParamsManager.params;

    // Calculate a scaled margin based on the ratio of current canvas size to default canvas size
    const marginScaleFactor = canvasSize / DefaultParams.canvasSize;
    const scaledMargin = gridMargin * marginScaleFactor;

    // Calculate available space for grid after scaled margin
    const availableSpace = canvasSize - scaledMargin * 2;

    // Update the grid size based on available space
    ParamsManager.params.gridSize = availableSpace;

    // Center the grid in the canvas with scaled margin
    return {
      x: scaledMargin,
      y: scaledMargin,
    };
  },

  calculateScaleFactor() {
    // Store the current scale factor directly in a global property that all modules can access
    window.currentScaleFactor = ParamsManager.params.gridSize / 500;
    return window.currentScaleFactor;
  },

  // Add this before drawing anything to ensure the scale factor is current
  updateCurrentScale() {
    this.calculateScaleFactor();

    // Update scale-dependent values directly
    const scaleFactor = window.currentScaleFactor;

    // Apply scale to critical parameters that affect visual appearance
    this.scaledValues = {
      gridPadding: ParamsManager.params.gridPadding * scaleFactor,
      pathShapeStrokeWeight:
        ParamsManager.params.pathShapeStrokeWeight * scaleFactor,
      shapeCornerRadius: ParamsManager.params.shapeCornerRadius * scaleFactor,
      pathShapeSpacing: ParamsManager.params.pathShapeSpacing * scaleFactor,
      positionNoise: ParamsManager.params.positionNoise * scaleFactor,
      pathStrokeWeight: ParamsManager.params.pathStrokeWeight * scaleFactor,
      shapeBlur: ParamsManager.params.shapeBlur * scaleFactor,
      pathBlur: ParamsManager.params.pathBlur * scaleFactor,
      gridBlur: ParamsManager.params.gridBlur * scaleFactor,
      pathCornerRadius: ParamsManager.params.pathCornerRadius * scaleFactor,
      gridStrokeWeight: ParamsManager.params.gridStrokeWeight * scaleFactor,
    };

    return this.scaledValues;
  },
};

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
    const numSegments = ParamsManager.params.closedLoop
      ? pathCells.length
      : pathCells.length - 1;
    const { cellWidth, cellHeight } = Utils.getCellDimensions();

    // Skip drawing if both stroke and fill are disabled
    if (!ParamsManager.params.showPath && !ParamsManager.params.fillPath) {
      return;
    }

    // Use Utils.withContext for cleaner context management with proper scaling
    Utils.withContext(
      drawingContext,
      {
        filter:
          ParamsManager.getScaledParam("pathBlur") > 0
            ? `blur(${ParamsManager.getScaledParam("pathBlur")}px)`
            : null,
        strokeStyle: ParamsManager.params.showPath
          ? ParamsManager.params.pathStrokeColor
          : null,
        lineWidth: ParamsManager.getScaledParam("pathStrokeWeight"),
      },
      (ctx) => {
        // Set stroke cap and join
        if (ParamsManager.params.showPath) {
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

        // Draw path with appropriate method
        if (
          ParamsManager.getScaledParam("pathCornerRadius") > 0 &&
          ParamsManager.params.pathType !== "curved"
        ) {
          this.drawPathWithRoundedCorners(cellWidth, cellHeight);
        } else if (ParamsManager.params.pathType === "curved") {
          this.drawCurvedPath(cellWidth, cellHeight);
        } else {
          // Standard straight path
          beginShape();
          for (let i = 0; i < pathCells.length; i++) {
            let currentCell = pathCells[i];
            let x = currentCell.j * cellWidth + cellWidth / 2;
            let y = currentCell.i * cellHeight + cellHeight / 2;
            vertex(x, y);
          }
          endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
        }
      }
    );
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
        ParamsManager.getScaledParam("pathCornerRadius"),
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
      const { cellWidth, cellHeight } = Utils.getCellDimensions();
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
      const { cellWidth, cellHeight } = Utils.getCellDimensions();
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

    // Enforce minimum spacing - using scaled pathShapeSpacing for comparison
    const minSpacing = 10 * Utils.getGridScaleFactor();
    if (ParamsManager.getScaledParam("pathShapeSpacing") < minSpacing) {
      ParamsManager.params.pathShapeSpacing =
        minSpacing / Utils.getGridScaleFactor();

      // Update UI if available
      for (let controller of UIManager.folders.path.__controllers) {
        if (controller.property === "pathShapeSpacing") {
          controller.updateDisplay();
          break;
        }
      }
    }

    let shapes = this.collectAllShapes();
    if (shapes.length === 0) return;

    // Use BooleanOperations for union and drawing
    const unionResult = BooleanOperations.unionShapes(shapes);
    if (unionResult) {
      BooleanOperations.drawUnifiedShape(unionResult);
    }
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
      const { cellWidth, cellHeight } = Utils.getCellDimensions();
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
      const { cellWidth, cellHeight } = Utils.getCellDimensions();
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
    // Get parameters
    const { gridSize, gridWidth, gridHeight, alignShapesToGrid, pathType } =
      ParamsManager.params;

    // Calculate cell dimensions
    const cellWidth = gridSize / gridWidth;
    const cellHeight = gridSize / gridHeight;

    // Important: Get pathShapeSpacing directly scaled with currentScaleFactor
    const scaledPathShapeSpacing =
      ParamsManager.params.pathShapeSpacing * window.currentScaleFactor;

    // Calculate distance between points
    const distance = dist(x1, y1, x2, y2);

    // Initialize shapes array
    let shapes = [];

    if (alignShapesToGrid) {
      // Grid-aligned shapes (unchanged)
      const gridCells = PathGenerator.getIntersectingGridCells(x1, y1, x2, y2);

      for (const cell of gridCells) {
        const cellCenterX = cell.j * cellWidth + cellWidth / 2;
        const cellCenterY = cell.i * cellHeight + cellHeight / 2;

        const distFromStart = dist(x1, y1, cellCenterX, cellCenterY);
        const segmentLength = dist(x1, y1, x2, y2);
        const localProgress = constrain(distFromStart / segmentLength, 0, 1);
        const currentLength = accumulatedLength + segmentLength * localProgress;
        const progress = currentLength / totalLength;

        const shape = BooleanOperations.createShapePolygon(
          cellCenterX,
          cellCenterY,
          cellWidth,
          cellHeight,
          {
            cell: currentCell,
            progress,
            totalSegments,
            segmentIndex,
            stepIndex: cell.i * gridWidth + cell.j,
          }
        );

        if (shape) shapes.push(shape);
      }
    } else {
      // Path-based shape placement
      if (pathType === "curved") {
        // Handle curved path
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const perpX = -(y2 - y1) * ParamsManager.params.curveAmount;
        const perpY = (x2 - x1) * ParamsManager.params.curveAmount;

        // Apply constraints if needed
        let adjustedPerpX = perpX;
        let adjustedPerpY = perpY;

        if (ParamsManager.params.constrainToGrid) {
          const safeControlPoint = this.findSafeControlPoint(
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
          );
          adjustedPerpX = safeControlPoint.perpX;
          adjustedPerpY = safeControlPoint.perpY;
        }

        // Important: Use scaled spacing consistently
        // Double the steps for smoother curve approximation
        const steps = Math.max(
          1,
          Math.floor(distance / scaledPathShapeSpacing) * 2
        );

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          let x = bezierPoint(
            x1,
            midX + adjustedPerpX,
            midX + adjustedPerpX,
            x2,
            t
          );
          let y = bezierPoint(
            y1,
            midY + adjustedPerpY,
            midY + adjustedPerpY,
            y2,
            t
          );

          // Calculate progress along path for color
          const segmentLength = distance; // Approximation
          const currentLength = accumulatedLength + segmentLength * t;
          const progress = currentLength / totalLength;

          // Create and add shape
          const shape = BooleanOperations.createShapePolygon(
            x,
            y,
            cellWidth,
            cellHeight,
            {
              cell: currentCell,
              progress,
              totalSegments,
              segmentIndex,
              stepIndex: i,
            }
          );

          if (shape) shapes.push(shape);
        }
      } else {
        // Handle straight path
        // Important: Use scaled spacing consistently
        const numShapes = Math.max(
          1,
          Math.floor(distance / scaledPathShapeSpacing)
        );

        for (let i = 0; i <= numShapes; i++) {
          const t = i / numShapes;
          const x = lerp(x1, x2, t);
          const y = lerp(y1, y2, t);

          // Calculate progress for color
          const currentLength = accumulatedLength + distance * t;
          const progress = currentLength / totalLength;

          // Create and add shape
          const shape = BooleanOperations.createShapePolygon(
            x,
            y,
            cellWidth,
            cellHeight,
            {
              cell: currentCell,
              progress,
              totalSegments,
              segmentIndex,
              stepIndex: i,
            }
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
    // Get scaled path shape spacing consistently
    const scaledSpacing =
      ParamsManager.params.pathShapeSpacing * window.currentScaleFactor;

    // Calculate distance and number of shapes
    let distance = dist(x1, y1, x2, y2);
    let numShapes = floor(distance / scaledSpacing);
    numShapes = max(1, numShapes);

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
        floor(
          dist(x1, y1, x2, y2) /
            ParamsManager.getScaledParam("pathShapeSpacing")
        ) * 2;
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

        ShapeRenderer.drawShapeAtPosition(
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
      let numShapes = floor(
        distance / ParamsManager.getScaledParam("pathShapeSpacing")
      );
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

        ShapeRenderer.drawShapeAtPosition(
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
      let numShapes = floor(
        distance / ParamsManager.getScaledParam("pathShapeSpacing")
      );
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

        ShapeRenderer.drawShapeAtPosition(
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
      let gridCells = PathGenerator.getIntersectingGridCells(x1, y1, x2, y2);

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

        ShapeRenderer.drawShapeAtPosition(
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

  // Draw to a specific canvas (for export)
  drawPathToCanvas(targetCanvas) {
    // Draw the path line if either stroke or fill is enabled
    if (ParamsManager.params.showPath || ParamsManager.params.fillPath) {
      this.drawPathLineToCanvas(targetCanvas);
    }

    // Draw the shapes if enabled
    if (ParamsManager.params.showShape) {
      if (ParamsManager.params.booleanUnion && polybool) {
        this.drawBooleanUnionPathToCanvas(targetCanvas);
      } else {
        this.drawRegularPathToCanvas(targetCanvas);
      }
    }
  },

  drawPathLineToCanvas(targetCanvas) {
    const numSegments = ParamsManager.params.closedLoop
      ? pathCells.length
      : pathCells.length - 1;
    const { cellWidth, cellHeight } = Utils.getCellDimensions();

    // Skip drawing if both stroke and fill are disabled
    if (!ParamsManager.params.showPath && !ParamsManager.params.fillPath) {
      return;
    }

    // Apply blur if needed
    if (ParamsManager.getScaledParam("pathBlur") > 0) {
      targetCanvas.push();
      targetCanvas.drawingContext.filter = `blur(${ParamsManager.getScaledParam(
        "pathBlur"
      )}px)`;
    }

    // Set stroke properties
    if (ParamsManager.params.showPath) {
      targetCanvas.stroke(ParamsManager.params.pathStrokeColor);
      targetCanvas.strokeWeight(
        ParamsManager.getScaledParam("pathStrokeWeight")
      );

      // Set stroke cap and join
      switch (ParamsManager.params.pathStrokeCap) {
        case "round":
          targetCanvas.strokeCap(ROUND);
          break;
        case "project":
          targetCanvas.strokeCap(PROJECT);
          break;
        case "square":
        default:
          targetCanvas.strokeCap(SQUARE);
          break;
      }

      switch (ParamsManager.params.pathStrokeJoin) {
        case "round":
          targetCanvas.strokeJoin(ROUND);
          break;
        case "bevel":
          targetCanvas.strokeJoin(BEVEL);
          break;
        case "miter":
        default:
          targetCanvas.strokeJoin(MITER);
          break;
      }
    } else {
      targetCanvas.noStroke();
    }

    // Set fill
    if (ParamsManager.params.fillPath) {
      targetCanvas.fill(ParamsManager.params.pathFillColor);
    } else {
      targetCanvas.noFill();
    }

    // Draw path based on type
    if (
      ParamsManager.getScaledParam("pathCornerRadius") > 0 &&
      ParamsManager.params.pathType !== "curved"
    ) {
      this.drawPathWithRoundedCornersToCanvas(
        targetCanvas,
        cellWidth,
        cellHeight
      );
    } else if (ParamsManager.params.pathType === "curved") {
      this.drawCurvedPathToCanvas(targetCanvas, cellWidth, cellHeight);
    } else {
      // Standard straight path
      targetCanvas.beginShape();
      for (let i = 0; i < pathCells.length; i++) {
        let currentCell = pathCells[i];
        let x = currentCell.j * cellWidth + cellWidth / 2;
        let y = currentCell.i * cellHeight + cellHeight / 2;
        targetCanvas.vertex(x, y);
      }
      targetCanvas.endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
    }

    // Reset blur filter if applied
    if (ParamsManager.getScaledParam("pathBlur") > 0) {
      targetCanvas.drawingContext.filter = "none";
      targetCanvas.pop();
    }
  },

  drawCurvedPathToCanvas(targetCanvas, cellWidth, cellHeight) {
    targetCanvas.beginShape();

    for (let i = 0; i < pathCells.length; i++) {
      let currentCell = pathCells[i];
      let x = currentCell.j * cellWidth + cellWidth / 2;
      let y = currentCell.i * cellHeight + cellHeight / 2;

      // For the first point, just move to it
      if (i === 0) {
        targetCanvas.vertex(x, y);
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
      targetCanvas.bezierVertex(
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

      targetCanvas.bezierVertex(
        midX + perpX,
        midY + perpY,
        midX + perpX,
        midY + perpY,
        firstX,
        firstY
      );
    }

    targetCanvas.endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
  },

  drawPathWithRoundedCornersToCanvas(targetCanvas, cellWidth, cellHeight) {
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

    targetCanvas.beginShape();

    // Start at the first point
    targetCanvas.vertex(points[0].x, points[0].y);

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
        targetCanvas.vertex(p2.x, p2.y);
        continue;
      }

      let n1 = { x: v1.x / len1, y: v1.y / len1 };
      let n2 = { x: v2.x / len2, y: v2.y / len2 };

      // Calculate corner radius (constrained by segment lengths)
      let radius = min(
        ParamsManager.getScaledParam("pathCornerRadius"),
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
      targetCanvas.vertex(beforeCorner.x, beforeCorner.y);

      // Draw quadratic curve for the corner
      targetCanvas.quadraticVertex(p2.x, p2.y, afterCorner.x, afterCorner.y);
    }

    // End at the last point
    if (points.length > 1) {
      targetCanvas.vertex(
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }

    targetCanvas.endShape(ParamsManager.params.closedLoop ? CLOSE : OPEN);
  },

  drawBooleanUnionPathToCanvas(targetCanvas) {
    if (!polybool) {
      console.warn(
        'PolyBool library not loaded. Add <script src="https://cdn.jsdelivr.net/npm/polybooljs@1.2.0/dist/polybool.min.js"></script> to your HTML'
      );
      this.drawRegularPathToCanvas(targetCanvas);
      return;
    }

    // Enforce minimum spacing - using scaled pathShapeSpacing for comparison
    const minSpacing = 10 * Utils.getGridScaleFactor();
    if (ParamsManager.getScaledParam("pathShapeSpacing") < minSpacing) {
      ParamsManager.params.pathShapeSpacing =
        minSpacing / Utils.getGridScaleFactor();
    }

    let shapes = this.collectAllShapes();
    if (shapes.length === 0) return;

    // Use BooleanOperations for union
    const unionResult = BooleanOperations.unionShapes(shapes);

    if (unionResult) {
      this.drawUnifiedShapeToCanvas(targetCanvas, unionResult);
    }
  },

  drawUnifiedShapeToCanvas(targetCanvas, unionResult) {
    if (!BooleanOperations.isValidPolygon(unionResult)) return;

    // Filter out degenerate regions
    const validRegions = unionResult.regions.filter(
      (region) => region && region.length >= 3
    );

    if (validRegions.length === 0) return;

    // Calculate bounds once for all operations
    const bounds = BooleanOperations.getUnionBounds({ regions: validRegions });

    // Direct scaling for blur
    const scaledBlur =
      ParamsManager.params.shapeBlur * window.currentScaleFactor;

    // Special case: inside blur
    if (scaledBlur > 0 && ParamsManager.params.insideBlur) {
      this.drawInsideBlurredUnionToCanvas(targetCanvas, validRegions, bounds);
      return;
    }

    // Apply blur if needed
    if (scaledBlur > 0) {
      targetCanvas.push();
      targetCanvas.drawingContext.filter = `blur(${scaledBlur}px)`;
    }

    // Set appearance with direct scaling
    if (ParamsManager.params.showPathShapeStroke) {
      targetCanvas.stroke(ParamsManager.params.shapeStrokeColor);
      targetCanvas.strokeWeight(
        ParamsManager.params.pathShapeStrokeWeight * window.currentScaleFactor
      );
    } else {
      targetCanvas.noStroke();
    }

    if (!ParamsManager.params.showFill) {
      // Draw stroke-only if requested
      if (ParamsManager.params.showPathShapeStroke) {
        this.drawUnionWithContextToCanvas(
          targetCanvas,
          { regions: validRegions },
          true
        );
      }
    } else {
      // Handle fill types
      if (ParamsManager.params.gradientType === "none") {
        // Solid fill
        const c = color(ParamsManager.params.shapeFillColor);
        c.setAlpha(ParamsManager.params.shapeAlpha * 255);
        targetCanvas.fill(c);
        this.drawUnionWithContextToCanvas(
          targetCanvas,
          { regions: validRegions },
          false
        );
      } else if (ParamsManager.params.gradientType === "length") {
        // Length-based gradient (use middle color for union)
        let fillColor;
        if (ParamsManager.params.gradientColors === "2") {
          fillColor = lerpColor(
            color(ParamsManager.params.shapeFillColor),
            color(ParamsManager.params.shapeFillColor2),
            0.5
          );
        } else {
          fillColor = color(ParamsManager.params.shapeFillColor2);
        }
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        targetCanvas.fill(fillColor);
        this.drawUnionWithContextToCanvas(
          targetCanvas,
          { regions: validRegions },
          false
        );
      } else {
        // Complex gradients
        const gradient = BooleanOperations.createGradientForBounds(
          targetCanvas.drawingContext,
          bounds
        );
        targetCanvas.drawingContext.fillStyle = gradient;
        this.drawUnionWithContextToCanvas(
          targetCanvas,
          { regions: validRegions },
          false
        );
      }
    }

    // Reset filter if blur was applied
    if (scaledBlur > 0) {
      targetCanvas.drawingContext.filter = "none";
      targetCanvas.pop();
    }
  },

  drawUnionWithContextToCanvas(targetCanvas, unionResult, strokeOnly = false) {
    // Scale stroke weight directly
    const scaledStrokeWeight =
      ParamsManager.params.pathShapeStrokeWeight * window.currentScaleFactor;

    if (ParamsManager.params.showPathShapeStroke) {
      targetCanvas.strokeWeight(scaledStrokeWeight);
    }

    // Create a function to draw a polygon with rounded corners
    const drawRoundedPolygon = (canvas, points) => {
      const cornerRadius = ParamsManager.getScaledParam("shapeCornerRadius");

      // Skip if no rounding or very few points
      if (cornerRadius <= 0 || points.length < 3) {
        canvas.beginShape();
        for (const pt of points) {
          if (Array.isArray(pt) && pt.length >= 2) {
            canvas.vertex(pt[0], pt[1]);
          }
        }
        canvas.endShape(CLOSE);
        return;
      }

      // Calculate min edge length to prevent excessive rounding
      let minEdgeLength = Infinity;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        if (!Array.isArray(p1) || !Array.isArray(p2)) continue;

        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const edgeLength = Math.sqrt(dx * dx + dy * dy);
        minEdgeLength = Math.min(minEdgeLength, edgeLength);
      }

      // Constrain radius to 40% of the shortest edge
      const safeRadius = Math.min(cornerRadius, minEdgeLength * 0.4);
      if (safeRadius <= 0) {
        // Fall back to standard polygon if radius is too small
        canvas.beginShape();
        for (const pt of points) {
          if (Array.isArray(pt) && pt.length >= 2) {
            canvas.vertex(pt[0], pt[1]);
          }
        }
        canvas.endShape(CLOSE);
        return;
      }

      // Start the shape
      canvas.beginShape();

      // Process each corner with rounded edges
      for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        const prev = points[(i - 1 + points.length) % points.length];
        const next = points[(i + 1) % points.length];

        if (
          !Array.isArray(prev) ||
          !Array.isArray(curr) ||
          !Array.isArray(next)
        )
          continue;

        // Calculate vectors
        const v1 = [curr[0] - prev[0], curr[1] - prev[1]];
        const v2 = [next[0] - curr[0], next[1] - curr[1]];

        // Calculate lengths
        const len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        const len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

        if (len1 === 0 || len2 === 0) {
          canvas.vertex(curr[0], curr[1]);
          continue;
        }

        // Normalize vectors
        const n1 = [v1[0] / len1, v1[1] / len1];
        const n2 = [v2[0] / len2, v2[1] / len2];

        // Calculate points before and after corner
        const beforeCorner = {
          x: curr[0] - n1[0] * safeRadius,
          y: curr[1] - n1[1] * safeRadius,
        };

        const afterCorner = {
          x: curr[0] + n2[0] * safeRadius,
          y: curr[1] + n2[1] * safeRadius,
        };

        // Draw line to point before corner
        canvas.vertex(beforeCorner.x, beforeCorner.y);

        // Draw quadratic curve for the corner
        canvas.quadraticVertex(curr[0], curr[1], afterCorner.x, afterCorner.y);
      }

      canvas.endShape(CLOSE);
    };

    // Process each region
    for (let region of unionResult.regions) {
      if (!region || region.length < 3) continue;

      if (
        ParamsManager.params.shapeCornerRadius > 0 &&
        ParamsManager.params.shapeType === "rectangle"
      ) {
        // Draw with rounded corners using our custom function
        drawRoundedPolygon(targetCanvas, region);
      } else {
        // Standard polygon drawing
        targetCanvas.beginShape();
        for (const point of region) {
          if (Array.isArray(point) && point.length >= 2) {
            targetCanvas.vertex(point[0], point[1]);
          }
        }
        targetCanvas.endShape(CLOSE);
      }
    }
  },

  drawInsideBlurredUnionToCanvas(targetCanvas, validRegions, bounds) {
    // Add padding to account for blur radius
    const scaledBlur =
      ParamsManager.params.shapeBlur * window.currentScaleFactor;
    const bufferPadding = Math.ceil(scaledBlur * 3);

    // Create temporary canvas with padding for blur
    const tempCanvas = createGraphics(
      bounds.width + bufferPadding * 2,
      bounds.height + bufferPadding * 2
    );

    // Create a second canvas for the mask
    const maskCanvas = createGraphics(
      bounds.width + bufferPadding * 2,
      bounds.height + bufferPadding * 2
    );

    // Configure shape drawing canvas
    if (ParamsManager.params.showPathShapeStroke) {
      tempCanvas.stroke(ParamsManager.params.shapeStrokeColor);
      tempCanvas.strokeWeight(
        ParamsManager.params.pathShapeStrokeWeight * window.currentScaleFactor
      );
    } else {
      tempCanvas.noStroke();
    }

    // Handle fill color
    if (ParamsManager.params.showFill) {
      // Use the primary fill color initially
      let fillColor = color(ParamsManager.params.shapeFillColor);
      fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
      tempCanvas.fill(fillColor);
    } else {
      tempCanvas.noFill();
    }

    // Configure mask canvas - always fill with white
    maskCanvas.noStroke();
    maskCanvas.fill(255);

    // Translate to center shape in the padded canvas
    const translationX = -bounds.minX + bufferPadding;
    const translationY = -bounds.minY + bufferPadding;
    tempCanvas.translate(translationX, translationY);
    maskCanvas.translate(translationX, translationY);

    // Draw all regions to both canvases
    for (let region of validRegions) {
      if (
        ParamsManager.params.shapeCornerRadius > 0 &&
        ParamsManager.params.shapeType === "rectangle"
      ) {
        // Draw with rounded corners
        BooleanOperations.drawRoundedPolygon(tempCanvas, region);
        BooleanOperations.drawRoundedPolygon(maskCanvas, region);
      } else {
        // Draw to main canvas
        tempCanvas.beginShape();
        for (let point of region) {
          if (Array.isArray(point) && point.length >= 2) {
            tempCanvas.vertex(point[0], point[1]);
          }
        }
        tempCanvas.endShape(CLOSE);

        // Draw to mask canvas
        maskCanvas.beginShape();
        for (let point of region) {
          if (Array.isArray(point) && point.length >= 2) {
            maskCanvas.vertex(point[0], point[1]);
          }
        }
        maskCanvas.endShape(CLOSE);
      }
    }

    // Apply blur with proper scaling
    tempCanvas.filter(BLUR, scaledBlur / 2);

    // Get image data from both canvases
    const shapeImg = tempCanvas.get();
    const maskImg = maskCanvas.get();

    // Apply mask
    shapeImg.mask(maskImg);

    // Draw the masked image to the target canvas
    targetCanvas.image(
      shapeImg,
      bounds.minX - bufferPadding,
      bounds.minY - bufferPadding
    );

    // Apply gradient if needed
    if (
      ParamsManager.params.showFill &&
      ParamsManager.params.gradientType !== "none" &&
      ParamsManager.params.gradientType !== "length"
    ) {
      targetCanvas.push();

      // Set composite operation to only affect the shape area
      targetCanvas.drawingContext.globalCompositeOperation = "source-atop";

      // Draw all regions to create a clipping path for the gradient
      targetCanvas.beginShape();
      targetCanvas.noStroke();
      for (let region of validRegions) {
        targetCanvas.beginContour();
        for (let point of region) {
          if (Array.isArray(point) && point.length >= 2) {
            targetCanvas.vertex(point[0], point[1]);
          }
        }
        targetCanvas.endContour();
      }
      targetCanvas.endShape();

      // Create a gradient for the shape
      const gradient = BooleanOperations.createGradientForBounds(
        targetCanvas.drawingContext,
        bounds
      );

      // Apply the gradient
      targetCanvas.drawingContext.save();
      targetCanvas.drawingContext.fillStyle = gradient;

      // Fill the entire bounds area - it will be clipped by the shape
      targetCanvas.rect(bounds.minX, bounds.minY, bounds.width, bounds.height);

      targetCanvas.drawingContext.restore();
      targetCanvas.pop();
    }

    // Clean up
    tempCanvas.remove();
    maskCanvas.remove();
  },

  drawRegularPathToCanvas(targetCanvas) {
    let numSegments = ParamsManager.params.closedLoop
      ? pathCells.length
      : pathCells.length - 1;
    let totalLength = 0;

    // Calculate total path length
    for (let i = 0; i < numSegments; i++) {
      let currentCell = pathCells[i];
      let nextCell = pathCells[(i + 1) % pathCells.length];
      const { cellWidth, cellHeight } = Utils.getCellDimensions();
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
      const { cellWidth, cellHeight } = Utils.getCellDimensions();
      let x1 = currentCell.j * cellWidth + cellWidth / 2;
      let y1 = currentCell.i * cellHeight + cellHeight / 2;
      let x2 = nextCell.j * cellWidth + cellWidth / 2;
      let y2 = nextCell.i * cellHeight + cellHeight / 2;

      this.drawPathSegmentToCanvas(
        targetCanvas,
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

  drawPathSegmentToCanvas(
    targetCanvas,
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
    // Get scaled path shape spacing consistently
    const scaledSpacing =
      ParamsManager.params.pathShapeSpacing * window.currentScaleFactor;

    // Calculate distance and number of shapes
    let distance = dist(x1, y1, x2, y2);
    let numShapes = floor(distance / scaledSpacing);
    numShapes = max(1, numShapes);

    let cellWidth =
      ParamsManager.params.gridSize / ParamsManager.params.gridWidth;
    let cellHeight =
      ParamsManager.params.gridSize / ParamsManager.params.gridHeight;

    if (ParamsManager.params.pathType === "curved") {
      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2;
      let perpX = -(y2 - y1) * ParamsManager.params.curveAmount;
      let perpY = (x2 - x1) * ParamsManager.params.curveAmount;

      if (ParamsManager.params.constrainToGrid) {
        let safeControlPoint = this.findSafeControlPoint(
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
        );
        perpX = safeControlPoint.perpX;
        perpY = safeControlPoint.perpY;
      }

      let steps =
        floor(distance / ParamsManager.getScaledParam("pathShapeSpacing")) * 2;
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

        this.drawShapeAtPositionToCanvas(
          targetCanvas,
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
      // Similar implementation to straight path but with smooth transitions
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

        this.drawShapeAtPositionToCanvas(
          targetCanvas,
          x,
          y,
          cellWidth,
          cellHeight,
          currentCell,
          progress,
          totalSegments,
          segmentIndex,
          i
        );
      }
    } else {
      // Straight path
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

        this.drawShapeAtPositionToCanvas(
          targetCanvas,
          x,
          y,
          cellWidth,
          cellHeight,
          currentCell,
          progress,
          totalSegments,
          segmentIndex,
          i
        );
      }
    }

    if (ParamsManager.params.alignShapesToGrid) {
      // Find all grid cells that the line segment intersects with
      let gridCells = PathGenerator.getIntersectingGridCells(x1, y1, x2, y2);

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

        this.drawShapeAtPositionToCanvas(
          targetCanvas,
          cellCenterX,
          cellCenterY,
          cellWidth,
          cellHeight,
          currentCell,
          progress,
          totalSegments,
          segmentIndex,
          cell.i * ParamsManager.params.gridWidth + cell.j
        );
      }
    }
  },

  drawShapeAtPositionToCanvas(
    targetCanvas,
    x,
    y,
    width,
    height,
    currentCell,
    progress,
    totalSegments,
    segmentIndex,
    stepIndex
  ) {
    const options = {
      cell: currentCell,
      progress: progress,
      totalSegments: totalSegments,
      segmentIndex: segmentIndex,
      stepIndex: stepIndex,
    };

    let scale = ParamsManager.params.shapeSize;

    // Apply size noise
    let sizeNoiseFactor = Utils.getSizeNoise(segmentIndex, stepIndex);
    scale *= sizeNoiseFactor;

    let scaledWidth = width * scale;
    let scaledHeight = height * scale;

    // Check if shape extends beyond padding boundary
    let position = Utils.adjustPositionToBounds(
      x,
      y,
      scaledWidth,
      scaledHeight
    );

    // Apply shape blur if needed
    const scaledBlur =
      ParamsManager.params.shapeBlur * window.currentScaleFactor;
    if (scaledBlur > 0) {
      if (ParamsManager.params.insideBlur) {
        // For inside blur, we need to create a mask
        this.drawInsideBlurredShapeToCanvas(
          targetCanvas,
          position.x,
          position.y,
          scaledWidth,
          scaledHeight,
          progress
        );
        return;
      }

      targetCanvas.push();
      targetCanvas.drawingContext.filter = `blur(${scaledBlur}px)`;
    }

    // Draw the shape
    targetCanvas.push();
    targetCanvas.translate(
      position.x - scaledWidth / 2,
      position.y - scaledHeight / 2
    );

    // Set up appearance
    if (ParamsManager.params.showPathShapeStroke) {
      targetCanvas.stroke(ParamsManager.params.shapeStrokeColor);
      targetCanvas.strokeWeight(
        ParamsManager.params.pathShapeStrokeWeight * window.currentScaleFactor
      );
    } else {
      targetCanvas.noStroke();
    }

    // Handle fill based on parameters
    if (ParamsManager.params.showFill) {
      if (ParamsManager.params.gradientType === "none") {
        let fillColor = color(ParamsManager.params.shapeFillColor);
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        targetCanvas.fill(fillColor);
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
          fillColor =
            progress < 0.5
              ? lerpColor(
                  color(ParamsManager.params.shapeFillColor),
                  color(ParamsManager.params.shapeFillColor2),
                  progress * 2
                )
              : lerpColor(
                  color(ParamsManager.params.shapeFillColor2),
                  color(ParamsManager.params.shapeFillColor3),
                  (progress - 0.5) * 2
                );
        }
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        targetCanvas.fill(fillColor);
      } else {
        // For complex gradients, we need to use the drawing context directly
        const gradient = BooleanOperations.createGradientForBounds(
          targetCanvas.drawingContext,
          {
            minX: 0,
            minY: 0,
            maxX: scaledWidth,
            maxY: scaledHeight,
            width: scaledWidth,
            height: scaledHeight,
          }
        );

        targetCanvas.drawingContext.fillStyle = gradient;
        targetCanvas.noFill(); // This prevents p5.js from overriding our fillStyle
      }
    } else {
      targetCanvas.noFill();
    }

    // Draw the shape
    if (ParamsManager.params.shapeType === "rectangle") {
      if (ParamsManager.getScaledParam("shapeCornerRadius") > 0) {
        let radius = min(
          ParamsManager.getScaledParam("shapeCornerRadius"),
          scaledWidth / 2,
          scaledHeight / 2
        );

        if (
          ParamsManager.params.gradientType !== "none" &&
          ParamsManager.params.gradientType !== "length" &&
          ParamsManager.params.showFill
        ) {
          // For gradient with rounded corners, we need to use path drawing API
          let ctx = targetCanvas.drawingContext;
          ctx.beginPath();
          ctx.moveTo(radius, 0);
          ctx.lineTo(scaledWidth - radius, 0);
          ctx.quadraticCurveTo(scaledWidth, 0, scaledWidth, radius);
          ctx.lineTo(scaledWidth, scaledHeight - radius);
          ctx.quadraticCurveTo(
            scaledWidth,
            scaledHeight,
            scaledWidth - radius,
            scaledHeight
          );
          ctx.lineTo(radius, scaledHeight);
          ctx.quadraticCurveTo(0, scaledHeight, 0, scaledHeight - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.closePath();
          ctx.fill();

          if (ParamsManager.params.showPathShapeStroke) {
            ctx.stroke();
          }
        } else {
          targetCanvas.rect(0, 0, scaledWidth, scaledHeight, radius);
        }
      } else {
        if (
          ParamsManager.params.gradientType !== "none" &&
          ParamsManager.params.gradientType !== "length" &&
          ParamsManager.params.showFill
        ) {
          // For gradient rectangles
          let ctx = targetCanvas.drawingContext;
          if (ParamsManager.params.showPathShapeStroke) {
            ctx.fillRect(0, 0, scaledWidth, scaledHeight);
            ctx.strokeRect(0, 0, scaledWidth, scaledHeight);
          } else {
            ctx.fillRect(0, 0, scaledWidth, scaledHeight);
          }
        } else {
          targetCanvas.rect(0, 0, scaledWidth, scaledHeight);
        }
      }
    } else if (ParamsManager.params.shapeType === "ellipse") {
      if (
        ParamsManager.params.gradientType !== "none" &&
        ParamsManager.params.gradientType !== "length" &&
        ParamsManager.params.showFill
      ) {
        // For gradient ellipses
        let ctx = targetCanvas.drawingContext;
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
        if (ParamsManager.params.showPathShapeStroke) {
          ctx.stroke();
        }
      } else {
        targetCanvas.ellipse(
          scaledWidth / 2,
          scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      }
    }

    targetCanvas.pop();

    // Reset blur filter if applied
    if (scaledBlur > 0) {
      targetCanvas.drawingContext.filter = "none";
      targetCanvas.pop();
    }
  },

  drawInsideBlurredShapeToCanvas(targetCanvas, x, y, width, height, progress) {
    // Create temporary canvases for shape and mask
    const tempCanvas = createGraphics(width * 3, height * 3);
    const maskCanvas = createGraphics(width * 3, height * 3);

    // Center translation
    const tx = width * 1.5 - width / 2;
    const ty = height * 1.5 - height / 2;

    // Configure shape drawing on temp canvas
    if (ParamsManager.params.showPathShapeStroke) {
      tempCanvas.stroke(ParamsManager.params.shapeStrokeColor);
      tempCanvas.strokeWeight(
        ParamsManager.params.pathShapeStrokeWeight * window.currentScaleFactor
      );
    } else {
      tempCanvas.noStroke();
    }

    // Set fill based on parameters
    if (ParamsManager.params.showFill) {
      if (ParamsManager.params.gradientType === "none") {
        let fillColor = color(ParamsManager.params.shapeFillColor);
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        tempCanvas.fill(fillColor);
      } else if (
        ParamsManager.params.gradientType === "length" &&
        progress !== null
      ) {
        let fillColor = this._getProgressColor(progress);
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        tempCanvas.fill(fillColor);
      } else {
        // For gradients, use solid fill initially; we'll apply gradient later
        let fillColor = color(ParamsManager.params.shapeFillColor);
        fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
        tempCanvas.fill(fillColor);
      }
    } else {
      tempCanvas.noFill();
    }

    // Configure mask canvas - always fill with white
    maskCanvas.noStroke();
    maskCanvas.fill(255);

    // Draw the shape on both canvases
    tempCanvas.push();
    maskCanvas.push();

    tempCanvas.translate(tx, ty);
    maskCanvas.translate(tx, ty);

    // Draw based on shape type
    if (ParamsManager.params.shapeType === "rectangle") {
      const radius = min(
        ParamsManager.getScaledParam("shapeCornerRadius"),
        width / 2,
        height / 2
      );

      if (radius > 0) {
        tempCanvas.rect(0, 0, width, height, radius);
        maskCanvas.rect(0, 0, width, height, radius);
      } else {
        tempCanvas.rect(0, 0, width, height);
        maskCanvas.rect(0, 0, width, height);
      }
    } else {
      tempCanvas.ellipse(width / 2, height / 2, width, height);
      maskCanvas.ellipse(width / 2, height / 2, width, height);
    }

    tempCanvas.pop();
    maskCanvas.pop();

    // Apply blur to the shape
    tempCanvas.filter(
      BLUR,
      (ParamsManager.params.shapeBlur * window.currentScaleFactor) / 2
    );

    // Get image data from both canvases
    const shapeImg = tempCanvas.get();
    const maskImg = maskCanvas.get();

    // Apply mask
    shapeImg.mask(maskImg);

    // Draw the masked image to target canvas
    targetCanvas.image(
      shapeImg,
      x - width / 2 - tx + width * 1.5,
      y - height / 2 - ty + height * 1.5
    );

    // Apply gradient if needed
    if (
      ParamsManager.params.showFill &&
      ParamsManager.params.gradientType !== "none" &&
      ParamsManager.params.gradientType !== "length"
    ) {
      targetCanvas.push();

      // Set composite operation to only affect the shape area
      targetCanvas.drawingContext.globalCompositeOperation = "source-atop";

      // Translate to shape position
      targetCanvas.translate(x - width / 2, y - height / 2);

      // Create bounds for gradient
      const bounds = {
        minX: 0,
        minY: 0,
        maxX: width,
        maxY: height,
        width: width,
        height: height,
      };

      // Create gradient
      const gradient = BooleanOperations.createGradientForBounds(
        targetCanvas.drawingContext,
        bounds
      );

      // Apply gradient
      targetCanvas.drawingContext.fillStyle = gradient;

      // Draw shape to apply gradient
      if (ParamsManager.params.shapeType === "rectangle") {
        const radius = min(
          ParamsManager.getScaledParam("shapeCornerRadius"),
          width / 2,
          height / 2
        );

        if (radius > 0) {
          // Draw rounded rectangle
          let ctx = targetCanvas.drawingContext;
          ctx.beginPath();
          ctx.moveTo(radius, 0);
          ctx.lineTo(width - radius, 0);
          ctx.quadraticCurveTo(width, 0, width, radius);
          ctx.lineTo(width, height - radius);
          ctx.quadraticCurveTo(width, height, width - radius, height);
          ctx.lineTo(radius, height);
          ctx.quadraticCurveTo(0, height, 0, height - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.fill();
        } else {
          targetCanvas.rect(0, 0, width, height);
        }
      } else {
        // Draw ellipse
        let ctx = targetCanvas.drawingContext;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, TWO_PI);
        ctx.fill();
      }

      targetCanvas.pop();
    }

    // Clean up
    tempCanvas.remove();
    maskCanvas.remove();
  },

  // Helper for color progression
  _getProgressColor(progress) {
    if (ParamsManager.params.gradientColors === "2") {
      return lerpColor(
        color(ParamsManager.params.shapeFillColor),
        color(ParamsManager.params.shapeFillColor2),
        progress
      );
    } else {
      return progress < 0.5
        ? lerpColor(
            color(ParamsManager.params.shapeFillColor),
            color(ParamsManager.params.shapeFillColor2),
            progress * 2
          )
        : lerpColor(
            color(ParamsManager.params.shapeFillColor2),
            color(ParamsManager.params.shapeFillColor3),
            (progress - 0.5) * 2
          );
    }
  },
};

// Shape Renderer module
const ShapeRenderer = {
  drawShapeAtPosition(
    x,
    y,
    width,
    height,
    currentCell,
    progress,
    totalSegments,
    segmentIndex,
    stepIndex
  ) {
    const options = {
      cell: currentCell,
      progress: progress,
      totalSegments: totalSegments,
      segmentIndex: segmentIndex,
      stepIndex: stepIndex,
    };

    let scale = ParamsManager.params.shapeSize;

    // Apply size noise
    let sizeNoiseFactor = Utils.getSizeNoise(segmentIndex, stepIndex);
    scale *= sizeNoiseFactor;

    let scaledWidth = width * scale;
    let scaledHeight = height * scale;

    // Check if shape extends beyond padding boundary
    let position = Utils.adjustPositionToBounds(
      x,
      y,
      scaledWidth,
      scaledHeight
    );

    // Apply shape blur if needed
    if (ParamsManager.getScaledParam("shapeBlur") > 0) {
      if (ParamsManager.params.insideBlur) {
        this.drawInsideBlurredShape(
          position.x,
          position.y,
          scaledWidth,
          scaledHeight,
          progress
        );
      } else {
        this.drawWithContext(
          { blur: ParamsManager.getScaledParam("shapeBlur") },
          (ctx) => {
            push();
            translate(
              position.x - scaledWidth / 2,
              position.y - scaledHeight / 2
            );
            this.drawShapeWithGradient(
              0,
              0,
              scaledWidth,
              scaledHeight,
              progress
            );
            pop();
          }
        );
      }
    } else {
      // Standard drawing without blur
      push();
      translate(position.x - scaledWidth / 2, position.y - scaledHeight / 2);
      this.drawShapeWithGradient(0, 0, scaledWidth, scaledHeight, progress);
      pop();
    }
  },

  drawInsideBlurredShape(x, y, width, height, progress) {
    // Use the unified masking system
    const result = Utils.createMaskedGraphics(
      width,
      height,
      (shapeBuffer, maskBuffer) => {
        // Configure shape buffer
        if (ParamsManager.params.showPathShapeStroke) {
          shapeBuffer.stroke(ParamsManager.params.shapeStrokeColor);
          shapeBuffer.strokeWeight(
            ParamsManager.getScaledParam("pathShapeStrokeWeight")
          );
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
            let fillColor = this._getProgressColor(progress);
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

        // Configure mask buffer
        maskBuffer.noStroke();
        maskBuffer.fill(255); // White for mask

        // Draw the shape on both buffers
        this._drawShapeOnBuffer(shapeBuffer, 0, 0, width, height);
        this._drawShapeOnBuffer(maskBuffer, 0, 0, width, height);
      },
      { blur: ParamsManager.getScaledParam("shapeBlur") }
    );

    // Draw the masked image
    image(
      result.image,
      x - width / 2 - result.offsetX,
      y - height / 2 - result.offsetY
    );

    // Apply gradient if needed
    if (
      ParamsManager.params.showFill &&
      ParamsManager.params.gradientType !== "none" &&
      ParamsManager.params.gradientType !== "length"
    ) {
      Utils.withContext(
        drawingContext,
        {
          globalCompositeOperation: "source-atop",
        },
        (ctx) => {
          translate(x - width / 2, y - height / 2);
          let gradient = Utils.createGradient(ctx, width, height);
          ctx.fillStyle = gradient;

          // Draw the shape for gradient
          if (ParamsManager.params.shapeType === "rectangle") {
            if (ParamsManager.getScaledParam("shapeCornerRadius") > 0) {
              let radius = min(
                ParamsManager.getScaledParam("shapeCornerRadius"),
                width / 2,
                height / 2
              );
              Utils.roundedRect(ctx, 0, 0, width, height, radius);
            } else {
              ctx.fillRect(0, 0, width, height);
            }
          } else if (ParamsManager.params.shapeType === "ellipse") {
            ctx.beginPath();
            ctx.ellipse(
              width / 2,
              height / 2,
              width / 2,
              height / 2,
              0,
              0,
              TWO_PI
            );
            ctx.fill();
          }
        }
      );
    }
  },

  _drawShapeOnBuffer(buffer, x, y, width, height) {
    if (ParamsManager.params.shapeType === "rectangle") {
      const scaledRadius =
        ParamsManager.params.shapeCornerRadius * window.currentScaleFactor;
      if (scaledRadius > 0) {
        let radius = min(scaledRadius, width / 2, height / 2);
        buffer.rect(x, y, width, height, radius);
      } else {
        buffer.rect(x, y, width, height);
      }
    } else if (ParamsManager.params.shapeType === "ellipse") {
      buffer.ellipse(x + width / 2, y + height / 2, width, height);
    }
  },

  _getProgressColor(progress) {
    if (ParamsManager.params.gradientColors === "2") {
      return lerpColor(
        color(ParamsManager.params.shapeFillColor),
        color(ParamsManager.params.shapeFillColor2),
        progress
      );
    } else {
      const colors = [
        color(ParamsManager.params.shapeFillColor),
        color(ParamsManager.params.shapeFillColor2),
        color(ParamsManager.params.shapeFillColor3),
      ];

      return progress < 0.5
        ? lerpColor(colors[0], colors[1], progress * 2)
        : lerpColor(colors[1], colors[2], (progress - 0.5) * 2);
    }
  },

  drawShapeWithGradient(x, y, width, height, progress = null) {
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

    // Handle stroke with direct scaling - percentage of grid size for consistency
    if (ParamsManager.params.showPathShapeStroke) {
      stroke(ParamsManager.params.shapeStrokeColor);
      // Scale stroke weight as percentage of grid size
      const strokeWeightPercentage =
        ParamsManager.params.pathShapeStrokeWeight / 500;
      const scaledStrokeWeight =
        ParamsManager.params.gridSize * strokeWeightPercentage;
      strokeWeight(scaledStrokeWeight);
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
  },

  drawShape(x, y, width, height) {
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
  },

  drawShapeWithContext(ctx, width, height) {
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
  },
  drawWithContext(options, drawCallback) {
    Utils.withContext(drawingContext, options, (ctx) => {
      drawCallback(ctx);
    });
  },
};

// Boolean Operations module
const BooleanOperations = {
  isValidPolygon(polygon) {
    return (
      polygon &&
      polygon.regions &&
      polygon.regions.length > 0 &&
      polygon.regions[0] &&
      polygon.regions[0].length >= 3
    );
  },

  unionShapes(shapes) {
    if (!shapes || shapes.length === 0) return null;

    // Filter out invalid shapes
    const validShapes = shapes.filter((shape) => this.isValidPolygon(shape));
    if (validShapes.length === 0) return null;

    // For better performance with many shapes, use divide and conquer approach
    if (validShapes.length > 10) {
      return this.unionShapesDivideAndConquer(validShapes);
    }

    // Standard sequential union for fewer shapes
    let unionResult = validShapes[0];
    for (let i = 1; i < validShapes.length; i++) {
      try {
        // Only perform union if both polygons are valid
        if (
          this.isValidPolygon(unionResult) &&
          this.isValidPolygon(validShapes[i])
        ) {
          unionResult = polybool.union(unionResult, validShapes[i]);
        }
      } catch (e) {
        console.warn("Boolean operation failed:", e);
        break;
      }
    }
    return unionResult;
  },

  unionShapesDivideAndConquer(shapes) {
    if (shapes.length === 0) return null;
    if (shapes.length === 1) return shapes[0];

    const mid = Math.floor(shapes.length / 2);
    const left = this.unionShapesDivideAndConquer(shapes.slice(0, mid));
    const right = this.unionShapesDivideAndConquer(shapes.slice(mid));

    if (!left) return right;
    if (!right) return left;

    try {
      return polybool.union(left, right);
    } catch (e) {
      console.warn("Union failed in divide and conquer:", e);
      return left; // Return partial result
    }
  },

  createShapePolygon(x, y, width, height, options) {
    const {
      cell,
      progress,
      totalSegments,
      segmentIndex = 0,
      stepIndex = 0,
    } = options;

    // Scale factor based on shapeSize parameter - consistent for all shapes
    let scale = ParamsManager.params.shapeSize;

    // Apply size noise consistently
    let sizeNoiseFactor = Utils.getSizeNoise(segmentIndex, stepIndex);
    scale *= sizeNoiseFactor;

    // Apply scale to width and height consistently
    let scaledWidth = width * scale;
    let scaledHeight = height * scale;

    // Store original position before any transformations
    const originalX = x;
    const originalY = y;

    // Apply position noise with proper scaling
    if (ParamsManager.params.positionNoise > 0) {
      // Use the getPositionNoiseRaw to get consistent noise pattern
      const noiseOffset = Utils.getPositionNoiseRaw(
        x,
        y,
        segmentIndex,
        stepIndex
      );

      // Scale the noise by the positionNoise parameter and current scale factor
      const noiseAmount =
        ParamsManager.params.positionNoise * window.currentScaleFactor;
      x += noiseOffset.x * noiseAmount;
      y += noiseOffset.y * noiseAmount;
    }

    // Adjust position to boundaries with proper scaling
    const adjustedPosition = Utils.adjustPositionToBounds(
      x,
      y,
      scaledWidth,
      scaledHeight
    );

    // Use the adjusted position
    x = adjustedPosition.x;
    y = adjustedPosition.y;

    // Half dimensions for polygon creation
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;

    // Ensure minimum size
    if (halfWidth < 0.1 || halfHeight < 0.1) {
      return null;
    }

    // Create polygon points based on shape type
    if (ParamsManager.params.shapeType === "rectangle") {
      // Create rectangle with proper winding order (counter-clockwise)
      const points = [
        [x - halfWidth, y - halfHeight],
        [x + halfWidth, y - halfHeight],
        [x + halfWidth, y + halfHeight],
        [x - halfWidth, y + halfHeight],
      ];

      return {
        regions: [points],
        inverted: false,
        // Store original dimensions for debugging
        _debug: {
          originalX,
          originalY,
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        },
      };
    } else {
      // Create ellipse with proper points
      const points = [];
      const numPoints = Math.max(8, ParamsManager.params.ellipseResolution);

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * TWO_PI;
        const px = x + Math.cos(angle) * halfWidth;
        const py = y + Math.sin(angle) * halfHeight;
        points.push([px, py]);
      }

      // Verify valid polygon
      if (points.length < 3) return null;

      return {
        regions: [points],
        inverted: false,
        // Store original dimensions for debugging
        _debug: {
          originalX,
          originalY,
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        },
      };
    }
  },

  getUnionBounds(unionResult) {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (let region of unionResult.regions) {
      for (let point of region) {
        if (!Array.isArray(point) || point.length < 2) continue;
        minX = min(minX, point[0]);
        minY = min(minY, point[1]);
        maxX = max(maxX, point[0]);
        maxY = max(maxY, point[1]);
      }
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  },

  createGradientForBounds(ctx, bounds) {
    // Get params and ensure we have hex colors, not names
    const params = Utils.ensureHexColors(ParamsManager.params);

    const {
      gradientType,
      shapeFillColor,
      shapeFillColor2,
      shapeFillColor3,
      gradientColors,
      shapeAlpha,
    } = params;

    // Create the appropriate gradient based on bounds
    let gradient;

    switch (gradientType) {
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
      case "radial": {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const radius = max(bounds.width, bounds.height) / 2;
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        break;
      }
      case "conic": {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        gradient = ctx.createConicGradient(-PI / 2, centerX, centerY);
        break;
      }
      default:
        gradient = ctx.createLinearGradient(bounds.minX, 0, bounds.maxX, 0);
    }

    // Add color stops
    const colors = [shapeFillColor, shapeFillColor2];
    if (gradientColors === "3") {
      colors.push(shapeFillColor3);
    }

    if (colors.length === 2) {
      Utils.createColorStop(gradient, 0, colors[0], shapeAlpha);
      Utils.createColorStop(gradient, 1, colors[1], shapeAlpha);
    } else {
      Utils.createColorStop(gradient, 0, colors[0], shapeAlpha);
      Utils.createColorStop(gradient, 0.5, colors[1], shapeAlpha);
      Utils.createColorStop(gradient, 1, colors[2], shapeAlpha);
    }

    return gradient;
  },

  drawUnifiedShape(unionResult) {
    if (!this.isValidPolygon(unionResult)) return;

    // Filter out degenerate regions
    const validRegions = unionResult.regions.filter(
      (region) => region && region.length >= 3
    );

    if (validRegions.length === 0) return;

    // Calculate bounds once for all operations
    const bounds = this.getUnionBounds({ regions: validRegions });

    // Direct scaling for blur
    const scaledBlur =
      ParamsManager.params.shapeBlur * window.currentScaleFactor;

    // Special case: inside blur
    if (scaledBlur > 0 && ParamsManager.params.insideBlur) {
      this.drawInsideBlurredUnion(validRegions, bounds);
      return;
    }

    // Handle regular drawing (with or without blur)
    Utils.withContext(
      drawingContext,
      {
        filter: scaledBlur > 0 ? `blur(${scaledBlur}px)` : null,
      },
      (ctx) => {
        // Set appearance with direct scaling
        if (ParamsManager.params.showPathShapeStroke) {
          ctx.strokeStyle = ParamsManager.params.shapeStrokeColor;
          ctx.lineWidth =
            ParamsManager.params.pathShapeStrokeWeight *
            window.currentScaleFactor;
        }

        // Rest of the method remains the same
        if (!ParamsManager.params.showFill) {
          // Draw stroke-only if requested
          if (ParamsManager.params.showPathShapeStroke) {
            this.drawUnionWithContext(ctx, { regions: validRegions }, true);
          }
        } else {
          // Handle fill types
          if (ParamsManager.params.gradientType === "none") {
            // Solid fill
            const c = color(ParamsManager.params.shapeFillColor);
            c.setAlpha(ParamsManager.params.shapeAlpha * 255);
            ctx.fillStyle = `rgba(${red(c)}, ${green(c)}, ${blue(c)}, ${
              ParamsManager.params.shapeAlpha
            })`;
            this.drawUnionWithContext(ctx, { regions: validRegions });
          } else if (ParamsManager.params.gradientType === "length") {
            // Length-based gradient (use middle color for union)
            let fillColor;
            if (ParamsManager.params.gradientColors === "2") {
              fillColor = lerpColor(
                color(ParamsManager.params.shapeFillColor),
                color(ParamsManager.params.shapeFillColor2),
                0.5
              );
            } else {
              fillColor = color(ParamsManager.params.shapeFillColor2);
            }
            fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
            ctx.fillStyle = `rgba(${red(fillColor)}, ${green(
              fillColor
            )}, ${blue(fillColor)}, ${ParamsManager.params.shapeAlpha})`;
            this.drawUnionWithContext(ctx, { regions: validRegions });
          } else {
            // Complex gradients
            const gradient = this.createGradientForBounds(ctx, bounds);
            ctx.fillStyle = gradient;
            this.drawUnionWithContext(ctx, { regions: validRegions });
          }
        }
      }
    );
  },

  drawInsideBlurredUnion(validRegions, bounds) {
    // Use direct scaling for blur
    const scaledBlur =
      ParamsManager.params.shapeBlur * window.currentScaleFactor;

    const result = Utils.createMaskedGraphics(
      bounds.width,
      bounds.height,
      (shapeBuffer, maskBuffer) => {
        // Translate to align with bounds
        const translation = { x: -bounds.minX, y: -bounds.minY };
        shapeBuffer.translate(translation.x, translation.y);
        maskBuffer.translate(translation.x, translation.y);

        // Configure shape buffer with direct scaling
        if (ParamsManager.params.showPathShapeStroke) {
          shapeBuffer.stroke(ParamsManager.params.shapeStrokeColor);
          // Apply scaling directly to stroke weight
          shapeBuffer.strokeWeight(
            ParamsManager.params.pathShapeStrokeWeight *
              window.currentScaleFactor
          );
        } else {
          shapeBuffer.noStroke();
        }

        // Handle fill
        if (!ParamsManager.params.showFill) {
          shapeBuffer.noFill();
        } else {
          // Apply solid fill (gradient handled separately)
          let fillColor = color(ParamsManager.params.shapeFillColor);
          fillColor.setAlpha(ParamsManager.params.shapeAlpha * 255);
          shapeBuffer.fill(fillColor);
        }

        // Configure mask buffer
        maskBuffer.noStroke();
        maskBuffer.fill(255); // White for mask

        // Draw all regions into both buffers
        for (let region of validRegions) {
          if (
            ParamsManager.params.shapeCornerRadius > 0 &&
            ParamsManager.params.shapeType === "rectangle"
          ) {
            // Use the direct scaling approach
            this.drawRoundedPolygon(shapeBuffer, region);
            this.drawRoundedPolygon(maskBuffer, region);
          } else {
            this._drawRegionToBuffer(shapeBuffer, region);
            this._drawRegionToBuffer(maskBuffer, region);
          }
        }
      },
      { blur: scaledBlur }
    );

    // Draw the masked image
    image(
      result.image,
      bounds.minX - result.offsetX,
      bounds.minY - result.offsetY
    );

    // Apply gradient if needed
    if (
      ParamsManager.params.showFill &&
      ParamsManager.params.gradientType !== "none" &&
      ParamsManager.params.gradientType !== "length"
    ) {
      Utils.withContext(
        drawingContext,
        {
          globalCompositeOperation: "source-atop",
        },
        (ctx) => {
          // Calculate gradient for the entire shape bounds
          const gradient = this.createGradientForBounds(ctx, bounds);
          ctx.fillStyle = gradient;

          // Draw the shapes with the gradient
          for (let region of validRegions) {
            ctx.beginPath();

            for (let i = 0; i < region.length; i++) {
              const point = region[i];
              if (
                Array.isArray(point) &&
                point.length >= 2 &&
                typeof point[0] === "number" &&
                typeof point[1] === "number" &&
                !isNaN(point[0]) &&
                !isNaN(point[1])
              ) {
                if (i === 0) {
                  ctx.moveTo(point[0], point[1]);
                } else {
                  ctx.lineTo(point[0], point[1]);
                }
              }
            }

            ctx.closePath();
            ctx.fill();
          }
        }
      );
    }
  },

  _drawRegionToBuffer(buffer, region) {
    buffer.beginShape();
    for (let point of region) {
      if (
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === "number" &&
        typeof point[1] === "number" &&
        !isNaN(point[0]) &&
        !isNaN(point[1])
      ) {
        buffer.vertex(point[0], point[1]);
      }
    }
    buffer.endShape(CLOSE);
  },

  drawUnionWithContext(ctx, unionResult, strokeOnly = false) {
    // Use direct scaling with window.currentScaleFactor
    const scaledStrokeWeight =
      ParamsManager.params.pathShapeStrokeWeight * window.currentScaleFactor;

    if (ParamsManager.params.showPathShapeStroke) {
      ctx.lineWidth = scaledStrokeWeight;
    }

    for (let region of unionResult.regions) {
      if (!region || region.length < 3) continue;

      ctx.beginPath();

      // Handle rounded corners if needed
      if (
        ParamsManager.params.shapeCornerRadius > 0 &&
        ParamsManager.params.shapeType === "rectangle"
      ) {
        this.drawRoundedPolygonPath(ctx, region);
      } else {
        // Standard polygon drawing
        const firstPoint = region[0];
        if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
          ctx.moveTo(firstPoint[0], firstPoint[1]);

          for (let i = 1; i < region.length; i++) {
            const point = region[i];
            if (Array.isArray(point) && point.length >= 2) {
              ctx.lineTo(point[0], point[1]);
            }
          }
        }
      }

      ctx.closePath();

      // Apply fill and/or stroke
      if (strokeOnly) {
        ctx.stroke();
      } else if (!ParamsManager.params.showPathShapeStroke) {
        ctx.fill();
      } else {
        ctx.fill();
        ctx.stroke();
      }
    }
  },

  drawRoundedPolygonPath(ctx, points) {
    if (!points || points.length < 3) return;

    // Use scaled corner radius
    const scaledCornerRadius =
      ParamsManager.getScaledParam("shapeCornerRadius");

    // Calculate safe radius based on polygon edges
    let minEdgeLength = Infinity;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if (!Array.isArray(p1) || !Array.isArray(p2)) continue;

      const edgeLength = Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
      );
      minEdgeLength = Math.min(minEdgeLength, edgeLength);
    }

    // Limit radius to prevent overlap
    const maxRadius = Math.min(scaledCornerRadius, minEdgeLength * 0.4);

    // Start path with first segment
    let p0 = points[points.length - 1];
    let p1 = points[0];
    let p2 = points[1];

    if (!Array.isArray(p0) || !Array.isArray(p1) || !Array.isArray(p2)) return;

    // Calculate vectors and normalize
    let v1 = [p1[0] - p0[0], p1[1] - p0[1]];
    let v2 = [p2[0] - p1[0], p2[1] - p1[1]];

    let len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    let len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

    if (len1 === 0 || len2 === 0) {
      ctx.moveTo(p1[0], p1[1]);
    } else {
      let unitV1 = [v1[0] / len1, v1[1] / len1];
      let unitV2 = [v2[0] / len2, v2[1] / len2];

      let afterCorner = [
        p1[0] + unitV2[0] * maxRadius,
        p1[1] + unitV2[1] * maxRadius,
      ];

      ctx.moveTo(afterCorner[0], afterCorner[1]);
    }

    // Draw each corner with rounded edges
    for (let i = 1; i < points.length; i++) {
      p0 = points[i - 1];
      p1 = points[i];
      p2 = points[(i + 1) % points.length];

      if (!Array.isArray(p0) || !Array.isArray(p1) || !Array.isArray(p2))
        continue;

      v1 = [p1[0] - p0[0], p1[1] - p0[1]];
      v2 = [p2[0] - p1[0], p2[1] - p1[1]];

      len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
      len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

      if (len1 === 0 || len2 === 0) {
        ctx.lineTo(p1[0], p1[1]);
        continue;
      }

      let unitV1 = [v1[0] / len1, v1[1] / len1];
      let unitV2 = [v2[0] / len2, v2[1] / len2];

      let beforeCorner = [
        p1[0] - unitV1[0] * maxRadius,
        p1[1] - unitV1[1] * maxRadius,
      ];

      let afterCorner = [
        p1[0] + unitV2[0] * maxRadius,
        p1[1] + unitV2[1] * maxRadius,
      ];

      // Line to point before corner
      ctx.lineTo(beforeCorner[0], beforeCorner[1]);

      // Quadratic curve for the corner
      ctx.quadraticCurveTo(p1[0], p1[1], afterCorner[0], afterCorner[1]);
    }
  },

  drawRoundedPolygon(buffer, points) {
    if (!points || points.length < 3) return;

    // Use directly scaled corner radius
    const cornerRadius =
      ParamsManager.params.shapeCornerRadius * window.currentScaleFactor;

    // Calculate safe radius based on polygon edges
    let minEdgeLength = Infinity;
    for (let i = 0; i < points.length; i++) {
      let p1 = points[i];
      let p2 = points[(i + 1) % points.length];

      if (!Array.isArray(p1) || !Array.isArray(p2)) continue;

      let edgeLength = Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
      );
      minEdgeLength = Math.min(minEdgeLength, edgeLength);
    }

    // Limit radius to prevent overlap
    let maxRadius = Math.min(cornerRadius, minEdgeLength * 0.4);

    buffer.beginShape();

    for (let i = 0; i < points.length; i++) {
      let p0 = points[(i - 1 + points.length) % points.length];
      let p1 = points[i];
      let p2 = points[(i + 1) % points.length];

      if (!Array.isArray(p0) || !Array.isArray(p1) || !Array.isArray(p2))
        continue;

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

      // Normalize vectors
      let unitV1 = [v1[0] / len1, v1[1] / len1];
      let unitV2 = [v2[0] / len2, v2[1] / len2];

      // Calculate points before and after corner
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
  },
};

// Utility functions module
const Utils = {
  // Adjust position to respect boundaries
  adjustPositionToBounds(x, y, width, height) {
    const gridSize = ParamsManager.params.gridSize;

    // Use window.currentScaleFactor for consistent scaling
    const scaledGridPadding =
      ParamsManager.params.gridPadding * window.currentScaleFactor;

    // Define boundaries including properly scaled padding
    const leftBoundary = -scaledGridPadding;
    const rightBoundary = gridSize + scaledGridPadding;
    const topBoundary = -scaledGridPadding;
    const bottomBoundary = gridSize + scaledGridPadding;

    // Calculate half dimensions for boundary checking
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
    // Get params and ensure we have hex colors, not names
    const params = Utils.ensureHexColors(ParamsManager.params);

    const {
      gradientType,
      shapeFillColor,
      shapeFillColor2,
      shapeFillColor3,
      gradientColors,
      shapeAlpha,
    } = params;

    const colors = [shapeFillColor, shapeFillColor2];
    if (gradientColors === "3") {
      colors.push(shapeFillColor3);
    }

    return this.createGradientWithStops(
      ctx,
      gradientType,
      { width, height },
      colors,
      shapeAlpha
    );
  },

  getPositionNoise(x, y, segmentIndex, stepIndex) {
    if (ParamsManager.params.positionNoise === 0) {
      return { x: 0, y: 0 };
    }

    // Create a unique seed for each shape position to ensure consistent displacement
    let seed = segmentIndex * 1000 + stepIndex;

    // Use the seed to create deterministic but seemingly random values
    let randomX = (sin(seed * 0.123) + cos(seed * 0.456)) * 0.5;
    let randomY = (sin(seed * 0.789) + cos(seed * 0.321)) * 0.5;

    // Create random angle and distance with properly scaled noise
    let angle = randomX * TWO_PI;
    let distance = abs(randomY) * ParamsManager.getScaledParam("positionNoise");

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

  withContext(ctx, options, callback) {
    ctx.save();

    // Apply all options
    if (options.fillStyle) ctx.fillStyle = options.fillStyle;
    if (options.strokeStyle) ctx.strokeStyle = options.strokeStyle;
    if (options.lineWidth) ctx.lineWidth = options.lineWidth;
    if (options.filter) ctx.filter = options.filter;
    if (options.globalCompositeOperation) {
      ctx.globalCompositeOperation = options.globalCompositeOperation;
    }

    // Execute drawing callback
    callback(ctx);

    // Restore context
    ctx.restore();
  },

  gradientCache: {},

  getGradient(ctx, width, height, options = {}) {
    // Get parameters, either from options or defaults
    const params = options.params || ParamsManager.params;

    // Create a cache key based on all parameters that affect gradient
    const key = `${params.gradientType}-${width}-${height}-${params.shapeFillColor}-${params.shapeFillColor2}-${params.shapeFillColor3}-${params.gradientColors}-${params.shapeAlpha}`;

    // Return cached gradient if available
    if (this.gradientCache[key]) {
      return this.gradientCache[key];
    }

    // Prepare colors array
    const colors = [params.shapeFillColor, params.shapeFillColor2];
    if (params.gradientColors === "3") {
      colors.push(params.shapeFillColor3);
    }

    // Create gradient with the unified method
    const gradient = this.createGradientWithStops(
      ctx,
      params.gradientType,
      { width, height },
      colors,
      params.shapeAlpha
    );

    // Cache the gradient
    this.gradientCache[key] = gradient;

    return gradient;
  },

  getCellDimensions() {
    const gridSize = ParamsManager.params.gridSize;
    const cellWidth = gridSize / ParamsManager.params.gridWidth;
    const cellHeight = gridSize / ParamsManager.params.gridHeight;
    return { cellWidth, cellHeight };
  },

  // Add to Utils object
  createMaskedGraphics(width, height, drawFn, options = {}) {
    const { blur = 0, offset = { x: 0, y: 0 } } = options;

    // Create buffers with some padding to handle blur
    const bufferWidth = width * 1.5;
    const bufferHeight = height * 1.5;

    // Calculate offset for centering content in buffer
    const bufferOffsetX = (bufferWidth - width) / 2;
    const bufferOffsetY = (bufferHeight - height) / 2;

    // Create buffers
    const shapeBuffer = createGraphics(bufferWidth, bufferHeight);
    const maskBuffer = createGraphics(bufferWidth, bufferHeight);

    // Translate to accommodate offset and centering
    shapeBuffer.translate(bufferOffsetX + offset.x, bufferOffsetY + offset.y);
    maskBuffer.translate(bufferOffsetX + offset.x, bufferOffsetY + offset.y);

    // Setup blur if needed
    if (blur > 0) {
      shapeBuffer.drawingContext.filter = `blur(${blur}px)`;
    }

    // Draw content to both buffers
    drawFn(shapeBuffer, maskBuffer);

    // Create images and apply masking
    const shapeImg = createImage(bufferWidth, bufferHeight);
    const maskImg = createImage(bufferWidth, bufferHeight);

    shapeImg.copy(
      shapeBuffer,
      0,
      0,
      bufferWidth,
      bufferHeight,
      0,
      0,
      bufferWidth,
      bufferHeight
    );
    maskImg.copy(
      maskBuffer,
      0,
      0,
      bufferWidth,
      bufferHeight,
      0,
      0,
      bufferWidth,
      bufferHeight
    );

    // Apply mask
    shapeImg.mask(maskImg);

    // Clean up
    shapeBuffer.remove();
    maskBuffer.remove();

    return {
      image: shapeImg,
      width: bufferWidth,
      height: bufferHeight,
      offsetX: bufferOffsetX,
      offsetY: bufferOffsetY,
    };
  },

  createColorStop(gradient, position, colorStr, alpha) {
    const c = color(colorStr);
    c.setAlpha(alpha * 255);
    gradient.addColorStop(
      position,
      `rgba(${red(c)}, ${green(c)}, ${blue(c)}, ${alpha})`
    );
    return c;
  },

  createGradientWithStops(ctx, type, dimensions, colors, alpha) {
    // Get gradient object
    const gradient = this._createGradientObject(ctx, type, dimensions);

    // Add color stops
    if (colors.length === 2) {
      this.createColorStop(gradient, 0, colors[0], alpha);
      this.createColorStop(gradient, 1, colors[1], alpha);
    } else if (colors.length >= 3) {
      this.createColorStop(gradient, 0, colors[0], alpha);
      this.createColorStop(gradient, 0.5, colors[1], alpha);
      this.createColorStop(gradient, 1, colors[2], alpha);
    }

    return gradient;
  },

  _createGradientObject(ctx, type, dimensions) {
    const { width, height } = dimensions;
    let gradient;

    switch (type) {
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

    return gradient;
  },

  getColorValue(colorNameOrHex) {
    // If ColorPalette exists, try to get hex from name
    if (ColorPalette) {
      return ColorPalette.getHexByName(colorNameOrHex);
    }
    return colorNameOrHex; // Return as is if no palette
  },

  // Helper method to ensure we're working with hex values, not color names
  ensureHexColors(colorObject) {
    const result = {};

    for (const key in colorObject) {
      if (
        typeof colorObject[key] === "string" &&
        (key.toLowerCase().includes("color") ||
          key.toLowerCase().includes("background"))
      ) {
        result[key] = this.getColorValue(colorObject[key]);
      } else {
        result[key] = colorObject[key];
      }
    }

    return result;
  },

  getGridScaleFactor() {
    // Base grid size used for default parameter values (500 is the default grid size)
    const baseGridSize = 500;
    // Current grid size (recalculated based on canvas and margin)
    const currentGridSize = ParamsManager.params.gridSize;

    // Return the ratio between current and base grid sizes
    return currentGridSize / baseGridSize;
  },

  drawScalingDebug() {
    if (!window.showScalingDebug) return;

    const scaleFactor = window.currentScaleFactor || 1;
    const gridSize = ParamsManager.params.gridSize;
    const canvasSize = ParamsManager.params.canvasSize;

    // Calculate padding as percentage
    const paddingPercentage = ParamsManager.params.gridPadding / 500;
    const scaledGridPadding = gridSize * paddingPercentage;

    push();
    // Use a semi-transparent background for text
    fill(255, 255, 255, 200);
    noStroke();
    rect(5, 5, 160, 170);

    // Draw text info
    textSize(14);
    fill(0);
    noStroke();
    text(`Scale: ${scaleFactor.toFixed(2)}x`, 10, 20);
    text(`Grid: ${gridSize}px`, 10, 40);
    text(`Canvas: ${canvasSize}px`, 10, 60);
    text(
      `Raw Padding: ${ParamsManager.params.gridPadding.toFixed(1)}px`,
      10,
      80
    );
    text(`Scaled Padding: ${scaledGridPadding.toFixed(1)}px`, 10, 100);

    // Draw padding box in blue for reference
    stroke(0, 0, 255, 100);
    strokeWeight(2);
    noFill();

    // Draw a reference box at the main grid position
    const gridPosition = Renderer.calculateGridPosition();
    rect(
      gridPosition.x - scaledGridPadding,
      gridPosition.y - scaledGridPadding,
      gridSize + scaledGridPadding * 2,
      gridSize + scaledGridPadding * 2
    );

    // Draw grid outline in red
    stroke(255, 0, 0, 100);
    rect(gridPosition.x, gridPosition.y, gridSize, gridSize);

    // Display shape debug info
    text(`Shape Size: ${ParamsManager.params.shapeSize.toFixed(2)}`, 10, 120);
    text(
      `Boolean Union: ${ParamsManager.params.booleanUnion ? "Yes" : "No"}`,
      10,
      140
    );
    text(
      `Shape Spacing: ${ParamsManager.params.pathShapeSpacing.toFixed(1)}px`,
      10,
      160
    );

    pop();
  },

  getPositionNoiseRaw(x, y, segmentIndex, stepIndex) {
    // Create a unique seed for each shape position
    let seed = segmentIndex * 1000 + stepIndex;

    // Use the seed to create deterministic but seemingly random values
    let randomX = (sin(seed * 0.123) + cos(seed * 0.456)) * 0.5;
    let randomY = (sin(seed * 0.789) + cos(seed * 0.321)) * 0.5;

    // Create random angle and distance, but don't scale yet
    let angle = randomX * TWO_PI;
    let distance = abs(randomY);

    return {
      x: cos(angle) * distance,
      y: sin(angle) * distance,
    };
  },
};
