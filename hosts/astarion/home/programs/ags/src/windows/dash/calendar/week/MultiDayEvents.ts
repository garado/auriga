import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import Calendar, { DAY_NAMES } from "@/services/Calendar";
import { Gridlines } from "@/windows/dash/calendar/week/Gridlines";

const Fixed = astalify(Gtk.Fixed);

/**
 * Widget showing multi-day events for the week.
 */
export const MultiDayEvents = () =>
  Fixed({
    cssClasses: ["multiday"],
    // widthRequest: CalSvc.DAY_WIDTH_PX * 7,
    // heightRequest: CalSvc.MULTIDAY_HEIGHT_PX,
    setup: (self) => {},
    // self.hook(
    //   CalSvc,
    //   (self, weekDates, viewdata) => {
    //     if (weekDates == undefined && viewdata == undefined) return;
    //
    //     /* Clear any old events */
    //     self.get_children().forEach((event) => {
    //       event.foreach((x) => event.remove(x));
    //       self.remove(event);
    //     });
    //
    //     let multiDayEvents = [];
    //     Object.values(viewdata).forEach((arr) => {
    //       multiDayEvents.push(
    //         ...arr.filter((event) => event.multiDay || event.allDay),
    //       );
    //     });
    //
    //     multiDayEvents.forEach((event) => {
    //       self.addMultiDayEvent(event);
    //     });
    //
    //     /* Make this widget smaller if there's no multiday events */
    //     if (multiDayEvents.length == 0) {
    //       self.heightRequest = 10;
    //     }
    //   },
    //   "weekDates-changed",
    // ),
  });
