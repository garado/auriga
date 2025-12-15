/**
 * █▀▀ █░░ █▀█ █▀▀ █▄▀
/* █▄▄ █▄▄ █▄█ █▄▄ █░█
 *
 * It's a clock.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { Variable, bind, interval } from "astal";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

// For clock widget
const time = Variable("");
const date = Variable("");

interval(1000, () => {
  const now = new Date();

  const newDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const newTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  time.set(newTime);
  date.set(newDate);
});

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Clock = () =>
  Widget.Box({
    cssClasses: ["clock"],
    spacing: 6,
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: ["time"],
        label: bind(time),
      }),
      Widget.Label({
        cssClasses: ["date"],
        label: bind(date),
      }),
    ],
  });
