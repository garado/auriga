/**
 * █▀█ █ █▄░█ █▄░█ █▀▀ █▀▄   █▀▀ █▀█ ▄▀█ █░░ █▀
 * █▀▀ █ █░▀█ █░▀█ ██▄ █▄▀   █▄█ █▄█ █▀█ █▄▄ ▄█
 *
 * Displays goals with the custom Taskwarrior UDA `pinned`.
 * Clicking one navigates to the goals tab to display more info on the target.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Goals, { Goal } from "@/services/Goals";
import { Gtk, Gdk, hook, Widget } from "astal/gtk4";
import { setActiveTabByName } from "..";
import { relativeTimeFromISO } from "@/utils/Helpers";

/*****************************************************************************
 * Module-level vars
 *****************************************************************************/

let goalService: InstanceType<typeof Goals> | undefined = undefined;

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  CONTAINER: "pinned-goals",
  HEADER: "header",
  GOAL: "goal",
  GOAL_DESCRIPTION: "description",
  GOAL_ICON: "goal-icon",
  GOAL_STATS: "goal-stats",
} as const;

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const PinnedGoal = (goal: Goal) => {
  const completedSubgoals = goal.children.filter(
    (child) => child.status === "completed",
  ).length;

  const icon = Widget.Image({
    cssClasses: [CSS_CLASSES.GOAL_ICON],
    iconName: goal.icon,
  });

  const description = Widget.Label({
    cssClasses: [CSS_CLASSES.GOAL_DESCRIPTION],
    label: goal.description,
    hexpand: true,
    wrap: true,
    xalign: 0,
  });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.GOAL, goal.project],
    spacing: 6,
    children: [
      icon,
      Widget.Box({
        cursor: Gdk.Cursor.new_from_name("pointer", null),
        vertical: true,
        spacing: 2,
        children: [
          description,
          Widget.Label({
            xalign: 0,
            cssClasses: [CSS_CLASSES.GOAL_STATS],
            label: `${completedSubgoals}/${goal.children.length} completed • due ${relativeTimeFromISO(goal.due)}`,
          }),
        ],
      }),
    ],
    onButtonPressed: () => {
      setActiveTabByName("Goals");
      goalService!.sidebarGoal = goal;
      goalService!.sidebarVisible = true;
    },
  });
};

export const PinnedGoalsContainer = () => {
  return Widget.Box({
    vertical: true,
    spacing: 8,
    setup: (self) => {
      hook(self, Goals.get_default(), "render-goals", () => {
        self.children = Goals.get_default().getPinnedGoals().map(PinnedGoal);
      });

      hook(self, Goals.get_default(), "pinned-goals-updated", () => {
        self.children = Goals.get_default().getPinnedGoals().map(PinnedGoal);
      });
    },
  });
};

export const PinnedGoals = () => {
  goalService = Goals.get_default();

  return Widget.Box({
    cssClasses: [CSS_CLASSES.CONTAINER, "widget-container"],
    vertical: true,
    spacing: 12,
    children: [
      Widget.Box({
        vertical: false,
        halign: Gtk.Align.CENTER,
        spacing: 8,
        children: [
          Widget.Image({
            iconName: "push-pin-symbolic",
          }),
          Widget.Label({
            label: "Pinned Goals",
            cssClasses: [CSS_CLASSES.HEADER],
          }),
        ],
      }),
      PinnedGoalsContainer(),
    ],
  });
};
