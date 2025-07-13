import Goals, { Goal } from "@/services/Goals";
import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { GoalBox } from "@/windows/dash/goals/GoalBox";
import TopBar from "./TopBar";
import { Sidebar } from "./Sidebar";
import { bind } from "astal";
import { setupEventController } from "@/utils/EventControllerKeySetup";

const gs = Goals.get_default();

export default () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);
  const FlowBox = astalify(Gtk.FlowBox);

  const FilterFunction = (widget: Gtk.FlowBoxChild) => {
    return gs.isMatching(widget.child.goal);
  };

  /**
   * Container for main content
   */
  const MainContent = FlowBox({
    cssClasses: ["content"],
    homogeneous: true,
    minChildrenPerLine: 4,
    maxChildrenPerLine: 8,
    rowSpacing: 12,
    columnSpacing: 12,
    setup: (self) => {
      /* For each category, insert top-level goals */
      hook(self, gs, "render-goals", (self, data) => {
        if (data == undefined) return;

        self.remove_all();

        const categories = Object.keys(data).sort();
        categories.forEach((c: string) => {
          const root = data[c];

          root.children.forEach((child: Goal) => {
            self.append(
              GoalBox({
                goal: child,
              }),
            );
          });
        });
      });

      hook(self, gs, "notify::filters", () => {
        self.invalidate_filter();
      });

      hook(self, gs, "notify::search", () => {
        self.invalidate_filter();
      });

      /* Filter functions */
      self.set_filter_func(FilterFunction);
    },
  });

  /**
   * Panel displaying more information about a specific goal
   */
  const SidebarContainer = Widget.Revealer({
    halign: Gtk.Align.END,
    canTarget: true,
    child: Sidebar(),
    transitionType: Gtk.RevealerTransitionType.SLIDE_LEFT,
    revealChild: bind(gs, "sidebarVisible"),
  });

  /**
   * Overlay sidebar on top of main content
   */
  const Overlay = Widget.Overlay({
    canTarget: true,
    child: Scrollable({
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
        children: [MainContent],
      }),
    }),
    setup: (self) => {
      self.add_overlay(SidebarContainer);
    },
  });

  /**
   * Final assembly
   */
  return Widget.Box({
    cssClasses: ["goals"],
    vertical: true,
    spacing: 12,
    children: [TopBar(), Overlay],
    setup: (self) => {
      setupEventController({
        name: "Goals",
        widget: self,
        binds: {
          Escape: () => {
            gs.sidebarVisible = false;
          },
          r: () => {
            gs.fetchGoals();
          },
        },
      });
    },
  });
};
