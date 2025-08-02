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

  private gridlines: Gtk.Widget | undefined = undefined;

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

    this.renderEventGroup(allDayEvents);
  };

  /**
   * Render a group of all-day events with overlap detection and row assignment.
   * Events are positioned in rows to avoid overlapping, with longer events getting priority for lower rows.
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

    // Track occupied time slots for each row to detect overlaps
    const rowOccupancy: Array<Array<{ start: number; end: number }>> = [];

    // Store widgets with their row assignments for positioning
    const widgetPlacements: Array<{ widget: any; xPos: number; row: number }> =
      [];

    // Helper function to check if two time ranges overlap
    const doRangesOverlap = (
      range1: { start: number; end: number },
      range2: { start: number; end: number },
    ): boolean => {
      return range1.start < range2.end && range2.start < range1.end;
    };

    // Helper function to find the first available row for an event
    const findAvailableRow = (eventStart: number, eventEnd: number): number => {
      for (let rowIndex = 0; rowIndex < rowOccupancy.length; rowIndex++) {
        const row = rowOccupancy[rowIndex];
        const hasOverlap = row.some((occupiedRange) =>
          doRangesOverlap({ start: eventStart, end: eventEnd }, occupiedRange),
        );

        if (!hasOverlap) {
          return rowIndex;
        }
      }
      // No available row found, create a new one
      rowOccupancy.push([]);
      return rowOccupancy.length - 1;
    };

    // First pass: create widgets and assign rows
    for (let eventIndex = 0; eventIndex < sortedGroup.length; eventIndex++) {
      const currentEvent = sortedGroup[eventIndex];

      // Calculate position based on event's date span
      const startIndex = this.weekDates.indexOf(currentEvent.startDate);
      const endIndex = this.weekDates.indexOf(currentEvent.endDate);
      let xPos = 0;
      let width = dayWidth;
      let eventStartDay = 0;
      let eventEndDay = DAYS_PER_WEEK - 1;

      // Check if event has end time (inclusive) or just end date (exclusive)
      const isEndInclusive =
        currentEvent.endTime && currentEvent.endTime.trim() !== "";

      if (startIndex !== -1) {
        xPos = startIndex * dayWidth;
        eventStartDay = startIndex;

        if (endIndex !== -1 && endIndex > startIndex) {
          // Event starts and ends within this week
          eventEndDay = endIndex + (isEndInclusive ? 0 : -1);
          width = (endIndex - startIndex + (isEndInclusive ? 1 : 0)) * dayWidth;
        } else if (endIndex === -1) {
          // Event continues beyond this week
          eventEndDay = DAYS_PER_WEEK - 1;
          width = (DAYS_PER_WEEK - startIndex) * dayWidth;
        }
      } else if (endIndex !== -1) {
        // Event started before this week
        xPos = 0;
        eventStartDay = 0;
        eventEndDay = endIndex + (isEndInclusive ? 0 : -1);
        width = (endIndex + (isEndInclusive ? 1 : 0)) * dayWidth;
      } else {
        // Event spans entire week
        xPos = 0;
        eventStartDay = 0;
        eventEndDay = DAYS_PER_WEEK - 1;
        width = DAYS_PER_WEEK * dayWidth;
      }

      const eventBox = EventBox({
        event: currentEvent,
        dayWidth: dayWidth,
        id: this.nextWidgetId++,
        heightRequest: uiVars.allDayEventHeight,
        widthRequest: width,
      });

      eventBox.connect("dragged", this.handleDragEventComplete);

      // Find the appropriate row for this event to avoid overlaps
      const assignedRow = findAvailableRow(eventStartDay, eventEndDay + 1);

      // Mark this time range as occupied in the assigned row
      if (!rowOccupancy[assignedRow]) {
        rowOccupancy[assignedRow] = [];
      }
      rowOccupancy[assignedRow].push({
        start: eventStartDay,
        end: eventEndDay + 1,
      });

      // Store widget placement info for second pass
      widgetPlacements.push({
        widget: eventBox,
        xPos: xPos,
        row: assignedRow,
      });

      // Store child reference since Gtk.Fixed doesn't store it automatically
      this.eventWidgets.push(eventBox);
    }

    let currentY = 0;
    let rowSpacing = 4;
    const height =
      rowOccupancy.length * (uiVars.allDayEventHeight + rowSpacing);

    // Draw gridlines
    if (this.gridlines !== undefined) {
      this.remove(this.gridlines);
      this.gridlines = undefined;
    }

    this.heightRequest = height;
    this.queue_resize();
    this.drawGridlines(height);

    // Place widgets
    for (let rowIndex = 0; rowIndex < rowOccupancy.length; rowIndex++) {
      // Find all widgets assigned to this row
      const widgetsInRow = widgetPlacements.filter(
        (placement) => placement.row === rowIndex,
      );

      if (widgetsInRow.length > 0) {
        // Place all widgets in this row at the current Y position
        for (const placement of widgetsInRow) {
          this.put(placement.widget, placement.xPos, currentY);
        }

        currentY += uiVars.allDayEventHeight + rowSpacing;
      }
    }

    this.queue_draw();
    this.queue_resize();
  };

  /**
   * Handle repositioning after an all-day event is dragged.
   *
   * @param draggedEvent - The event widget that was moved.
   */
  handleDragEventComplete = (draggedEvent: any) => {
    draggedEvent.event = draggedEvent.updatedEvent;

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
  private drawGridlines = (height: number) => {
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
      vexpand: false,
      hexpand: false,
      visible: true,
      widthRequest: this.get_allocated_width(),
      heightRequest: height,
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
