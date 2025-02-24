import { Gtk, Widget, astalify } from "astal/gtk4";
import { GLib } from "astal";
import Calendar from "@/services/Calendar";
import { DateLabels } from "@/windows/dash/calendar/week/DateLabels";
import { MultiDayEvents } from "@/windows/dash/calendar/week/MultiDayEvents";
import { WeekView } from "@/windows/dash/calendar/week/WeekView";

const WIDGET_SPACING = 20;

export const Week = () =>
  Widget.Box({
    name: "week",
    cssClasses: ["week"],
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [DateLabels(), MultiDayEvents(), WeekView()],
  });
