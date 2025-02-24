/**
 * Displays events for a given day.
 */

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { Event, uiVars } from "@/services/Calendar";
import { EventBox } from "@/windows/dash/calendar/week/EventBox";
import { timeout } from "astal/time";

/*****************************************************
 * HELPER FUNCTIONS
 *****************************************************/

/**
 * Returns true if events A and B collide.
 * Note: FH stands for 'float hour'
 * It is a way to represent the time of day as a float, where every
 * whole number represents one full hour.
 *
 * Time         Equivalent FH
 * -----        -------------
 * 12AM     ->  0.0
 * 9:15AM   ->  9.25
 * 5:30PM   ->  17.5
 * 11:59PM  ->  23.983333333
 *
 **/
const collidesWith = (a: number, b: number): boolean => {
  return a.endFH > b.startFH && a.startFH < b.endFH;
};

const isWithin = (a: number, b: number): boolean => {
  return a.startFH > b.startFH && a.endFH < b.endFH;
};

/*****************************************************
 * WIDGET DEFINITION
 *****************************************************/

export const DayView = (index: Number) => {
  const Fixed = astalify(Gtk.Fixed);
  const cal = Calendar.get_default();

  const Return = Fixed({
    visible: true,
    vexpand: true,
    setup: (self) => {
      /* Cache data when viewrange changes */
      hook(
        self,
        cal,
        "viewrange-changed",
        (self, viewrange: Array<String>, viewdata: Object) => {
          self.events = viewdata[viewrange[self.index]];
        },
      );

      /* Wait until size allocation */
      self.connect("realize", () => {
        timeout(10, () => {
          render();
        });
      });
    },
  });

  const render = () => {
    /* Clear old events */
    // for (const child of self.children) {
    //   self.remove(child);
    // }

    /* Draw new events */
    const events: Array<Event> = Return.events;
    let group = [];
    let lastGroupEventEnd = null;
    let placed = false;

    events.forEach((currEvent) => {
      if (currEvent.startFH >= lastGroupEventEnd) {
        packEvents(group);
        group = [];
        lastGroupEventEnd = null;
      }

      placed = false;

      for (let i = 0; i < group.length; i++) {
        if (collidesWith(group[i], currEvent)) {
          group.push(currEvent);
          placed = true;
          break;
        }
      }

      if (!placed) {
        packEvents(group);
        group = [];
        group.push(currEvent);
      }

      if (lastGroupEventEnd == null || currEvent.endFH > lastGroupEventEnd) {
        lastGroupEventEnd = currEvent.endFH;
      }
    });

    if (group.length > 0) {
      packEvents(group);
    }
  };

  /**
   * Helper function for drawing events
   */
  const packEvents = (group: Array<Event>) => {
    for (let i = 0; i < group.length; i++) {
      /* Drawing multi-day events will be handled elsewhere. */
      if (group[i].multiDay || group[i].allDay) continue;

      const h = Return.get_allocated_height();
      const w = Return.get_allocated_width();

      const xPos = (i / group.length) * (w / group.length);
      const yPos = group[i].startFH * (h / 24) * uiVars.heightScale;

      const eBox = EventBox(group[i], h * uiVars.heightScale, w);
      eBox.widthRequest = w - xPos;

      Return.put(eBox, xPos, yPos);
    }
  };

  Object.assign(Return, {
    index: index,
  });

  return Return;
};
