import Goals from "@/services/Goals";
import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { Category } from "./Category";
import { log } from "@/globals";
import { SegmentedButtonGroup } from "@/components/SegmentedButtonGroup";
import { Sidebar } from "@/windows/dash/goals/Sidebar";

const gs = Goals.get_default();

export default () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);

  const ProgressFilters = SegmentedButtonGroup({
    buttons: [
      {
        name: "Completed",
        active: gs.filters.completed,
        action: () => {
          print("weee");
          gs.filters.completed = !gs.filters.completed;
        },
      },
      {
        name: "In progress",
        active: gs.filters.pending,
        action: () => {
          gs.filters.pending = !gs.filters.pending;
        },
      },
      {
        name: "Failed",
        action: () => {
          gs.filters.failed = !gs.filters.failed;
        },
      },
    ],
  });

  const StatusFilters = SegmentedButtonGroup({
    buttons: [
      {
        name: "Developed",
        active: gs.filters.developed,
        action: () => {
          gs.filters.developed = !gs.filters.developed;
        },
      },
      {
        name: "In development",
        active: gs.filters.inDevelopment,
        action: () => {
          gs.filters.undeveloped = !gs.filters.undeveloped;
        },
      },
    ],
  });

  /**
   * Filter buttons to control the widgets shown
   */
  const Filters = Widget.Box({
    spacing: 10,
    children: [StatusFilters, ProgressFilters],
    vexpand: false,
  });

  /**
   * Bar above main content
   */
  const TopBar = Widget.CenterBox({
    vexpand: false,
    startWidget: Widget.Label({
      cssClasses: ["tab-header"],
      halign: Gtk.Align.START,
      label: "Goals",
    }),
    endWidget: Filters,
  });

  /**
   * Container for all goal category widgets
   */
  const Categories = Widget.Box({
    vertical: true,
    spacing: 30,
    vexpand: true,
    hexpand: true,
    setup: (self) => {
      hook(self, gs, "render-goals", (self, data) => {
        if (data == undefined) return;

        log("goalTab", "Rendering goals");

        self.children.forEach((x) => self.remove(x));

        const categories = Object.keys(data).sort();

        categories.forEach((c: string) => {
          const cWidget = Category({
            category: c,
            isBigPicture: c == "_bigpicture",
          });
          self.append(cWidget);
        });
      });
    },
  });

  return Widget.Box({
    cssClasses: ["goals", "tab-layout"],
    vertical: true,
    spacing: 12,
    children: [
      TopBar,
      Widget.Overlay({
        canTarget: true,
        child: [
          Scrollable({
            canTarget: true,
            cssClasses: ["overview"],
            hscrollbar_policy: "never",
            vscrollbar_policy: "always",
            overlayScrolling: false,
            hexpand: true,
            child: Widget.Box({
              vertical: true,
              vexpand: true,
              hexpand: true,
              children: [Categories],
            }),
          }),
        ],
        setup: (self) => {
          // self.add_overlay(
          //   Widget.Box({
          //     // children: [Sidebar({})],
          //   }),
          // );
        },
      }),
    ],
  });
};
