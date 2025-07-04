
// █▀ █ █▀▄▀█ █▀█ █░░ █▀▀   █▀▀ █▀█ ▄▀█ █▀█ █░█
// ▄█ █ █░▀░█ █▀▀ █▄▄ ██▄   █▄█ █▀▄ █▀█ █▀▀ █▀█

import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from 'gi://Gtk?version=3.0';
import Gdk from 'gi://Gdk';

export default (args) => Widget.DrawingArea({
  widthRequest:  args.w ? args.w : 300,
  heightRequest: args.h ? args.h : 170,
  hpack: 'center',
  vpack: 'center',
  className: args.className ? args.className : '',

  drawFn: (self, cr, w, h) => {
    const xMax = args.values.length
    const yMax = Math.max(...args.values)

    // Get colors
    const styles = self.get_style_context();
    const fg = styles.get_color(Gtk.StateFlags.NORMAL);
    const bg = styles.get_background_color(Gtk.StateFlags.NORMAL);

    // Grid
    if (args.grid) {
      cr.setSourceRGBA(bg.red, bg.green, bg.blue, bg.alpha)
      for (let i = 0; i < args.values.length; i+=2) {
        const xScaled = (i / xMax) * w
        cr.moveTo(xScaled, 0)
        cr.lineTo(xScaled, h)
      }
      cr.stroke()
    }

    // Graph
    const PADDING = 40
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha)
    cr.moveTo(0, h)
    for (let i = 0; i < args.values.length; i++) {
      // Normalize values to fit in widget
      const xScaled = ((i+1) / xMax) * w
      const yScaled = ((args.values[i] / yMax) * h) - PADDING

      cr.lineTo(xScaled, h - yScaled)
      cr.stroke()
      cr.moveTo(xScaled, h - yScaled)
    }
    cr.stroke()
  }
})
