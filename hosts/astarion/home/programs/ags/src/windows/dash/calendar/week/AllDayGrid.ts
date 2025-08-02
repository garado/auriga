/**
 * ▄▀█ █░░ █░░ ▄▄ █▀▄ ▄▀█ █▄█   █▀▀ █▀█ █ █▀▄
 * █▀█ █▄▄ █▄▄ ░░ █▄▀ █▀█ ░█░   █▄█ █▀▄ █ █▄▀
 *
 * All-day event grid container for 7-day calendar view.
 *
 * This component provides the container/grid where all-day and multi-day calendar events
 * are positioned and displayed above the weekly time grid, similar to Google Calendar's
 * all-day event section.
 *
 * @TODO Optimize rendering for large numbers of events
 * @TODO Add row assignment logic to prevent overlapping events
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gtk, hook } from "astal/gtk4";
import { property, register } from "astal/gobject";
import { timeout } from "astal";

import Calendar, { Event, uiVars } from "@/services/Calendar";
import { EventBox } from "@/windows/dash/calendar/week/EventBox";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const cal = Calendar.get_default();

const DAYS_PER_WEEK = 7;
const REALIZATION_TIMEOUT_MS = 50;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Returns true if the two given events overlap in their date ranges.
 *
 * @param firstEvent - The first event to check for overlap
 * @param secondEvent - The second event to check for overlap
 * @returns True if the events overlap in dates, false otherwise
 **/
const doEventsOverlap = (firstEvent: Event, secondEvent: Event): boolean => {
  const firstStart = new Date(firstEvent.startDate).getTime();
  const firstEnd = new Date(firstEvent.endDate).getTime();
  const secondStart = new Date(secondEvent.startDate).getTime();
  const secondEnd = new Date(secondEvent.endDate).getTime();

  return !(firstEnd <= secondStart || secondEnd <= firstStart);
};

/*****************************************************************************
 * Class definition
 *****************************************************************************/

interface AllDayGridProps extends Gtk.Fixed.ConstructorProps {}

@register({ GTypeName: "AllDayGrid" })
export class _AllDayGrid extends Gtk.Fixed {
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
   * The allocated pixel height of the AllDayGrid widget, used for calculating event positions and sizes
   */
  @property(Number)
  declare containerHeight: number;

  /**
   * The allocated pixel width of the AllDayGrid widget, used for calculating event positions and sizes
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

  private gridlines;

  // Private functions ---------------------------------------------------------

  constructor(props?: Partial<AllDayGridProps>) {
    super(props as any);

    this.vexpand = true;
    this.hexpand = true;
    this.cssClasses = ["allday-container"];

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
   * Attempt to render the all-day grid.
   * Only render the widget if data is available AND size is allocated.
   */
  private tryRender = () => {
    if (this.isRealized && cal.initComplete) {
      if (this.gridlines) {
        this.remove(this.gridlines);
      }

      this.drawGridlines();
      this.renderAllDayEvents();
    }
  };

  /**
   * Render all all-day and multi-day events for the current week.
   */
  private renderAllDayEvents = () => {
    this.clearAllEventWidgets();

    // Collect all all-day and multi-day events
    const allDayEvents: Event[] = [];
    Object.values(this.weekEvents).forEach((dayEvents) => {
      dayEvents.forEach((event) => {
        if (event.allDay || event.multiDay) {
          allDayEvents.push(event);
        }
      });
    });

    // Remove duplicates (same event appearing on multiple days)
    const uniqueEvents = allDayEvents.filter(
      (event, index, arr) => arr.findIndex((e) => e.id === event.id) === index,
    );

    if (uniqueEvents.length === 0) {
      return;
    }

    // Simple stacking for now - TODO: implement proper row assignment to prevent overlaps
    this.renderEventGroup(uniqueEvents);
  };

  /**
   * Render a group of all-day events.
   * For now, events are simply stacked vertically - TODO: implement overlap detection and row assignment.
   *
   * @param eventGroup - group of all-day events to render
   */
  renderEventGroup = (eventGroup: Event[]) => {
    // Sort events by start date, then by duration (longer events first)
    const sortedGroup = eventGroup.sort((firstEvent, secondEvent) => {
      const firstStart = new Date(firstEvent.startDate).getTime();
      const secondStart = new Date(secondEvent.startDate).getTime();

      if (firstStart !== secondStart) {
        return firstStart - secondStart;
      }

      // If same start date, longer events first
      const firstDuration = new Date(firstEvent.endDate).getTime() - firstStart;
      const secondDuration =
        new Date(secondEvent.endDate).getTime() - secondStart;
      return secondDuration - firstDuration;
    });

    const dayWidth = this.containerWidth / DAYS_PER_WEEK;

    for (let eventIndex = 0; eventIndex < sortedGroup.length; eventIndex++) {
      const currentEvent = sortedGroup[eventIndex];

      // Calculate position based on event's date span
      const startIndex = this.weekDates.indexOf(currentEvent.startDate);
      const endIndex = this.weekDates.indexOf(currentEvent.endDate);

      let xPos = 0;
      let width = dayWidth;

      // Check if event has end time (inclusive) or just end date (exclusive)
      const isEndInclusive =
        currentEvent.endTime && currentEvent.endTime.trim() !== "";

      if (startIndex !== -1) {
        xPos = startIndex * dayWidth;

        if (endIndex !== -1 && endIndex > startIndex) {
          // Event starts and ends within this week
          width = (endIndex - startIndex + (isEndInclusive ? 1 : 0)) * dayWidth;
        } else if (endIndex === -1) {
          // Event continues beyond this week
          width = (DAYS_PER_WEEK - startIndex) * dayWidth;
        }
      } else if (endIndex !== -1) {
        // Event started before this week
        xPos = 0;
        width = (endIndex + (isEndInclusive ? 1 : 0)) * dayWidth;
      } else {
        // Event spans entire week
        xPos = 0;
        width = DAYS_PER_WEEK * dayWidth;
      }

      const eventBox = EventBox({
        event: currentEvent,
        dayWidth: dayWidth,
        id: this.nextWidgetId++,
        widthRequest: width,
      });

      eventBox.connect("dragged", this.handleDragEventComplete);

      this.put(eventBox, xPos, 0);

      // Store child reference since Gtk.Fixed doesn't store it automatically
      this.eventWidgets.push(eventBox);
    }
  };

  /**
   * Handle repositioning after an all-day event is dragged.
   *
   * @param draggedEvent - The event widget that was moved.
   */
  handleDragEventComplete = (draggedEvent: any) => {
    // For all-day events, we mainly need to update the event data
    // and potentially reposition overlapping events

    // Update stored event data to new position
    draggedEvent.event = draggedEvent.updatedEvent;

    // Find events that might need repositioning due to the drag
    const affectedEvents = this.eventWidgets.filter((event: any) => {
      return doEventsOverlap(event.event, draggedEvent.event);
    });

    if (affectedEvents.length > 1) {
      this.repositionEventGroup(affectedEvents);
    }

    draggedEvent.updateUI();
  };

  /**
   * Repositions a group of overlapping all-day events to maintain proper layout.
   *
   * @param eventGroup - Array of EventBox widgets that need repositioning
   */
  repositionEventGroup = (eventGroup: any[]) => {
    const sortedGroup = eventGroup.sort((a: any, b: any) => {
      const aStart = new Date(a.event.startDate).getTime();
      const bStart = new Date(b.event.startDate).getTime();

      if (aStart !== bStart) {
        return aStart - bStart;
      }

      // If same start date, longer events first
      const aDuration = new Date(a.event.endDate).getTime() - aStart;
      const bDuration = new Date(b.event.endDate).getTime() - bStart;
      return bDuration - aDuration;
    });

    // Check if widgets need to be removed and re-added for proper z-order
    const widgetIds = sortedGroup.map((e) => e.id);
    const isSorted = widgetIds.every(
      (val, i) => i === 0 || val >= widgetIds[i - 1],
    );

    if (!isSorted) {
      sortedGroup.forEach((eventWidget) => {
        this.remove(eventWidget);
        eventWidget.id = this.nextWidgetId++;
      });
    }

    const dayWidth = this.containerWidth / DAYS_PER_WEEK;

    // Reposition all events in the group
    for (let eventIndex = 0; eventIndex < sortedGroup.length; eventIndex++) {
      const currentEventWidget = sortedGroup[eventIndex];
      const currentEvent = currentEventWidget.event;

      // Calculate position based on event's date span
      const startIndex = this.weekDates.indexOf(currentEvent.startDate);
      const endIndex = this.weekDates.indexOf(currentEvent.endDate);

      let xPos = 0;
      let width = dayWidth;

      if (startIndex !== -1) {
        xPos = startIndex * dayWidth;
        if (endIndex !== -1 && endIndex > startIndex) {
          width = (endIndex - startIndex + 1) * dayWidth;
        }
      }

      currentEventWidget.widthRequest = width - 4;

      if (!isSorted) {
        this.put(currentEventWidget, xPos, 0);
      } else {
        this.move(currentEventWidget, xPos, 0);
      }
    }
  };

  /**
   * Draw underlying gridlines for all-day event
   * Unlike the full Gridlines
   */
  private drawGridlines = () => {
    const drawFn = (self: any, cr: any, width: number, height: number) => {
      // Get gridline color from CSS
      const styles = self.get_style_context();
      const fg = styles.get_color();
      cr.setSourceRGBA(fg.red, fg.green, fg.blue, 0.5);

      // Draw bottom border
      cr.moveTo(0, height);
      cr.lineTo(width, height);

      // Draw vertical lines between days
      const dayWidth = width / 7;
      for (let i = 1; i < 7; i++) {
        const x = i * dayWidth;
        cr.moveTo(x, 0);
        cr.lineTo(x, height);
      }

      cr.stroke();
    };

    this.gridlines = astalify(Gtk.DrawingArea)({
      cssClasses: ["weekview-gridlines"],
      canFocus: false,
      vexpand: true,
      hexpand: true,
      heightRequest: this.get_allocated_height(),
      widthRequest: this.get_allocated_width(),
      setup: (self) => {
        self.set_draw_func(drawFn);
      },
    });

    this.put(this.gridlines, 0, 0);
  };
}

export const AllDayGrid = (props?: Partial<AllDayGridProps>) => {
  return new _AllDayGrid(props);
};
