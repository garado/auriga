/* █▀▀ █░█ █▀▀ █▄░█ ▀█▀ █▄▄ █▀█ ▀▄▀ */
/* ██▄ ▀▄▀ ██▄ █░▀█ ░█░ █▄█ █▄█ █░█ */

/* Custom widget implementation for calendar event box. */

import { Gdk, Gtk, Widget } from "astal/gtk4";
import { register, property, signal } from "astal/gobject";
import Calendar, { Event, fhToTimeStr } from "@/services/Calendar";

const cal = Calendar.get_default();

/*********************************************************
 * MISC
 *********************************************************/

class DragData {
  x: number = 0;
  y: number = 0;
  dx: number = 0;
  dy: number = 0;
  dragging: boolean = false;
}

/*********************************************************
 * WIDGET DEFINITION
 *********************************************************/

interface EventBoxProps extends Gtk.Widget.ConstructorProps {
  event: Event;
  dayHeight: number;
  dayWidth: number;
}

@register({ GTypeName: "EventBox" })
export class _EventBox extends Gtk.Box {
  /* Properties */
  @property(Object) declare event: Event;
  @property(Number) declare dayHeight: number;
  @property(Number) declare dayWidth: number;

  @signal()
  declare dragged: () => void;

  /* Private */
  private title;
  private times;
  private location;
  private dragController;
  private dragData;

  constructor(props: Partial<EventBoxProps>) {
    super(props as any);

    /**********************************************
     * UI SETUP
     **********************************************/

    this.orientation = Gtk.Orientation.VERTICAL;
    this.cssClasses = ["eventbox", this.event.calendar];
    this.cursor = Gdk.Cursor.new_from_name("pointer", null);
    this.vexpand = true;
    this.heightRequest =
      (this.event.endFH - this.event.startFH) * (this.dayHeight / 24);

    this.title = Widget.Label({
      cssClasses: ["title"],
      wrap: true,
      xalign: 0,
      label: this.event.description,
    });

    this.times = Widget.Label({
      cssClasses: ["times"],
      wrap: true,
      xalign: 0,
      label: `${this.event.startTime} - ${this.event.endTime}`,
    });

    this.location = Widget.Label({
      cssClasses: ["location"],
      label: this.event.location,
      wrap: true,
      xalign: 0,
    });

    this.append(this.title);
    this.append(this.times);
    this.append(this.location);

    /**********************************************
     * DRAGGING
     **********************************************/

    this.dragController = new Gtk.GestureDrag();
    this.add_controller(this.dragController);
    this.dragData = new DragData();

    /* Handle drag start */
    this.dragController.connect("drag-begin", () => {
      this.add_css_class("dragging");

      this.dragData.dragging = true;

      [this.dragData.x, this.dragData.y] = (
        this.get_parent()! as Gtk.Fixed
      ).get_child_position(this);
    });

    /* Handle drag update */
    this.dragController.connect("drag-update", (_, dx, dy) => {
      if (!this.dragData.dragging) return;

      this.dragData.dx = dx;
      this.dragData.dy = dy;

      /* Along x-axis, snap to weekdays
       * Along y-axis, snap to 15-min increments */
      this.dragData.x = this.dragDataToWeekday() * this.dayWidth;
      this.dragData.y = this.dragDataToFloatHour() * (this.dayHeight / 24);

      /* Draw within bounds */
      this.dragData.x < 0 ? (this.dragData.x = 0) : this.dragData.x;

      /* Reposition */
      (this.get_parent()! as Gtk.Fixed).move(
        this,
        this.dragData.x,
        this.dragData.y,
      );

      /* Update data and UI based on new position */
      this.event.startTime = `${fhToTimeStr(this.dragDataToFloatHour())}`;
      this.event.endTime = `${fhToTimeStr(this.dragDataToFloatHour() + this.event.durationFH)}`;
      this.event.startDate = `${cal.viewrange[this.dragDataToWeekday()]}`;
      this.event.endDate = `${cal.viewrange[this.dragDataToWeekday()]}`;

      this.times.label = `${this.event.startTime} - ${this.event.endTime}`;
    });

    /* Handle drag end */
    this.dragController.connect("drag-end", () => {
      this.remove_css_class("dragging");
      this.dragData.dragging = false;
      this.emit("dragged");
    });
  }

  /**
   * Update widget UI after its event data changes.
   */
  updateUI = () => {
    this.title.label = this.event.description;
    this.times.label = `${this.event.startTime} - ${this.event.endTime}`;
    this.location.label = this.event.location;
  };

  dragDataToFloatHour = () => {
    return (
      Math.round(
        (((this.dragData.y + this.dragData.dy) / this.dayHeight) * 24) / 0.25,
      ) * 0.25
    );
  };

  dragDataToWeekday = () => {
    return Math.round(
      ((this.dragData.x + this.dragData.dx) / (this.dayWidth * 7)) * 7,
    );
  };
}

export const EventBox = (props: Partial<EventBoxProps>) => {
  return new _EventBox(props);
};
