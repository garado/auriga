import Goals from "@/services/Goals";
import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { Category } from "./Category";
import { log } from "@/globals";
import { SegmentedButtonGroup } from "@/components/SegmentedButtonGroup";
import { Sidebar } from "@/windows/dash/goals/Sidebar";
import { bind } from "astal";

const gs = Goals.get_default();

export default () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);

  const ProgressFilters = SegmentedButtonGroup({
    buttons: [
      {
        name: "Completed",
        active: bind(gs, "filters").as((f) => f.completed),
        action: () => {
          gs.filters.completed = !gs.filters.completed;
          gs.filtersUpdated();
        },
      },
      {
        name: "In progress",
        active: bind(gs, "filters").as((f) => f.pending),
        action: () => {
          gs.filters.pending = !gs.filters.pending;
          gs.filtersUpdated();
        },
      },
      {
        name: "Failed",
        active: bind(gs, "filters").as((f) => f.failed),
        action: () => {
          gs.filters.failed = !gs.filters.failed;
          gs.filtersUpdated();
        },
      },
    ],
  });

  const StatusFilters = SegmentedButtonGroup({
    buttons: [
      {
        name: "Developed",
        active: bind(gs, "filters").as((f) => f.developed),
        action: () => {
          gs.filters.developed = !gs.filters.developed;
          gs.filtersUpdated();
        },
      },
      {
        name: "In development",
        active: bind(gs, "filters").as((f) => f.undeveloped),
        action: () => {
          gs.filters.undeveloped = !gs.filters.undeveloped;
          gs.filtersUpdated();
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
