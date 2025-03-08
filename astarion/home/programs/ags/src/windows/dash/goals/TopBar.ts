import Goals from "@/services/Goals";
import { Gtk, hook, Widget } from "astal/gtk4";
import { SegmentedButtonGroup } from "@/components/SegmentedButtonGroup";
import { bind } from "astal";

const gs = Goals.get_default();

export default () => {
  const Header = Widget.Label({
    cssClasses: ["header"],
    label: "Goals",
    justify: Gtk.Justification.LEFT,
  });

  const Search = Widget.Entry({
    canFocus: true,
    focusOnClick: true,
    focusable: true,
    placeholderText: "search...",
    onActivate: () => {},
  });

  const SearchContainer = Widget.Box({
    cssClasses: ["search-container"],
    vertical: false,
    spacing: 3,
    children: [
      Widget.Image({
        iconName: "magnifying-glass-symbolic",
      }),
      Search,
    ],
  });

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

  const CategorySelect = Widget.Box({
    setup: (self) => {
      /* For each category, insert top-level goals */
      hook(self, gs, "render-goals", (self, data) => {
        if (data == undefined) return;

        const categories = Object.keys(data).sort();

        categories.forEach((c: string) => {
          self.append(
            Widget.Label({
              label: c,
            }),
          );
        });
      });
    },
  });

  const Top = Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Header,
    endWidget: SearchContainer,
  });

  const Bottom = Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Box({
      cssClasses: ["filters"],
      spacing: 12,
      children: [ProgressFilters, StatusFilters],
    }),
  });

  return Widget.Box({
    cssClasses: ["top-bar"],
    vertical: true,
    spacing: 6,
    children: [Top, Bottom],
  });
};
