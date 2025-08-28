/**
 * █▀▀ █░█ █▀▀ █▄░█ ▀█▀ █▄▄ █▀█ ▀▄▀
 * ██▄ ▀▄▀ ██▄ █░▀█ ░█░ █▄█ █▄█ █░█
 *
 * Custom widget implementation for calendar event box.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Pango from "gi://Pango?version=1.0";
import { Gdk, Gtk, Widget } from "astal/gtk4";
import { register, property, signal } from "astal/gobject";

import Calendar, { Event, fhToTimeStr } from "@/services/Calendar";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const cal = Calendar.get_default();

const DAYS_PER_WEEK = 7;

const HOURS_PER_DAY = 24;

/**
 * Minimum time increment for snapping.
 * This is for drag-and-drop rescheduling.
 */
const TIME_SNAP_INCREMENT = 0.25; // 15 minutes

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

/**
 * Represents drag state and position data while dragging event box widget
 */
interface DragState {
  /** Current x position */
  x: number;

  /** Current y position */
  y: number;

  /** Delta x from drag start */
  dx: number;

  /** Delta y from drag start */
  dy: number;

  /** Whether currently dragging */
  isDragging: boolean;

  /** Original coordinates */
  originalX: number;
  originalY: number;
}

interface EventBoxProps extends Gtk.Widget.ConstructorProps {
  event: Event;
  dayHeight: number;
  dayWidth: number;
  id: number;
}

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/**
 * A draggable calendar event box widget that displays event information
 * and allows users to drag events to different times and dates
 */
@register({ GTypeName: "EventBox" })
export class _EventBox extends Gtk.Box {
  // Signals and properties ----------------------------------------------------
  // Widget metadata
  @property(Object) declare event: Event;
  @property(Object) declare updatedEvent: Event;
  @property(Number) declare dayHeight: number;
  @property(Number) declare dayWidth: number;
  @property(Number) declare id: number;
  @property(Number) declare rawWidth: number; // How wide event would be if positioning wasn't a concern
  @property(Boolean) declare isMultiDayEvent: boolean;

  // Child widgets
  @property(Gtk.Label) declare title: Gtk.Label;
  @property(Gtk.Label) declare times: Gtk.Label;
  @property(Gtk.Label) declare location: Gtk.Label;

  // Dragging
  @property(Gtk.GestureDrag) declare dragController: Gtk.GestureDrag;
  @signal() declare dragged: () => void;

  private dragState: DragState = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    isDragging: false,
    originalX: 0,
    originalY: 0,
  };

  // Private functions ---------------------------------------------------------
  constructor(props: Partial<EventBoxProps>) {
    super(props as any);

    this.isMultiDayEvent = props.event!.multiDay || props.event!.allDay;

    this.initializeWidget();
    this.createChildWidgets();
    this.setupDragHandler();
  }

  // Private functions: Initialize ---------------------------------------------

  /**
   * Initialize widget state.
   */
  private initializeWidget = () => {
    this.cssClasses = [
      "eventbox",
      this.isMultiDayEvent ? "multiday" : "",
      this.event.calendar,
    ];

    this.cursor = Gdk.Cursor.new_from_name("pointer", null);
    this.vexpand = false;

    if (this.isMultiDayEvent) {
      this.orientation = Gtk.Orientation.HORIZONTAL;
      this.spacing = 8;
    } else {
      this.heightRequest =
        (this.event.endFH - this.event.startFH) *
        (this.dayHeight / HOURS_PER_DAY);
      this.orientation = Gtk.Orientation.VERTICAL;
    }

    if (this.event.endTS < Date.now()) {
      this.add_css_class("elapsed");
    }

    this.updatedEvent = { ...this.event };
    this.rawWidth = this.dayWidth * cal.displayDaySpan(this.event);
  };

  /**
   * Create child widgets displaying event information.
   */
  private createChildWidgets = () => {
    this.title = Widget.Label({
      cssClasses: ["title"],
      wrap: true,
      xalign: 0,
      label: this.event.description,
      setup: (self) => {
        if (this.isMultiDayEvent) {
          self.ellipsize = Pango.EllipsizeMode.END;
        }
      },
    });

    this.times = Widget.Label({
      cssClasses: ["times"],
      wrap: true,
      xalign: 0,
      label: `${this.event.startTime} - ${this.event.endTime}`,
      visible: this.event.startTime !== "" && this.event.endTime !== "",
    });

    this.location = Widget.Label({
      cssClasses: ["location"],
      label: this.event.location,
      wrap: true,
      xalign: 0,
      visible: !this.isMultiDayEvent,
    });

    this.append(this.title);
    this.append(this.times);
    this.append(this.location);
  };

  // Private functions: Dragging -----------------------------------------------

  /**
   * Set up drag gesture handling.
   */
  private setupDragHandler = () => {
    this.dragController = new Gtk.GestureDrag();
    this.add_controller(this.dragController);

    this.dragState = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      isDragging: false,
      originalX: 0,
      originalY: 0,
    };

    this.dragController.connect("drag-begin", this.onDragBegin.bind(this));
    this.dragController.connect("drag-update", this.onDragUpdate.bind(this));
    this.dragController.connect("drag-end", this.onDragEnd.bind(this));
  };

  /**
   * Handle the beginning of a drag operation.
   */
  private onDragBegin = () => {
    this.add_css_class("dragging");
    this.remove_css_class("elapsed");

    this.dragState.isDragging = true;

    // Get the actual visual position relative to the parent
    const allocation = this.get_allocation();
    const parentAllocation = this.get_parent()!.get_allocation();

    // Get the actual rendered position
    this.dragState.originalX = allocation.x - parentAllocation.x;
    this.dragState.originalY = allocation.y - parentAllocation.y;

    this.dragState.x = this.dragState.originalX;
    this.dragState.y = this.dragState.originalY;
  };

  /**
   * Handle change in position while a drag operation is in progress.
   */
  private onDragUpdate = (_unused: any, dx: number, dy: number) => {
    if (!this.dragState.isDragging) return;

    this.dragState.dx = dx;
    this.dragState.dy = dy;

    // Along x-axis, snap to weekdays
    this.dragState.x = this.snapToWeekday() * this.dayWidth;

    // For single-day events: Along y-axis, snap to 15-min increments
    if (!this.isMultiDayEvent) {
      this.dragState.y =
        this.snapToTimeGrid() * (this.dayHeight / HOURS_PER_DAY);
    } else {
      this.dragState.y = this.dragState.originalY;
    }

    // Ensure widget is within bounds
    this.dragState.x < 0 ? (this.dragState.x = 0) : this.dragState.x;

    // Change width to ensure entire widget remains in bounds, if needed
    if (this.isMultiDayEvent) {
      const widgetXPosEnd = this.dragState.x + this.rawWidth;
      const gridXPosEnd = this.dayWidth * DAYS_PER_WEEK;

      if (widgetXPosEnd > gridXPosEnd) {
        const startDayIndex = Math.round(this.dragState.x / this.dayWidth);
        this.widthRequest = (DAYS_PER_WEEK - startDayIndex) * this.dayWidth;
      } else {
        this.widthRequest = this.rawWidth;
      }
    }

    // Reposition
    (this.get_parent()! as Gtk.Fixed).move(
      this,
      this.dragState.x,
      this.dragState.y,
    );

    // Update data and UI based on new position
    if (!this.isMultiDayEvent) {
      this.updatedEvent.startTime = `${fhToTimeStr(this.snapToTimeGrid())}`;
      this.updatedEvent.endTime = `${fhToTimeStr(this.snapToTimeGrid() + this.event.durationFH)}`;
      this.times.label = `${this.updatedEvent.startTime} - ${this.updatedEvent.endTime}`;
    }

    if (this.isMultiDayEvent) {
      const newStartDayIndex = this.snapToWeekday();
      const originalDuration = cal.displayDaySpan(this.event);

      const newEndDayIndex = Math.min(
        newStartDayIndex + originalDuration - 1,
        DAYS_PER_WEEK - 1,
      );

      this.updatedEvent.startDate = `${cal.weekDates[newStartDayIndex]}`;
      this.updatedEvent.endDate = `${cal.weekDates[newEndDayIndex]}`;
    } else {
      this.updatedEvent.startDate = `${cal.weekDates[this.snapToWeekday()]}`;
      this.updatedEvent.endDate = `${cal.weekDates[this.snapToWeekday()]}`;
    }
  };

  /**
   * Handle the completion of a drag operation.
   */
  private onDragEnd = () => {
    this.remove_css_class("dragging");
    this.dragState.isDragging = false;

    // Calculate new timestamps
    this.updatedEvent.startTS = new Date(
      `${this.updatedEvent.startDate} ${this.updatedEvent.startTime}`,
    ).getTime();

    this.updatedEvent.endTS = new Date(
      `${this.updatedEvent.endDate} ${this.updatedEvent.endTime}`,
    ).getTime();

    this.updatedEvent.startFH = this.snapToTimeGrid();
    this.updatedEvent.endFH = this.snapToTimeGrid() + this.event.durationFH;

    if (this.updatedEvent.endTS < Date.now()) {
      this.add_css_class("elapsed");
    }

    this.emit("dragged");
  };

  private snapToTimeGrid = () => {
    return (
      Math.round(
        (((this.dragState.y + this.dragState.dy) / this.dayHeight) *
          HOURS_PER_DAY) /
          TIME_SNAP_INCREMENT,
      ) * TIME_SNAP_INCREMENT
    );
  };

  private snapToWeekday = () => {
    const currentX = this.dragState.x + this.dragState.dx;
    const dayIndex = Math.round(currentX / this.dayWidth);

    // Clamp to valid day range (0-6)
    return Math.max(0, Math.min(dayIndex, DAYS_PER_WEEK - 1));
  };

  // Public functions ----------------------------------------------------------

  /**
   * Update widget UI afer its event data changes.
   */
  updateUI = () => {
    this.title.label = this.event.description;
    this.times.label = `${this.event.startTime} - ${this.event.endTime}`;
    this.location.label = this.event.location;
  };
}

/**
 * Factory function to create EventBox instances
 */
export const EventBox = (props: Partial<EventBoxProps>) => {
  return new _EventBox(props);
};
