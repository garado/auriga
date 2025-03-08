import { Gtk, Gdk, Widget, hook } from "astal/gtk4";
import { register, property } from "astal/gobject";
import Goals, { Goal } from "@/services/Goals";
import UserConfig from "../../../../userconfig.js";
import { relativeTimeFromISO } from "@/utils/Helpers.js";

const gs = Goals.get_default();

interface GoalBoxProps extends Gtk.Box.ConstructorProps {
  goal: Goal;
  isBigPicture?: boolean;
}

@register({ GTypeName: "GoalBox" })
export class _GoalBox extends Gtk.CenterBox {
  /* Properties */
  @property(Object)
  declare goal: Goal;

  @property(Boolean)
  declare isBigPicture?: boolean;

  constructor(props: Partial<GoalBoxProps>) {
    super(props as any);

    /***********************************************************************
     * PROPERTY SETUP
     ***********************************************************************/

    this.isBigPicture = this.isBigPicture || false;
    this.orientation = Gtk.Orientation.VERTICAL;
    this.cursor = Gdk.Cursor.new_from_name("pointer", null);
    this.vexpand = false;
    this.hexpand = false;

    this.cssClasses = [
      "goalbox",
      this.isBigPicture ? "big-picture" : "",
      this.goal.project,
    ];

    /***********************************************************************
     * UI SETUP
     ***********************************************************************/

    const desc = Widget.Label({
      cssClasses: ["description"],
      label: this.goal.description,
      wrap: true,
      maxWidthChars: 16,
      justify: Gtk.Justification.CENTER,
    });

    const goalIcon = Widget.Image({
      cssClasses: ["goal-icon"],
      iconName: this.goal.icon,
    });

    const categoryIcon = Widget.Image({
      cssClasses: ["category-icon"],
      iconName: UserConfig.goals.categoryIcons[this.goal.project],
    });

    const _total = this.goal.children.length;

    const _done = this.goal.children.filter(
      (x) => x.status == "completed",
    ).length;

    const progress = Widget.Label({
      label: `${_done}/${_total}`,
      visible: _total > 0,
    });

    const targetDate = Widget.Label({
      label: this.goal.due ? relativeTimeFromISO(this.goal.due) : "none",
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
      startWidget: progress,
      endWidget: targetDate,
    });

    this.startWidget = top;
    this.centerWidget = mid;
    this.endWidget = bottom;

    /***********************************************************************
     * INTERACTIONS
     ***********************************************************************/

    const click = new Gtk.GestureClick();

    click.connect("pressed", () => {
      gs.sidebarVisible = true;
      gs.sidebarGoal = this.goal;
    });

    this.add_controller(click);
  }
}

export const GoalBox = (props: Partial<GoalBoxProps>) => {
  return new _GoalBox(props);
};
