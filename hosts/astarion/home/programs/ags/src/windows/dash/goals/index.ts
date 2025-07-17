/**
 * █▀▀ █▀█ ▄▀█ █░░ █▀
 * █▄█ █▄█ █▀█ █▄▄ ▄█
 *
 * Displays overview and details for goals I have set.
 * Allows searching and filtering through available goals.
 *
 * Goals are set in Taskwarrior - see `services/Goals.ts`
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { bind } from "astal";
import { setupEventController } from "@/utils/EventControllerKeySetup";

import { GoalBox } from "@/windows/dash/goals/GoalBox";
import Goals, { Goal } from "@/services/Goals";
import TopBar from "./TopBar";
import { Sidebar } from "./Sidebar";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const gs = Goals.get_default();

const Scrollable = astalify(Gtk.ScrolledWindow);
const FlowBox = astalify(Gtk.FlowBox);

const LAYOUT_CONFIG = {
  MIN_COLUMNS: 4,
  MAX_COLUMNS: 8,
  ROW_SPACING: 12,
  COLUMN_SPACING: 12,
  MAIN_SPACING: 12,
} as const;

const CSS_CLASSES = {
  GOALS: "goals",
  CONTENT: "content",
  OVERVIEW: "overview",
} as const;

const KEYBOARD_SHORTCUTS = {
  CLOSE_SIDEBAR: "Escape",
  REFRESH_GOALS: "r",
} as const;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/
/**
 * Filter function to determine if a goal widget should be visible
 * based on current search and filter criteria
 * @param widget - The goal box widget to test
 * @returns True if the goal matches current filters
 */
const goalFilterFunction = (widget: any) => {
  return gs.isMatching(widget.child.goal);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

// Container for main content.
const createMainContentArea = () =>
  FlowBox({
    cssClasses: [CSS_CLASSES.CONTENT],
    homogeneous: true,
    minChildrenPerLine: LAYOUT_CONFIG.MIN_COLUMNS,
    maxChildrenPerLine: LAYOUT_CONFIG.MAX_COLUMNS,
    rowSpacing: 12,
    columnSpacing: 12,
    setup: (self) => {
      // For each category, insert top-level goals
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

      // Filter functions
      self.set_filter_func(goalFilterFunction);
    },
  });

// Panel displaying more information about a specific goal
const createSidebarContainer = () =>
  Widget.Revealer({
    halign: Gtk.Align.END,
    canTarget: true,
    child: Sidebar(),
    transitionType: Gtk.RevealerTransitionType.SLIDE_LEFT,
    revealChild: bind(gs, "sidebarVisible"),
  });

// Sidebar overlaid on top of main content
const createOverlay = () =>
  Widget.Overlay({
    canTarget: true,
    child: Scrollable({
      canTarget: true,
      cssClasses: [CSS_CLASSES.OVERVIEW],
      hscrollbar_policy: "never",
      vscrollbar_policy: "always",
      overlayScrolling: false,
      hexpand: true,
      child: Widget.Box({
        vertical: true,
        vexpand: true,
        hexpand: true,
        children: [createMainContentArea()],
      }),
    }),
    setup: (self) => {
      self.add_overlay(createSidebarContainer());
    },
  });

/**
 * Creates the main goals overview interface
 * @returns The complete goals widget with topbar, content, and sidebar
 */
export default () => {
  return Widget.Box({
    cssClasses: [CSS_CLASSES.GOALS],
    vertical: true,
    spacing: 12,
    children: [TopBar(), createOverlay()],
    setup: (self) => {
      setupEventController({
        name: "Goals",
        widget: self,
        binds: {
          [KEYBOARD_SHORTCUTS.CLOSE_SIDEBAR]: () => {
            gs.sidebarVisible = false;
          },
          [KEYBOARD_SHORTCUTS.REFRESH_GOALS]: () => {
            gs.fetchGoals();
          },
        },
      });
    },
  });
};
