/**
 * █░█░█ █▀▀ █▀▀ █▄▀   █▀▀ █▀█ █ █▀▄
 * ▀▄▀▄▀ ██▄ ██▄ █░█   █▄█ █▀▄ █ █▄▀
 *
 * Week event grid container for 7-day calendar view.
 *
 * This component provides the main container/grid where calendar events are positioned
 * and displayed within a weekly view. It handles the layout logic for placing events
 * in their appropriate time slots and day columns, similar to Google Calendar's week view.
 *
 * @TODO Add keyboard navigation support
 * @TODO Optimize rendering for large numbers of events
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, hook } from "astal/gtk4";
import { property, register } from "astal/gobject";
import { timeout } from "astal";

import Calendar, { Event, uiVars } from "@/services/Calendar";
import { EventBox } from "@/windows/dash/calendar/week/EventBox";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const cal = Calendar.get_default();

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Returns true if events A and B collide.
 **/
const collidesWith = (a: Event, b: Event): boolean => {
  return !(a.endTS <= b.startTS || b.endTS <= a.startTS);
};

/*****************************************************************************
 * Class definition
 *****************************************************************************/

interface WeekGridProps extends Gtk.Fixed.ConstructorProps {}

@register({ GTypeName: "WeekGrid" })
export class _WeekGrid extends Gtk.Fixed {
  // Properties ----------------------------------------------------------------

  /**
   * Event data organized by date for the current week.
   */
  @property(Object)
  declare weekEvents: Record<string, Event[]>;

  /**
   * Array of 7 date strings (YYYY-MM-DD) representing the dates for the current week
   * being displayed.
   */
  @property(Object)
  declare weekDates: string[];

  /**
   * Array storing references to all child EventBox widgets.
   * Gtk.Fixed doesn't automatically track children, so manual tracking is needed for manipulation and cleanup
   */
  @property(Object)
  declare eventWidgets: (typeof EventBox)[];

  /**
   * The allocated pixel height of the WeekGrid widget, used for calculating event positions and sizes
   */
  @property(Number)
  declare containerHeight: number;

  /**
   * The allocated pixel width of the WeekGrid widget, used for calculating event positions and sizes
   */
  @property(Number)
  declare containerWidth: number;

  /**
   * Auto-incrementing counter used to assign unique IDs to EventBox widgets.
   * Higher IDs are rendered on top (z-order)
   */
  @property(Object)
  declare nextWidgetId: number;

  /**
   */
  @property(Boolean)
  declare isRealized: boolean;

  // Private functions ---------------------------------------------------------

  constructor(props?: Partial<WeekGridProps>) {
    super(props as any);

    this.vexpand = false;
    this.hexpand = false;

    // Update this widget when new data is available
    hook(this, cal, "weekdates-changed", () => {
      this.onNewDataAvailable();
    });

    // Sometimes calendar service finishes initializing before this widget does.
    // In that case, the hook above won't get triggered. So also run the hook manually.
    if (cal.initComplete) {
      this.onNewDataAvailable();
    }

    // Wait for size allocation before rendering widget so that child widgets can be properly positioned
    this.connect("realize", () => {
      timeout(50, () => {
        this.containerHeight = this.get_allocated_height();
        this.containerWidth = this.get_allocated_width();
        this.isRealized = true;
        this.tryRender();
      });
    });
  }

  /**
   * Runs when new data is available.
   */
  private onNewDataAvailable = () => {
    this.weekEvents = cal.weekEvents;
    this.weekDates = cal.weekDates;
    this.eventWidgets = [];
    this.nextWidgetId = 0;
    this.tryRender();
  };

  /**
   * Attempt to render the week grid.
   * We can only render the widget if data is available AND size is allocated.
   */
  private tryRender = () => {
    if (this.isRealized && cal.initComplete) {
      this.createAll();
    }
  };

  /**
   * Render all events for every day in the given week.
   */
  createAll = () => {
    for (let i = 0; i < 7; i++) {
      /* Clear existing widgets (TODO) */

      this.layoutDate(this.weekDates[i]);
    }
  };

  /**
   * Render the events for a given date.
   * @param {string} date - The date whose events to render.
   */
  layoutDate = (date: string) => {
    let events: Array<Event> = this.weekEvents[date];

    const index = this.weekDates.indexOf(date);

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

      const h = this.containerHeight;
      const w = this.containerWidth / 7;

      const xPos = (i / group.length) * (w / group.length);
      const yPos = group[i].startFH * (h / 24);

      const eBox = EventBox({
        event: group[i],
        dayHeight: h,
        dayWidth: w,
        id: this.nextWidgetId++,
      });

      eBox.widthRequest = w - xPos;

      /* Make sure to update UI when dragged */
      eBox.connect("dragged", this.renderEventsAfterChange);

      this.put(eBox, xPos + w * index, yPos);

      /* Store child reference since Gtk.Fixed doesn't store it automatically */
      this.eventWidgets.push(eBox);
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
    let collisionsOnOldDate = this.eventWidgets.filter((e) => {
      return collidesWith(e.event, moved.event);
    });

    this.replaceCollidingEvents(collisionsOnOldDate);

    /* Render new date */
    moved.event = moved.updatedEvent;

    const collisionsOnNewDate = this.eventWidgets.filter((e) => {
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
        e.id = this.nextWidgetId++;
      });
    }

    for (let i = 0; i < group.length; i++) {
      const h = this.containerHeight;
      const w = this.containerWidth / 7;

      const xPos = (i / group.length) * (w / group.length);
      const yPos = group[i].event.startFH * (h / 24);

      group[i].widthRequest = w - xPos;

      if (!isSorted) {
        this.put(
          group[i],
          xPos + w * this.weekDates.indexOf(group[i].event.startDate),
          yPos,
        );
      } else {
        this.move(
          group[i],
          xPos + w * this.weekDates.indexOf(group[i].event.startDate),
          yPos,
        );
      }
    }
  };
}

export const WeekGrid = (props?: Partial<WeekGridProps>) => {
  return new _WeekGrid(props);
};
