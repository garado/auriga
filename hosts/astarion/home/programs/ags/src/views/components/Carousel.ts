/* A stack of widgets with built-in arrow buttons to cycle between widgets in the stack.
 * The widget stack wraps around when navigating. */

import { Widget } from "astal/gtk4";
import { AnimatedStack } from "./AnimatedStack";
import { bind, Variable } from "astal";

export interface CarouselContents {
  ui: () => void /* Function which generates a widget */;
  name: string;
}

export const Carousel = (children: Array<CarouselContents>) => {
  const activeWidgetName = Variable(children[0].name);

  const stack = AnimatedStack({
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
