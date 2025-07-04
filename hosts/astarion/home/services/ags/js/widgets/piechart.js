
// █▀█ █ █▀▀   █▀▀ █░█ ▄▀█ █▀█ ▀█▀
// █▀▀ █ ██▄   █▄▄ █▀█ █▀█ █▀▄ ░█░

import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from 'gi://Gtk?version=3.0';

const getCairoColorFromClass = (...rest) => {
  const dummyWidget = new Gtk.Box()
  const dummyContext = dummyWidget.get_style_context()
  
  for (const c of rest) {
    dummyContext.add_class(c)
  }

  return dummyContext.get_color(Gtk.StateFlags.NORMAL)
}

const cachePieColors = () => {
  const pieColors = []

  for (let i = 1; i < 11; i++) {
    pieColors.push(getCairoColorFromClass(`pie-slice-${i}`))
  }

  return pieColors
}

// "values" is an array of numbers
// widget will calculate everything for you
export default (values) => {
  const Pie = Widget.DrawingArea({
    widthRequest:  200,
    heightRequest: 200,

    setup: self => {
      self.pieColors = cachePieColors()

      globalThis.systemTheme.connect('changed', () => {
        self.pieColors = cachePieColors()
      })
    },

    drawFn: (self, cr, w, h) => {

      const radius = w / 2

      const center = {
        x: w / 2,
        y: h / 2,
      }

      cr.setLineWidth(2)

      const maxValue = values.reduce((partialSum, a) => partialSum + a, 0);

      let r = 1 // to change color
      let lastAngle = 0

      for (let i = 0; i < values.length; i++) {
        // Get color
        const clr = self.pieColors[i]
        cr.setSourceRGBA(clr.red, clr.green, clr.blue, 1)

        // Max angle is Math.PI * 2
        const startAngle = lastAngle
        const diff = (values[i] / maxValue) * (Math.PI * 2)

        cr.arc(center.x, center.y, radius, startAngle, startAngle + diff)
        cr.lineTo(center.x, center.y)
        cr.fill()

        lastAngle = startAngle + diff
      }

    },
  })

  return Pie
}
