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
import { Variable, bind } from "astal";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const time = Variable("").poll(1000, "date '+%H:%M'");
const date = Variable("").poll(1000, "date '+%A %d %B %Y'");

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
