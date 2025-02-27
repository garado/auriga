import { astalify, Gtk, Widget } from "astal/gtk4";
import { DateLabels } from "@/windows/dash/calendar/week/DateLabels";
import { MultiDayEvents } from "@/windows/dash/calendar/week/MultiDayEvents";
import { WeekView } from "@/windows/dash/calendar/week/WeekView";
import { Gridlines } from "@/windows/dash/calendar/week/Gridlines";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

export const Week = () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);

  const _DateLabels = DateLabels();
  const _MultiDayEvents = MultiDayEvents();
  const _WeekViewContent = WeekView();
  const _Gridlines = Gridlines();

  const WeekViewContainer = Scrollable({
    vexpand: true,
    hexpand: true,
    visible: true,
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    child: Widget.Overlay({
      homogeneous: true,
      child: _Gridlines,
      setup: (self) => {
        self.add_overlay(_WeekViewContent);
      },
    }),
  });

  return Widget.Box({
    name: "week",
    cssClasses: ["week"],
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [_DateLabels, _MultiDayEvents, WeekViewContainer],
    setup: (self) => {
      EventControllerKeySetup({
        widget: self,
        forwardTo: _WeekViewContent,
        binds: {},
      });
    },
  });
};
