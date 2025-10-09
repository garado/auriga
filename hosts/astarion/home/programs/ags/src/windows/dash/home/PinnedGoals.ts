import Goals, { Goal } from "@/services/Goals";
import { hook, Widget } from "astal/gtk4";

const CSS_CLASSES = {
  CONTAINER: "pinned-goals",
  HEADER: "header",
  GOAL: "goal",
  GOAL_DESCRIPTIOIN: "description",
  GOAL_ICON: "goal-icon",
} as const;

const PinnedGoal = (goal: Goal) => {
  return Widget.Box({
    cssClasses: [CSS_CLASSES.GOAL, goal.project],
    vertical: false,
    spacing: 8,
    children: [
      Widget.Image({
        cssClasses: [CSS_CLASSES.GOAL_ICON],
        iconName: goal.icon,
      }),
      Widget.Label({
        cssClasses: [CSS_CLASSES.GOAL_DESCRIPTIOIN],
        label: goal.description,
        hexpand: true,
        wrap: true,
        xalign: 0,
      }),
    ],
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
    },
  });
};

export const PinnedGoals = () => {
  return Widget.Box({
    cssClasses: [CSS_CLASSES.CONTAINER, "widget-container"],
    vertical: true,
    spacing: 12,
    children: [
      Widget.Label({
        label: "Pinned Goals",
        cssClasses: [CSS_CLASSES.HEADER],
      }),
      PinnedGoalsContainer(),
    ],
  });
};
