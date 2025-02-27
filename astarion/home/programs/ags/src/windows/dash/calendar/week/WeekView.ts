/* Custom widget implementation for calendar week view, which
 * displays all events for a given week. */

import { Gdk, Gtk, Widget, hook } from "astal/gtk4";
import { register, property, signal } from "astal/gobject";
import { timeout } from "astal";
import Calendar, { Event, fhToTimeStr, uiVars } from "@/services/Calendar";
import { EventBox } from "@/windows/dash/calendar/week/EventBox";

const cal = Calendar.get_default();

/*********************************************************
 * MISC
 *********************************************************/

/**
 * Returns true if events A and B collide.
 **/
const collidesWith = (a: Event, b: Event): boolean => {
  return !(a.endTS <= b.startTS || b.endTS <= a.startTS);
};

/*********************************************************
 * WIDGET DEFINITION
 *********************************************************/

interface WeekViewProps extends Gtk.Fixed.ConstructorProps {}

@register({ GTypeName: "WeekView" })
export class _WeekView extends Gtk.Fixed {
  /* Properties */

  /* Private */
  private viewdata;
  private viewrange;
  private children;
  private height;
  private width;
  private id;

  /**********************************************
   * PRIVATE FUNCTIONS
   **********************************************/

  constructor(props?: Partial<WeekViewProps>) {
    super(props as any);

    this.vexpand = false;
    this.hexpand = false;

    hook(
      this,
      cal,
      "viewrange-changed",
      (_, viewrange: Array<String>, viewdata: Object) => {
        this.viewdata = viewdata;
        this.viewrange = viewrange;

        /* Create a place to store widget references */
        this.children = [];
        this.id = 0;
      },
    );

    /* Before rendering, we need to wait until this widget's size
     * has been allocated. This happens shortly after the "realize"
     * signal is emitted. */
    this.connect("realize", () => {
      timeout(10, () => {
        this.height = this.get_allocated_height();
        this.width = this.get_allocated_width();
        this.createAll();
      });
    });
  }

  /**
   * Render all events for every day in the given week.
   */
  createAll = () => {
    for (let i = 0; i < 7; i++) {
      /* Clear existing widgets (TODO) */

      this.layoutDate(this.viewrange[i]);
    }
  };

  /**
   * Render the events for a given date.
   * @param {string} date - The date whose events to render.
   */
  layoutDate = (date: string) => {
    let events: Array<Event> = this.viewdata[date];

    const index = this.viewrange.indexOf(date);

    let group: Array<Event> = [];
    let lastGroupEventEnd: number | null = 0;
    let placed = false;

    events.forEach((currEvent) => {
      if (currEvent.startFH >= lastGroupEventEnd) {
        this.createCollidingEvents(group, index);
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
        this.createCollidingEvents(group, index);
        group = [];
        group.push(currEvent);
      }

      if (lastGroupEventEnd == null || currEvent.endFH > lastGroupEventEnd) {
        lastGroupEventEnd = currEvent.endFH;
      }
    });

    if (group.length > 0) {
      this.createCollidingEvents(group, index);
    }
  };

  /**
   * Render a group of overlapping eventboxes.
   * If group.length == 1, then render the eventbox normally.
   *
   * @param {Array<Event>} group - group of events to render
   * @param {number} index - the index of the day of the week that is
   * being rendered
   */
  createCollidingEvents = (group: Array<Event>, index: number) => {
    group = group.sort((a, b) => {
      if (a.durationFH > b.durationFH) return -1;
      if (a.durationFH < b.durationFH) return 1;
      if (a.startTS > b.startTS) return -1;
      if (a.startTS > b.startTS) return 1;
    });

    for (let i = 0; i < group.length; i++) {
      /* Multi-day events are handled in `MultiDayEvents.ts` */
      if (group[i].multiDay || group[i].allDay) continue;

      const h = this.height * uiVars.heightScale;
      const w = this.width / 7;

      const xPos = (i / group.length) * (w / group.length);
      const yPos = group[i].startFH * (h / 24);

      const eBox = EventBox({
        event: group[i],
        dayHeight: h,
        dayWidth: w,
        id: this.id++,
      });

      eBox.widthRequest = w - xPos;

      /* Make sure to update UI when dragged */
      eBox.connect("dragged", this.renderEventsAfterChange);

      this.put(eBox, xPos + w * index, yPos);

      /* Store child reference since Gtk.Fixed doesn't store it automatically */
      this.children.push(eBox);
    }
  };

  /**
   * Handle redrawing after an eventbox is moved.
   * To avoid UI update issues, this function finds the eventboxes
   * that were affected by the move, and only redraws/repositions
   * those.
   *
   * @param {EventBox} moved - The eventbox that was moved.
   */
  renderEventsAfterChange = (moved) => {
    /* Find events that collided with the moved event's previous position. */
    let collisionsOnOldDate = this.children.filter((e) => {
      return collidesWith(e.event, moved.event);
    });

    this.replaceCollidingEvents(collisionsOnOldDate);

    /* Render new date */
    moved.event = moved.updatedEvent;

    const collisionsOnNewDate = this.children.filter((e) => {
      return collidesWith(e.event, moved.event);
    });

    this.replaceCollidingEvents(collisionsOnNewDate);

    moved.updateUI();
  };

  replaceCollidingEvents = (group) => {
    group = group.sort((a, b) => {
      if (a.event.durationFH > b.event.durationFH) return -1;
      if (a.event.durationFH < b.event.durationFH) return 1;
      if (a.event.startTS > b.event.startTS) return -1;
      if (a.event.startTS > b.event.startTS) return 1;
    });

    /* You cannot control z-offset of Gtk.Fixed children.
     * Widgets that are added first are drawn first. */
    const idList = group.map((e) => e.id);
    const isSorted = idList.every((val, i) => i === 0 || val >= idList[i - 1]);

    if (!isSorted) {
      group.map((e) => {
        this.remove(e);
        e.id = this.id++;
      });
    }

    for (let i = 0; i < group.length; i++) {
      const h = this.height * uiVars.heightScale;
      const w = this.width / 7;

      const xPos = (i / group.length) * (w / group.length);
      const yPos = group[i].event.startFH * (h / 24);

      group[i].widthRequest = w - xPos;

      if (!isSorted) {
        this.put(
          group[i],
          xPos + w * this.viewrange.indexOf(group[i].event.startDate),
          yPos,
        );
      } else {
        this.move(
          group[i],
          xPos + w * this.viewrange.indexOf(group[i].event.startDate),
          yPos,
        );
      }
    }
  };
}

export const WeekView = (props: Partial<WeekViewProps>) => {
  return new _WeekView(props);
};
