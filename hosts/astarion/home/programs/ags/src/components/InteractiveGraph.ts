/* █▀▀ ▄▀█ █▄░█ █▀▀ █▄█   █▀▀ █▀█ ▄▀█ █▀█ █░█ */
/* █▀░ █▀█ █░▀█ █▄▄ ░█░   █▄█ █▀▄ █▀█ █▀▀ █▀█ */

/* With popups and such */

import { Gtk, Widget, astalify } from "astal/gtk4";
import Gdk from "gi://Gdk";

import Ledger from "@/services/Ledger";

const DrawingArea = astalify(Gtk.DrawingArea);
const Scrollable = astalify(Gtk.ScrolledWindow);

export type GraphData = {
  name: string;
  values: Array<number>;
  color: string;
};

/**
 * To get CSS information for the FancyGraph widget, you need to do some
 * weird CSS shit
 *
 * @param {Array<string>} ...rest - combined class to get the color for
 */
const getCairoColorFromClass = (...rest: Array<string>) => {
  const dummyWidget = new Gtk.Box();
  const dummyContext = dummyWidget.get_style_context();

  for (const c of rest) {
    dummyContext.add_class(c);
  }

  return dummyContext.get_color();
};

/**
 * Set Cairo context source color.
 *
 * @param cr - Cairo context
 * @param color -
 */
const setCairoColor = (cr, color) => {
  cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha);
};

/**
 * Calculate line of best fit equation
 *
 * @param {Array<number>} points - array of points for which to calculate
 * the line of best fit
 */
const fit = (points: Array<number>) => {
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

/**
 * graphs[] is a list of graph data objects.
 *
 * Sample graph data object:
 *
 * {
 *    name:   'Graph name',
 *    values: [], // array of values to plot
 *    color:  'colorAsHexString',
 * }
 */
export default ({
  grid = {
    enable: false,
  },
  graphs = [],
  cssClasses = ["interactive-graph"],
  yIntersect = true,
  yIntersectLabel = true,

  /* Phase these out */
  wRequest = 300,
  hRequest = 200,
  ...rest
}) => {
  /**
   * Cache graph colors so we don't have to do this every draw
   */
  const cacheGraphColors = (graph) => {
    graph.colors = {};
    graph.colors.horizontal_intersect = getCairoColorFromClass(
      graph.cssClass,
      "horizontal-intersect",
    );
    graph.colors.fit = getCairoColorFromClass(graph.cssClass, "fit");
    graph.colors.plot = getCairoColorFromClass(graph.cssClass, "plot");
  };

  const setupData = (self) => {
    /* Globals */
    for (const graph of graphs) {
      cacheGraphColors(graph);

      if (Array.isArray(graph.values)) {
        graph.realValues = graph.values;
      } else {
        graph.realValues = graph.values.get();
      }

      if (graph.calculateFit) {
        graph.fit = fit(graph.realValues);

        const lastFitVal =
          graph.fit.slope * self.longestArrayLength + graph.fit.intercept;

        if (lastFitVal > self.valueMax) self.valueMax = lastFitVal;
        if (lastFitVal < self.valueMin) self.valueMin = lastFitVal;
      }
    }

    self.valueMax = Math.max(...graphs.map((g) => Math.max(...g.realValues)));
    self.valueMin = Math.min(...graphs.map((g) => Math.min(...g.realValues)));
    self.longestArrayLength = Math.max(
      ...graphs.map((g) => g.realValues.length),
    );
  };

  const Graph = DrawingArea({
    widthRequest: 2000,
    heightRequest: hRequest,
    cssClasses: [...cssClasses, "interactive-graph"],
    hexpand: true,
    vexpand: true,
    hpack: "center",
    vpack: "center",
    ...rest,

    setup: (self) => {
      self.colors = {
        grid: getCairoColorFromClass(...cssClasses, "grid"),
        vertical_intersect: getCairoColorFromClass(
          ...cssClasses,
          "vertical-intersect",
        ),
      };
    },
  });

  Graph.set_draw_func((self, cr, w, h) => {
    setupData(self);

    const xScale = (1 / self.longestArrayLength) * w;
    const yScale = (1 / (self.valueMax - self.valueMin)) * h;

    /* Plot grid ------------------------------------------------------- */
    if (grid.enable) {
      setCairoColor(cr, self.colors.grid);
      cr.setDash([], 0);

      /* ylines */
      for (let y = grid.yStepPercent; y < 100; y += grid.yStepPercent) {
        cr.moveTo(0, (y / 100) * h);
        cr.lineTo(w, (y / 100) * h);
      }
      cr.stroke();

      for (let x = grid.xStepPercent; x < 100; x += grid.xStepPercent) {
        cr.moveTo((x / 100) * w, 0);
        cr.lineTo((x / 100) * w, h);
      }
      cr.stroke();
    }

    /* Plot vertical intersection line --------------------------------- */
    if (yIntersect && self.drawIntersect) {
      setCairoColor(cr, self.colors.vertical_intersect);
      cr.moveTo(self.lastX, 0);
      cr.lineTo(self.lastX, h);
      cr.stroke();
    }

    graphs.forEach((graph) => {
      /* Plot line of best fit, if applicable ---------------------------- */
      if (graph.calculateFit) {
        setCairoColor(cr, graph.colors.fit);
        cr.setDash([10, 5], 0); // 10-unit dash, 5-unit gap, 0 offset
        cr.moveTo(0, h - graph.fit.intercept * yScale);
        cr.lineTo(
          w,
          h -
            (graph.fit.slope * self.longestArrayLength + graph.fit.intercept) *
              yScale,
        );
        cr.stroke();
        cr.setDash([], 0);
      }

      /* Plot values ----------------------------------------------------- */
      setCairoColor(cr, graph.colors.plot);

      if (graph.dashed) cr.setDash([10, 5], 0);

      cr.moveTo(0, h);
      for (let i = 0; i < graph.realValues.length; i++) {
        cr.lineTo(i * xScale, h - graph.realValues[i] * yScale);
      }
      cr.stroke();

      if (graph.dashed) cr.setDash([], 0);

      /* Plot horizontal intersection line ------------------------------- */
      if (self.drawIntersect && graph.xIntersect.enable) {
        const graphIndex = Math.round(
          (self.lastX / w) * self.longestArrayLength,
        );
        if (graphIndex >= graph.realValues.length && !graph.calculateFit)
          return;

        let graphY = 0;
        if (graphIndex >= graph.realValues.length && graph.calculateFit) {
          graphY =
            h - (graphIndex * graph.fit.slope + graph.fit.intercept) * yScale;
        } else {
          graphY = h - graph.realValues[graphIndex] * yScale;
        }

        setCairoColor(cr, graph.colors.horizontal_intersect);
        cr.moveTo(0, graphY);
        cr.lineTo(w, graphY);
        cr.stroke();

        /* Draw circle at intersection */
        cr.arc(self.lastX, graphY, 4, 0, 2 * Math.PI);
        cr.fill();

        /* Label */
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

  Object.assign(Graph, {
    drawEnabled: false,
    drawIntersect: true,
    lastX: -1,
    lastY: -1,
    eventController: new Gtk.EventControllerMotion(),
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
    hscroll: "always",
    vscroll: "always",
    hexpand: true,
    css: "min-width: 1px",
    child: Widget.Box({
      hexpand: true,
      vexpand: true,
      children: [Graph],
    }),
  });
};
