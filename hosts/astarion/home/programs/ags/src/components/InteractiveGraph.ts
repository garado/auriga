/* █ █▄░█ ▀█▀ █▀▀ █▀█ ▄▀█ █▀▀ ▀█▀ █ █░█ █▀▀   █▀▀ █▀█ ▄▀█ █▀█ █░█ */
/* █ █░▀█ ░█░ ██▄ █▀▄ █▀█ █▄▄ ░█░ █ ▀▄▀ ██▄   █▄█ █▀▄ █▀█ █▀▀ █▀█ */

/* Interactive graph widget. */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify } from "astal/gtk4";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const DrawingArea = astalify(Gtk.DrawingArea);
const Scrollable = astalify(Gtk.ScrolledWindow);

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export type GraphData = {
  name: string;
  values: Array<number>;
  color: string;
  cssClass?: string;
  calculateFit?: boolean;
  dashed?: boolean;
  xIntersect?: {
    enable: boolean;
    label?: boolean;
    labelTransform?: (value: number) => string;
  };
  // Runtime properties added by the component
  colors?: any;
  realValues?: Array<number>;
  fit?: { slope: number; intercept: number } | null;
};

interface CairoColor {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

interface GraphWidget extends Gtk.DrawingArea {
  colors: {
    grid: CairoColor;
    vertical_intersect: CairoColor;
  };
  valueMax: number;
  valueMin: number;
  longestArrayLength: number;
  drawEnabled: boolean;
  drawIntersect: boolean;
  lastX: number;
  lastY: number;
  eventController: Gtk.EventControllerMotion;
}

interface GridConfig {
  enable: boolean;
  yStepPercent?: number;
  xStepPercent?: number;
}

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * To get CSS information for the InteractiveGraph widget, you need to do some weird CSS shit.
 */
const getCairoColorFromClass = (...rest: Array<string>): CairoColor => {
  const dummyWidget = new Gtk.Box();
  const dummyContext = dummyWidget.get_style_context();

  for (const c of rest) {
    dummyContext.add_class(c);
  }

  return dummyContext.get_color();
};

/**
 * Set Cairo context source color.
 */
const setCairoColor = (cr: any, color: CairoColor): void => {
  cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha);
};

/**
 * Calculate line of best fit equation
 */
const fit = (
  points: Array<number>,
): { slope: number; intercept: number } | null => {
  const n = points.length;

  if (n === 0) return null;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let x = 0; x < points.length; x++) {
    sumX += x;
    sumY += points[x];
    sumXY += x * points[x];
    sumX2 += x * x;
  }

  let m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  let b = (sumY - m * sumX) / n;

  return { slope: m, intercept: b };
};

// Cache graph colors so we don't have to do this every draw
const cacheGraphColors = (graph: GraphData): void => {
  if (!graph.cssClass) return;

  graph.colors = {};
  graph.colors.horizontal_intersect = getCairoColorFromClass(
    graph.cssClass,
    "horizontal-intersect",
  );
  graph.colors.fit = getCairoColorFromClass(graph.cssClass, "fit");
  graph.colors.plot = getCairoColorFromClass(graph.cssClass, "plot");
};

/*****************************************************************************
 * Main component
 *****************************************************************************/

interface InteractiveGraphProps {
  grid?: GridConfig;
  graphs?: Array<GraphData>;
  cssClasses?: Array<string>;
  yIntersect?: boolean;
  yIntersectLabel?: boolean;
  wRequest?: number;
  hRequest?: number;
  [key: string]: any; // For ...rest properties
}

export default ({
  grid = {
    enable: false,
  },
  graphs = [],
  cssClasses = ["interactive-graph"],
  yIntersect = true,
  yIntersectLabel = true,
  wRequest = 300,
  hRequest = 200,
  ...rest
}: InteractiveGraphProps) => {
  const setupData = (self: GraphWidget): void => {
    // Globals
    for (const graph of graphs) {
      cacheGraphColors(graph);

      if (Array.isArray(graph.values)) {
        graph.realValues = graph.values;
      } else {
        // Handle case where values might be a reactive value
        graph.realValues = (graph.values as any).get
          ? (graph.values as any).get()
          : graph.values;
      }

      if (graph.calculateFit && graph.realValues) {
        graph.fit = fit(graph.realValues);

        if (graph.fit) {
          const lastFitVal =
            graph.fit.slope * self.longestArrayLength + graph.fit.intercept;

          if (lastFitVal > self.valueMax) self.valueMax = lastFitVal;
          if (lastFitVal < self.valueMin) self.valueMin = lastFitVal;
        }
      }
    }

    const allValues = graphs.flatMap((g) => g.realValues || []);
    self.valueMax = Math.max(...allValues);
    self.valueMin = Math.min(...allValues);
    self.longestArrayLength = Math.max(
      ...graphs.map((g) => g.realValues?.length || 0),
    );
  };

  const Graph = DrawingArea({
    widthRequest: 2000,
    heightRequest: hRequest,
    cssClasses: [...cssClasses, "interactive-graph"],
    hexpand: true,
    vexpand: true,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    ...rest,

    setup: (self) => {
      const graphWidget = self as GraphWidget;
      graphWidget.colors = {
        grid: getCairoColorFromClass(...cssClasses, "grid"),
        vertical_intersect: getCairoColorFromClass(
          ...cssClasses,
          "vertical-intersect",
        ),
      };

      graphWidget.valueMax = 0;
      graphWidget.valueMin = 0;
      graphWidget.longestArrayLength = 0;
      graphWidget.drawEnabled = false;
      graphWidget.drawIntersect = true;
      graphWidget.lastX = -1;
      graphWidget.lastY = -1;
      graphWidget.eventController = new Gtk.EventControllerMotion();
    },
  }) as GraphWidget;

  Graph.set_draw_func((self, cr: any, w, h) => {
    const graphWidget = self as GraphWidget;
    setupData(graphWidget);

    const xScale = (1 / graphWidget.longestArrayLength) * w;
    const yScale = (1 / (graphWidget.valueMax - graphWidget.valueMin)) * h;

    // Plot grid -------------------------------------------------------
    if (grid.enable) {
      setCairoColor(cr, graphWidget.colors.grid);
      cr.setDash([], 0);

      // y-lines
      if (grid.yStepPercent) {
        for (let y = grid.yStepPercent; y < 100; y += grid.yStepPercent) {
          cr.moveTo(0, (y / 100) * h);
          cr.lineTo(w, (y / 100) * h);
        }
        cr.stroke();
      }

      // x-lines
      if (grid.xStepPercent) {
        for (let x = grid.xStepPercent; x < 100; x += grid.xStepPercent) {
          cr.moveTo((x / 100) * w, 0);
          cr.lineTo((x / 100) * w, h);
        }
        cr.stroke();
      }
    }

    // Plot vertical intersection line ---------------------------------
    if (yIntersect && graphWidget.drawIntersect) {
      setCairoColor(cr, graphWidget.colors.vertical_intersect);
      cr.moveTo(graphWidget.lastX, 0);
      cr.lineTo(graphWidget.lastX, h);
      cr.stroke();
    }

    graphs.forEach((graph) => {
      if (!graph.realValues || !graph.colors) return;

      // Plot line of best fit, if applicable ----------------------------
      if (graph.calculateFit && graph.fit) {
        setCairoColor(cr, graph.colors.fit);
        cr.setDash([10, 5], 0); // 10-unit dash, 5-unit gap, 0 offset
        cr.moveTo(0, h - graph.fit.intercept * yScale);
        cr.lineTo(
          w,
          h -
            (graph.fit.slope * graphWidget.longestArrayLength +
              graph.fit.intercept) *
              yScale,
        );
        cr.stroke();
        cr.setDash([], 0);
      }

      // Plot values -----------------------------------------------------
      setCairoColor(cr, graph.colors.plot);

      if (graph.dashed) cr.setDash([10, 5], 0);

      cr.moveTo(0, h);
      for (let i = 0; i < graph.realValues.length; i++) {
        cr.lineTo(i * xScale, h - graph.realValues[i] * yScale);
      }
      cr.stroke();

      if (graph.dashed) cr.setDash([], 0);

      // Plot horizontal intersection line -------------------------------
      if (graphWidget.drawIntersect && graph.xIntersect?.enable) {
        const graphIndex = Math.round(
          (graphWidget.lastX / w) * graphWidget.longestArrayLength,
        );
        if (graphIndex >= graph.realValues.length && !graph.calculateFit)
          return;

        let graphY = 0;
        if (
          graphIndex >= graph.realValues.length &&
          graph.calculateFit &&
          graph.fit
        ) {
          graphY =
            h - (graphIndex * graph.fit.slope + graph.fit.intercept) * yScale;
        } else {
          graphY = h - graph.realValues[graphIndex] * yScale;
        }

        setCairoColor(cr, graph.colors.horizontal_intersect);
        cr.moveTo(0, graphY);
        cr.lineTo(w, graphY);
        cr.stroke();

        // Draw circle at intersection
        cr.arc(graphWidget.lastX, graphY, 4, 0, 2 * Math.PI);
        cr.fill();

        // Labels
        if (graph.xIntersect.label) {
          let value = 0;
          if (graphIndex >= graph.realValues.length && graph.fit) {
            value = graph.fit.slope * graphIndex + graph.fit.intercept;
          } else {
            value = graph.realValues[graphIndex];
          }

          cr.setFontSize(20);

          let text = "";
          if (graph.xIntersect.labelTransform) {
            text = graph.xIntersect.labelTransform(value);
          } else {
            text = `${value}`;
          }

          const extents = cr.textExtents(text);
          cr.moveTo(w - extents.width, graphY - 5);
          cr.showText(text);
        }
      }
    });
  });

  Graph.eventController.connect("enter", () => {
    Graph.drawEnabled = true;
    Graph.drawIntersect = true;
  });

  Graph.eventController.connect("leave", () => {
    Graph.drawIntersect = false;
    Graph.queue_draw();
    Graph.drawEnabled = false;
  });

  Graph.eventController.connect("motion", (_, x, y) => {
    Graph.lastX = x;
    Graph.lastY = y;
    Graph.queue_draw();
  });

  Graph.add_controller(Graph.eventController);

  return Scrollable({
    hexpand: true,
    setup: (self) => {
      // @TODO Why can't I set these using properties directly? Doesn't `astalify` enable that?
      self.hscrollbar_policy = Gtk.PolicyType.ALWAYS;
      self.vscrollbar_policy = Gtk.PolicyType.ALWAYS;
      self.set_child(
        Widget.Box({
          hexpand: true,
          vexpand: true,
          children: [Graph],
        }),
      );
    },
  });
};
