/**
 * Displays all events for the currently selected week.
 */

import { App, Gtk, Gdk, Widget, astalify, hook } from "astal/gtk4";
import { timeout } from "astal/time";
import { Gridlines } from "@/windows/dash/calendar/week/Gridlines";
import { EventBox } from "@/windows/dash/calendar/week/EventBox";
import Calendar, { Event, uiVars } from "@/services/Calendar";

/*****************************************************
 * HELPER FUNCTIONS
 *****************************************************/

/**
 * WeekViewContents true if events A and B collide.
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
const collidesWith = (a: Event, b: Event): boolean => {
  return a.endFH > b.startFH && a.startFH < b.endFH;
};

const isWithin = (a: Event, b: Event): boolean => {
  return a.startFH > b.startFH && a.endFH < b.endFH;
};

const coordToFloatHour = (yCoord: number, height: number): number => {
  return Math.round(((yCoord / height) * 24) / 0.25) * 0.25;
};

const coordToWeekday = (xCoord: number, width: number): number => {
  return Math.floor((xCoord / width) * 6 + 0.5);
};

/*****************************************************
 * WIDGET DEFINITION
 *****************************************************/

export const WeekView = () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);
  const Fixed = astalify(Gtk.Fixed);
  const cal = Calendar.get_default();

  const WeekViewContent = Fixed({
    cssClasses: ["week-view"],
    vexpand: true,
    hexpand: false,
    setup: (self) => {
      /* Cache data when viewrange changes */
      hook(
        self,
        cal,
        "viewrange-changed",
        (self, viewrange: Array<String>, viewdata: Object) => {
          self.viewdata = viewdata;
          self.viewrange = viewrange;
        },
      );

      /* Before rendering, we need to wait until this widget's size
       * has been allocated. This happens shortly after the "realize"
       * signal is emitted. */
      self.connect("realize", () => {
        timeout(20, () => {
          for (let i = 0; i < 7; i++) {
            renderWeekViewContent(i);
          }
        });
      });
    },
  });

  /**
   * Render weekview content for a specific day.
   */
  const renderWeekViewContent = (index: number) => {
    print("Rendering weekview content");
    /* Clear old events */
    // for (const child of self.children) {
    //   self.remove(child);
    // }

    /* Draw new events */
    const events: Array<Event> =
      WeekViewContent.viewdata[WeekViewContent.viewrange[index]];
    let group: Array<Event> = [];
    let lastGroupEventEnd: number | null = 0;
    let placed = false;

    events.forEach((currEvent) => {
      if (currEvent.startFH >= lastGroupEventEnd) {
        packEvents(group, index);
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
        packEvents(group, index);
        group = [];
        group.push(currEvent);
      }

      if (lastGroupEventEnd == null || currEvent.endFH > lastGroupEventEnd) {
        lastGroupEventEnd = currEvent.endFH;
      }
    });

    if (group.length > 0) {
      packEvents(group, index);
    }
  };

  /**
   * Pack a group of events.
   *
   * @param {Array<Event>} group - group of events to render
   * @param {number} index - the index of the day of the week that is
   * being rendered
   */
  const packEvents = (group: Array<Event>, index: number) => {
    for (let i = 0; i < group.length; i++) {
      /* Multi-day events are handled in `MultiDayEvents.ts` */
      if (group[i].multiDay || group[i].allDay) continue;

      const h = WeekViewContent.get_allocated_height();
      const w = WeekViewContent.get_allocated_width() / 7;

      const xPos = (i / group.length) * (w / group.length);
      const yPos = group[i].startFH * (h / 24) * uiVars.heightScale;

      const eBox = EventBox(group[i], h * uiVars.heightScale, w);
      eBox.widthRequest = w - xPos;

      WeekViewContent.put(eBox, xPos + w * index, yPos);

      /* Make widget draggable with GtkGestureDrag */
      const drag = new Gtk.GestureDrag();

      /* Store drag state */
      let offsetX = 0;
      let offsetY = 0;
      let startX = 0;
      let startY = 0;
      let lastMovedValue = null;
      let dragging = false;
      let needsUpdate = false;

      /* Use FrameClock to throttle updates */
      const frameClock = App.get_window("dash")
        .get_surface()
        ?.get_frame_clock();
      frameClock?.connect("update", () => {
        if (needsUpdate) {
          const wouldBeNewValue =
            coordToWeekday(offsetX, WeekViewContent.get_allocated_width()) * w;

          if (
            lastMovedValue == null ||
            Math.abs(wouldBeNewValue - lastMovedValue) > 200
          ) {
            WeekViewContent.move(eBox, wouldBeNewValue, offsetY);
            lastMovedValue = wouldBeNewValue;
          } else {
            WeekViewContent.move(eBox, lastMovedValue, offsetY);
          }

          needsUpdate = false;
        }
      });

      drag.connect("drag-begin", (_, x, y) => {
        dragging = true;
        startX = x;
        startY = y;

        /* Get the current position of the widget */
        const [widgetX, widgetY] = WeekViewContent.get_child_position(eBox);
        offsetX = widgetX;
        offsetY = widgetY;
      });

      /* Handle drag update */
      drag.connect("drag-update", (_, deltaX, deltaY) => {
        if (!dragging) return;

        offsetX += deltaX;
        offsetY += deltaY;
        needsUpdate = true;
        frameClock?.request_phase(Gdk.FrameClockPhase.UPDATE);
      });

      /* Handle drag end */
      drag.connect("drag-end", () => {
        dragging = false;
      });

      eBox.add_controller(drag);
    }
  };

  /* Wrap final contents in scrollable. */
  return Scrollable({
    vexpand: true,
    hexpand: true,
    visible: true,
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    child: Widget.Overlay({
      child: Gridlines(),
      setup: (self) => {
        self.add_overlay(WeekViewContent);
      },
    }),
  });
};
