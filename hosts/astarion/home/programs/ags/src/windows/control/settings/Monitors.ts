import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, bind } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import Hyprland from "gi://AstalHyprland";
import { HoverRevealWrapper } from "@/components/HoverReveal";

const hypr = Hyprland.get_default();

const DisplayModeSettings = () => {
  return Widget.Box({
    orientation: Gtk.Orientation.VERTICAL,
    children: [
      Widget.Label({
        label: "Display mode settings",
        hexpand: true,
      }),
    ],
  });
};

/**
 * Settings for each individual monitor.
 */
const PerMonitorSettings = () => {
  const MonitorItem = (mon: Hyprland.Monitor) =>
    Widget.Box({
      visible: true,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      children: [
        Widget.Label({
          label: mon.name,
        }),
      ],
      onButtonPressed: () => {},
    });

  const MonitorItemRevealer = (mon: Hyprland.Monitor) =>
    HoverRevealWrapper({
      mainContent: MonitorItem(mon),
      childToReveal: Widget.Label({
        label: "I don't have many settings",
      }),
    });

  return Widget.Box({
    vertical: true,
    children: bind(hypr, "monitors").as((monitors) =>
      monitors.map(MonitorItemRevealer),
    ),
  });
};

export const Monitors = (globalRevealerState: Variable<boolean>) => {
  return ExpansionPanel({
    icon: "monitor-symbolic",
    label: bind(hypr, "monitors").as((monitors) => monitors[0].name ?? "None"),
    children: [DisplayModeSettings(), PerMonitorSettings()],
    cssClasses: ["monitor"],
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
