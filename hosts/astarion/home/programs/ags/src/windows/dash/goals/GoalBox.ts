/**
 * █▀▀ █▀█ ▄▀█ █░░   █▄▄ █▀█ ▀▄▀
 * █▄█ █▄█ █▀█ █▄▄   █▄█ █▄█ █░█
 *
 * A widget that displays information on a goal: progress, description, target date.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Gdk, Widget } from "astal/gtk4";
import { register, property } from "astal/gobject";

import Goals, { Goal } from "@/services/Goals";
import { relativeTimeFromISO } from "@/utils/Helpers.js";
import UserConfig from "../../../../userconfig.js";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const gs = Goals.get_default();

const CSS_CLASSES = {
  GOAL_BOX: "goalbox",
  BIG_PICTURE: "big-picture",
  DESCRIPTION: "description",
  GOAL_ICON: "goal-icon",
  CATEGORY_ICON: "category-icon",
  PROGRESS_INDICATOR: "progress-indicator",
  TARGET_DATE: "target-date",
} as const;

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

interface GoalBoxProps extends Gtk.Box.ConstructorProps {
  goal: Goal;
}

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Safely gets the category icon for a goal's project
 * @param projectName - The project name to get icon for
 * @returns Icon name or default fallback
 */
const getCategoryIcon = (projectName: string): string => {
  const categoryIcons = UserConfig.goals?.categoryIcons;
  return categoryIcons?.[projectName] || "folder-symbolic";
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

@register({ GTypeName: "GoalBox" })
export class _GoalBox extends Gtk.CenterBox {
  // Properties ------------------------------------------------------------
  @property(Object) declare goal: Goal;

  // Private methods -------------------------------------------------------
  constructor(props: Partial<GoalBoxProps>) {
    super(props as any);

    // Widget setup
    this.orientation = Gtk.Orientation.VERTICAL;
    this.cursor = Gdk.Cursor.new_from_name("pointer", null);
    this.vexpand = false;
    this.hexpand = false;
    this.cssClasses = [CSS_CLASSES.GOAL_BOX, this.goal.project];

    // UI setup
    const desc = Widget.Label({
      cssClasses: [CSS_CLASSES.DESCRIPTION],
      label: this.goal.description,
      wrap: true,
      maxWidthChars: 16,
      justify: Gtk.Justification.CENTER,
    });

    const goalIcon = Widget.Image({
      cssClasses: [CSS_CLASSES.GOAL_ICON],
      iconName: this.goal.icon,
    });

    const categoryIcon = Widget.Image({
      cssClasses: [CSS_CLASSES.CATEGORY_ICON],
      iconName: getCategoryIcon(this.goal.project),
    });

    const top = Widget.CenterBox({
      endWidget: categoryIcon,
    });

    const mid = Widget.Box({
      vertical: true,
      spacing: 4,
      children: [goalIcon, desc],
    });

    const bottom = Widget.CenterBox({
      startWidget: this.createProgressWidget(),
      endWidget: this.createTargetDateWidget(),
    });

    this.startWidget = top;
    this.centerWidget = mid;
    this.endWidget = bottom;

    // Interactivity
    const click = new Gtk.GestureClick();
    this.add_controller(click);
    click.connect("pressed", this.handleClick.bind(this));
  }

  /**
   * Creates the progress display widget
   * @returns Progress label widget or null if no subgoals
   */
  private createProgressWidget(): Gtk.Label | null {
    const totalSubgoals = this.goal.children.length;

    const completedSubgoals = this.goal.children.filter(
      (child) => child.status === "completed",
    ).length;

    return totalSubgoals > 0
      ? Widget.Label({
          label: `${completedSubgoals}/${totalSubgoals}`,
          cssClasses: [CSS_CLASSES.PROGRESS_INDICATOR],
        })
      : null;
  }

  /**
   * Creates the target date display widget
   * @returns Target date label widget
   */
  private createTargetDateWidget(): Gtk.Label {
    const dateText = this.goal.due
      ? relativeTimeFromISO(this.goal.due)
      : "none";

    return Widget.Label({
      label: dateText,
      cssClasses: [CSS_CLASSES.TARGET_DATE],
    });
  }

  /**
   * Handles goal box click events
   * Opens the sidebar with this goal's details
   */
  private handleClick(): void {
    gs.sidebarVisible = true;
    gs.sidebarGoal = this.goal;
  }
}

/**
 * Factory function to create a GoalBox widget
 * @param props - Configuration properties for the goal box
 * @returns A new GoalBox instance
 */
export const GoalBox = (props: Partial<GoalBoxProps>) => {
  return new _GoalBox(props);
};
