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

import Calendar, { Event } from "@/services/Calendar";
import { EventBox } from "@/windows/dash/calendar/week/EventBox";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const cal = Calendar.get_default();

const DAYS_PER_WEEK = 7;
const HOURS_PER_DAY = 24;
const REALIZATION_TIMEOUT_MS = 50;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Returns true if the two given events overlap.
 *
 * @param firstEvent - The first event to check for overlap
 * @param secondEvent - The second event to check for overlap
 * @returns True if the events overlap in time, false otherwise
 **/
const doEventsOverlap = (firstEvent: Event, secondEvent: Event): boolean => {
  return !(
    firstEvent.endTS <= secondEvent.startTS ||
    secondEvent.endTS <= firstEvent.startTS
  );
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
  declare eventWidgets: Gtk.Widget[];

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
   * If widget has been allocated a size.
   */
  @property(Boolean)
  declare isRealized: boolean;

  // Private functions ---------------------------------------------------------

  constructor(props?: Partial<WeekGridProps>) {
    super(props as any);

    this.vexpand = false;
    this.hexpand = false;

    this.eventWidgets = [];
    this.nextWidgetId = 0;

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
    // Size allocation is available shortly after the "realize" signal is emitted
    // (Note: This WeekGrid is overlaid on top of the Gridlines widget, and therefore is allocated the same size
    // as the Gridlines widget)
    this.connect("realize", () => {
      timeout(REALIZATION_TIMEOUT_MS, () => {
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
    // Store new data
    this.weekEvents = cal.weekEvents;
    this.weekDates = cal.weekDates;

    // Reset widget state
    this.clearAllEventWidgets();

    this.tryRender();
  };

  /**
   * Removes all existing event widgets from the grid and resets widget tracking state.
   */
  private clearAllEventWidgets = () => {
    this.eventWidgets.forEach((widget) => {
      this.remove(widget);
    });

    this.eventWidgets = [];
    this.nextWidgetId = 0;
  };

  /**
   * Attempt to render the week grid.
   * Only render the widget if data is available AND size is allocated.
   */
  private tryRender = () => {
    if (this.isRealized && cal.initComplete) {
      this.renderAllDays();
    }
  };

  /**
   * Render all events for every day in the given week.
   */
  private renderAllDays = () => {
    this.clearAllEventWidgets();

    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex++) {
      this.renderEventsForDate(this.weekDates[dayIndex]);
    }
  };

  /**
   * Render the events for a given date.
   *
   * This function organizes overlapping events into groups and renders one group at a time.
   * This is because overlapping events have special rendering logic.
   *
   * Assumption: `this.weekEvents` has events sorted chronologically.
   *
   * @param targetDate - The date whose events should be rendered (YYYY-MM-DD)
   */
  private renderEventsForDate = (targetDate: string) => {
    const eventsForDate: Event[] = this.weekEvents[targetDate];

    const dayIndex = this.weekDates.indexOf(targetDate);

    let currentGroup: Event[] = [];
    let lastGroupEventEnd: number = 0;
    let wasEventPlaced = false;

    eventsForDate.forEach((currentEvent) => {
      // If current event starts after the last group ended, render the previous group
      if (currentEvent.startFH >= lastGroupEventEnd) {
        this.renderEventGroup(currentGroup, dayIndex);
        currentGroup = [];
        lastGroupEventEnd = 0;
      }

      wasEventPlaced = false;

      // Try to place the current event in the existing group by checking for overlaps
      for (let i = 0; i < currentGroup.length; i++) {
        if (doEventsOverlap(currentGroup[i], currentEvent)) {
          currentGroup.push(currentEvent);
          wasEventPlaced = true;
          break;
        }
      }

      // If event doesn't overlap with current group, render current group and start new one
      if (!wasEventPlaced) {
        this.renderEventGroup(currentGroup, dayIndex);
        currentGroup = [];
        currentGroup.push(currentEvent);
      }

      // Update the end time of the current group so we'll know if the next event overlaps with this group
      if (lastGroupEventEnd == null || currentEvent.endFH > lastGroupEventEnd) {
        lastGroupEventEnd = currentEvent.endFH;
      }
    });

    // Render any remaining events in the final group
    if (currentGroup.length > 0) {
      this.renderEventGroup(currentGroup, dayIndex);
    }
  };

  /**
   * Render a group of overlapping events within a specific day column.
   * Events are sorted by duration (longest first) and start time (earliest first) for better visual hierarchy.
   *
   * @param group - group of events to render
   * @param dayIndex - the dayIndex of the day of the week that is being rendered
   */
  renderEventGroup = (eventGroup: Event[], dayIndex: number) => {
    const sortedGroup = eventGroup.sort((firstEvent, secondEvent) => {
      if (firstEvent.durationFH > secondEvent.durationFH) return -1;
      if (firstEvent.durationFH < secondEvent.durationFH) return 1;
      if (firstEvent.startTS < secondEvent.startTS) return -1;
      if (firstEvent.startTS > secondEvent.startTS) return 1;
      return 0;
    });

    for (let eventIndex = 0; eventIndex < sortedGroup.length; eventIndex++) {
      const currentEvent = sortedGroup[eventIndex];

      // Skip multi-day and all-day events (handled elsewhere)
      if (currentEvent.multiDay || currentEvent.allDay) continue;

      const h = this.containerHeight;
      const w = this.containerWidth / DAYS_PER_WEEK;

      const xPos = (eventIndex / sortedGroup.length) * (w / sortedGroup.length);
      const yPos = currentEvent.startFH * (h / HOURS_PER_DAY);

      const eBox = EventBox({
        event: currentEvent,
        dayHeight: h,
        dayWidth: w,
        id: this.nextWidgetId++,
      });

      eBox.widthRequest = w - xPos;

      eBox.connect("dragged", this.handleDragEventComplete);

      this.put(eBox, xPos + w * dayIndex, yPos);

      // Store child reference since Gtk.Fixed doesn't store it automatically
      this.eventWidgets.push(eBox);
    }
  };

  /**
   * Handle repositioning after an eventbox is dragged.
   *
   * This repositions events affected by the old position, then repositions events affected by the new position.
   *
   * @param moved - The eventbox widget that was moved.
   */
  handleDragEventComplete = (draggedEvent: any) => {
    const collisionsOnOldDate = this.eventWidgets.filter((event: any) => {
      return doEventsOverlap(event.event, draggedEvent.event);
    });

    this.repositionEventGroup(collisionsOnOldDate);

    // Update stored event data to new position
    draggedEvent.event = draggedEvent.updatedEvent;

    const collisionsOnNewDate = this.eventWidgets.filter((event: any) => {
      return doEventsOverlap(event.event, draggedEvent.event);
    });

    this.repositionEventGroup(collisionsOnNewDate);

    draggedEvent.updateUI();
  };

  /**
   * Repositions a group of overlapping events to maintain proper layout after changes.
   * Handles z-ordering by removing and re-adding widgets if their IDs are out of order.
   *
   * @param eventGroup - Array of EventBox widgets that need repositioning
   */
  repositionEventGroup = (eventGroup: any[]) => {
    const sortedGroup = eventGroup.sort((a: any, b: any) => {
      if (a.event.durationFH > b.event.durationFH) return -1;
      if (a.event.durationFH < b.event.durationFH) return 1;
      if (a.event.startTS < b.event.startTS) return -1;
      if (a.event.startTS > b.event.startTS) return 1;
      return 0;
    });

    // Gtk.Fixed has no z-order property - the "z-order" is defined by the order in which widgets are added
    // So ensure that widgets are sorted correctly after repositioning
    const widgetIds = sortedGroup.map((e) => e.id);
    const isSorted = widgetIds.every(
      (val, i) => i === 0 || val >= widgetIds[i - 1],
    );

    // If sort order is wrong, remove widgets and reassign IDs to fix drawing order
    if (!isSorted) {
      sortedGroup.forEach((eventWidget) => {
        this.remove(eventWidget);
        eventWidget.id = this.nextWidgetId++;
      });
    }

    // Reposition all events in the group
    for (let eventIndex = 0; eventIndex < sortedGroup.length; eventIndex++) {
      const currentEventWidget = sortedGroup[eventIndex];

      const h = this.containerHeight;
      const w = this.containerWidth / DAYS_PER_WEEK;

      const xPos = (eventIndex / sortedGroup.length) * (w / sortedGroup.length);
      const yPos = currentEventWidget.event.startFH * (h / HOURS_PER_DAY);

      currentEventWidget.widthRequest = w - xPos;

      const dayColumnIndex = this.weekDates.indexOf(
        currentEventWidget.event.startDate,
      );

      const finalXPos = xPos + w * dayColumnIndex;

      if (!isSorted) {
        this.put(currentEventWidget, finalXPos, yPos);
      } else {
        this.move(currentEventWidget, finalXPos, yPos);
      }
    }
  };
}

export const WeekGrid = (props?: Partial<WeekGridProps>) => {
  return new _WeekGrid(props);
};
