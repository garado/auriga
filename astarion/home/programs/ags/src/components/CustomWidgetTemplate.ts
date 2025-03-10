import { Gtk, Widget } from "astal/gtk4";
import { DateLabels } from "@/windows/dash/calendar/week/DateLabels";
import { MultiDayEvents } from "@/windows/dash/calendar/week/MultiDayEvents";
import { WeekView } from "@/windows/dash/calendar/week/WeekView";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

export const Week = () => {
  const _DateLabels = DateLabels();
  const _MultiDayEvents = MultiDayEvents();
  const _WeekView = WeekView();

  return Widget.Box({
    name: "week",
    cssClasses: ["week"],
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [_DateLabels, _MultiDayEvents, _WeekView],
    setup: (self) => {
      EventControllerKeySetup({
        widget: self,
        forwardTo: _WeekView,
        binds: {},
      });
    },
  });
};
