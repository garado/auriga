import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { register, property, signal } from "astal/gobject";
import Goals, { Goal } from "@/services/Goals";
import { GoalBox } from "./GoalBox";
import { bind } from "astal";

const gs = Goals.get_default();
const Scrollable = astalify(Gtk.ScrolledWindow);

interface CategoryProps extends Gtk.Box.ConstructorProps {
  category: string;
  isBigPicture?: boolean;
}

@register({ GTypeName: "Category" })
export class _Category extends Gtk.Box {
  @property(String)
  declare category: string;

  @property(Boolean)
  declare isBigPicture?: boolean;

  @property(Number)
  get numGoals() {
    return this.goalBoxList.children.length;
  }

  constructor(props: Partial<CategoryProps>) {
    super(props as any);

    this.isBigPicture ?? false;

    /*********************************************************************
     * UI SETUP
     *********************************************************************/

    this.orientation = Gtk.Orientation.VERTICAL;
    this.vexpand = true;
    this.hexpand = true;
    this.heightRequest = this.isBigPicture ? 400 : 300;

    // this.visible = bind(gs, "filters").as((f) => {});

    /**
     * Category header
     */
    const header = Widget.Label({
      cssClasses: this.isBigPicture
        ? ["big-picture-header"]
        : ["category-header"],
      label: this.isBigPicture ? "The big picture" : this.category,
      xalign: 0,
      wrap: true,
      maxWidthChars: 20,
      hexpand: true,
    });

    /**
     * List of goal boxes
     */
    this.goalBoxList = Widget.Box({
      vertical: false,
      hexpand: true,
      spacing: 12,
      setup: (self) => {
        const root = gs.data[this.category];
        self.children = root.children.map((goal: Goal) =>
          GoalBox({
            goal: goal,
            isBigPicture: this.category == "_bigpicture",
          }),
        );
      },
    });

    /**
     * Scrollable which contains the goalbox
     */
    const Container = Scrollable({
      child: this.goalBoxList,
      hexpand: true,
      vexpand: true,
      hscrollbar_policy: "always",
      vscrollbar_policy: "always",
    });

    this.append(header);
    this.append(Container);
  }
}

export const Category = (props: Partial<CategoryProps>) => {
  return new _Category(props);
};
