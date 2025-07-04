import { Gtk, Widget, astalify } from "astal/gtk4";
import Gdk from "gi://Gdk";

const DrawingArea = astalify(Gtk.DrawingArea);

/**
 * To get CSS information for the FancyBar widget, you need to do some
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

export default ({
  heightRequest = 500,
  widthRequest = 10,
  value = 0,
  minValue = 0,
  maxValue = 0,
  ...rest
}) => {
  /**
   * Cache graph colors so we don't have to do this every draw
   */
  const cacheBarColors = (graph) => {};

  const setupData = (self) => {};

  const Bar = DrawingArea({
    hexpand: false,
    vexpand: false,
    widthRequest: widthRequest,
    heightRequest: heightRequest,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    cssClasses: ["bar-graph"],
    hasTooltip: true,
    tooltipText: `${value.toFixed()}`,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
  });

  Bar.set_draw_func((self, cr, w, h) => {
    setCairoColor(cr, getCairoColorFromClass("bar-graph-bar-bg"));

    cr.rectangle(
      0,
      0,
      widthRequest,
      heightRequest - (value / maxValue) * heightRequest,
    ); // x, y, width, height

    cr.fill();
    cr.stroke();
  });

  return Bar;
};
