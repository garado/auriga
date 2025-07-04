
/* █▀▀ ▄▀█ █▄░█ █▀▀ █▄█   █▀▀ █▀█ ▄▀█ █▀█ █░█ */
/* █▀░ █▀█ █░▀█ █▄▄ ░█░   █▄█ █▀▄ █▀█ █▀▀ █▀█ */

/* With popups and such */

import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk';

import LedgerService from '../services/ledger/ledger.js'
  
/**
 * To get CSS information for the FancyGraph widget, you need to do some
 * weird CSS shit
 */
const getCairoColorFromClass = (...rest) => {
  const dummyWidget = new Gtk.Box()
  const dummyContext = dummyWidget.get_style_context()
  
  for (const c of rest) {
    dummyContext.add_class(c)
  }

  return dummyContext.get_color(Gtk.StateFlags.NORMAL)
}

const setCairoColor = (cr, color) => {
  cr.setSourceRGBA(color.red, color.green, color.blue, color.alpha)
}


/**
 * @function fit
 * @brief Calculate line of best fit equation
 */
const fit = (points) => {
  const n = points.length

  if (n === 0) return null

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

  for (let x = 0; x  < points.length; x++) {
    sumX += x
    sumY += points[x]
    sumXY += x * points[x]
    sumX2 += x * x
  }

  let m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2)
  let b = (sumY - m * sumX) / n

  return { slope: m, intercept: b }
}


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
  className = 'graph',
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
    graph.colors = {}
    graph.colors.horizontal_intersect = getCairoColorFromClass(graph.className, 'horizontal-intersect')
    graph.colors.fit  = getCairoColorFromClass(graph.className, 'fit')
    graph.colors.plot = getCairoColorFromClass(graph.className, 'plot')
  }

  /* Globals */
  let valueMax = Math.max(...graphs.map(g => Math.max(...g.values)))
  let valueMin = Math.min(...graphs.map(g => Math.min(...g.values)))
  let longestArrayLength = Math.max(...graphs.map(g => g.values.length))

  /* Initialization */
  graphs.forEach(graph => {
    cacheGraphColors(graph)

    if (graph.calculateFit) {
      graph.fit = fit(graph.values)

      const lastFitVal = (graph.fit.slope * longestArrayLength) + graph.fit.intercept

      if (lastFitVal > valueMax) valueMax = lastFitVal
      if (lastFitVal < valueMin) valueMin = lastFitVal
    }
  })

  const Graph = Widget.DrawingArea({
    widthRequest:  2000,
    heightRequest: hRequest,
    className: className,
    hexpand: true,
    vexpand: true,
    hpack: 'center',
    vpack: 'center',
    ...rest,

    setup: self => {
      self.colors = {
        grid: getCairoColorFromClass(className, 'grid'),
        vertical_intersect: getCairoColorFromClass(className, 'vertical-intersect')
      }
    },

    drawFn: (self, cr, w, h) => {
      const xScale = (1 / longestArrayLength) * w
      const yScale = (1  / (valueMax - valueMin)) * h

      /* Plot grid ------------------------------------------------------- */
      if (grid.enable) {
        setCairoColor(cr, self.colors.grid)
        cr.setDash([], 0)

        /* ylines */
        for (let y = grid.yStepPercent; y < 100; y += grid.yStepPercent) {
          cr.moveTo(0, (y / 100) * h)
          cr.lineTo(w, (y / 100) * h)
        }
        cr.stroke()
        
        for (let x = grid.xStepPercent; x < 100; x += grid.xStepPercent) {
          cr.moveTo((x / 100) * w, 0)
          cr.lineTo((x / 100) * w, h)
        }
        cr.stroke()
      }

      /* Plot vertical intersection line --------------------------------- */
      if (yIntersect && self.drawIntersect) {
        setCairoColor(cr, self.colors.vertical_intersect)
        cr.moveTo(self.lastX, 0)
        cr.lineTo(self.lastX, h)
        cr.stroke()
      }

      graphs.forEach(graph => {        
        /* Plot line of best fit, if applicable ---------------------------- */
        if (graph.calculateFit) {
          setCairoColor(cr, graph.colors.fit)
          cr.setDash([10, 5], 0) // 10-unit dash, 5-unit gap, 0 offset
          cr.moveTo(0, h - (graph.fit.intercept * yScale))
          cr.lineTo(w, h - ((graph.fit.slope * longestArrayLength) + graph.fit.intercept) * yScale)
          cr.stroke()
          cr.setDash([], 0)
        }
        
        /* Plot values ----------------------------------------------------- */
        setCairoColor(cr, graph.colors.plot)

        if (graph.dashed) cr.setDash([10, 5], 0)
          
        cr.moveTo(0, h)
        for (let i = 0; i < graph.values.length; i++) {
          cr.lineTo(i * xScale, h - (graph.values[i] * yScale))
        }
        cr.stroke()

        if (graph.dashed) cr.setDash([], 0)

        /* Plot horizontal intersection line ------------------------------- */
        if (self.drawIntersect && graph.xIntersect.enable) {
          const graphIndex = Math.round((self.lastX / w) * longestArrayLength)
          if (graphIndex >= graph.values.length && !graph.calculateFit) return

          let graphY = 0
          if (graphIndex >= graph.values.length && graph.calculateFit) {
            graphY = h - (((graphIndex * graph.fit.slope) + graph.fit.intercept) * yScale)
          } else {
            graphY = h - (graph.values[graphIndex] * yScale);
          }

          setCairoColor(cr, graph.colors.horizontal_intersect)
          cr.moveTo(0, graphY)
          cr.lineTo(w, graphY)
          cr.stroke()

          /* Draw circle at intersection */
          cr.arc(self.lastX, graphY, 4, 0, 2 * Math.PI)
          cr.fill()

          /* Label */
          if (graph.xIntersect.label) {
            let value = 0
            if (graphIndex >= graph.values.length && graph.fit) {
              value = (graph.fit.slope * graphIndex) + graph.fit.intercept
            } else {
              value = graph.values[graphIndex]
            }

            cr.setFontSize(20)

            let text = ''
            if (graph.xIntersect.labelTransform) {
              text = graph.xIntersect.labelTransform(value)
            } else {
              text = `${value}`
            }
            
            const extents = cr.textExtents(text)
            cr.moveTo(w - extents.width, graphY - 5)
            cr.showText(text)
          }
        }
      })
    }
  })

  Object.assign(Graph, {
    drawEnabled: false,
    drawIntersect: true,
    lastX: -1,
    lastY: -1,
  })

  Graph.add_events(Gdk.EventMask.LEAVE_NOTIFY_MASK)
  Graph.add_events(Gdk.EventMask.ENTER_NOTIFY_MASK)
  Graph.add_events(Gdk.EventMask.POINTER_MOTION_MASK)

  Graph.connect('leave-notify-event', (self, event) => {
    self.drawIntersect = false
    self.queue_draw()
    self.drawEnabled = false
  })

  Graph.connect('enter-notify-event', (self, event) => {
    self.drawEnabled = true 
    self.drawIntersect = true
  })

  Graph.connect('motion-notify-event', (self, event) => {
    const coords = event.get_coords()
    self.lastX = coords[1]
    self.lastY = coords[2]
    self.queue_draw()
  })
  
  return Widget.Scrollable({
    hscroll: 'always',
    vscroll: 'always',
    hexpand: true,
    css: 'min-width: 1px',
    child: Widget.Box({
      // widthRequest:  1000,
      // heightRequest: 1000,
      hexpand: true,
      vexpand: true,
      children: [Graph],
    }),
  })
}
