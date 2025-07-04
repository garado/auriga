/* A stack of widgets with built-in arrow buttons to cycle between widgets in the stack.
 * The widget stack wraps around when navigating. */

import { Gtk, Widget } from "astal/gtk4";
import { SmartStack } from "./SmartStack";
import { Variable } from "astal";

export interface CarouselContents {
  ui: () => void /* Function which generates a widget */;
  name: string;
}

export const Carousel = (children: Array<CarouselContents>) => {
  const activeWidgetName = Variable(children[0].name);

  const stack = SmartStack({
    children: children,
    bindNamedSwitchTo: activeWidgetName,
  });

  return Widget.Box({
    cssClasses: ["widget-container", "carousel"],
    children: [
      Widget.Label({
        label: bind(activeWidgetName),
      }),
      stack,
    ],
  });
};
