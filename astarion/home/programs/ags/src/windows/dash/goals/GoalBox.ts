import { Gtk, Gdk, Widget, astalify, hook } from "astal/gtk4";
import { register, property } from "astal/gobject";
import Goals, { Goal } from "@/services/Goals";
import Gio from "gi://Gio";
import { bind, Binding } from "astal";
import Pango from "gi://Pango?version=1.0";

const gs = Goals.get_default();

interface GoalBoxProps extends Gtk.Overlay.ConstructorProps {
  goal: Goal;
  isBigPicture?: boolean;
}

@register({ GTypeName: "GoalBox" })
export class _GoalBox extends Gtk.Overlay {
  /* Properties */
  @property(Object)
  declare goal: Goal;

  @property(Boolean)
  declare isBigPicture?: boolean;

  constructor(props: Partial<GoalBoxProps>) {
    super(props as any);
    this.isBigPicture = this.isBigPicture || false;
    this.cssClasses = ["goalbox", this.isBigPicture ? "big-picture" : ""];
    this.cursor = Gdk.Cursor.new_from_name("pointer", null);
    this.vexpand = false;
    this.hexpand = false;

    gs.connect("settings-changed", () => {
      if (!this.isBigPicture) {
        this.visible = gs.isMatching(this.goal);

        hook(this, gs, "settings-changed", () => {
          this.visible = gs.isMatching(this.goal);
        });
      }
    });

    const title = Widget.Label({
      cssClasses: this.isBigPicture ? ["big-picture-title"] : ["title"],
      valign: Gtk.Align.START,
      xalign: 0,
      ellipsize: Pango.EllipsizeMode.END,
      wrap: false,
      label:
        this.goal.status == "completed" || this.goal.status == "failed"
          ? `<s>${this.goal.description}</s>`
          : this.goal.description,
      useMarkup: true,
    });

    const status = Widget.Label({
      cssClasses: [this.goal.status],
      label:
        this.goal.status.charAt(0).toUpperCase() + this.goal.status.slice(1),
      halign: Gtk.Align.START,
    });

    const targetDate = Widget.Box({
      cssClasses: ["due"],
      spacing: 4,
      setup: (self) => {
        if (!this.goal.due) return;
        self.children = [
          Widget.Image({
            halign: Gtk.Align.END,
            iconName: "clock-symbolic",
          }),
          Widget.Label({
            valign: Gtk.Align.END,
            // label: gs.tasktimeToYYYYMMDD(this.goal.due),
          }),
        ];
      },
    });

    const progress = Widget.Box({
      cssClasses: ["progress"],
      halign: Gtk.Align.END,
      spacing: 4,
      setup: (self) => {
        const total = this.goal.children.length;
        if (total == 0) return;

        /* Count completed subgoals */
        const completed = this.goal.children.filter(
          (x) => x.status == "completed",
        ).length;

        self.children = [
          Widget.Image({
            valign: Gtk.Align.END,
            iconName: "check-circle-symbolic",
          }),
          Widget.Label({
            valign: Gtk.Align.END,
            label: `${completed}/${total}`,
          }),
        ];
      },
    });

    let pinned = null;
    const firstPinnedSubnode = this.goal.children.find((x) => x.start);

    if (firstPinnedSubnode) {
      pinned = Widget.Box({
        cssClasses: ["pinned"],
        spacing: 2,
        children: [
          Widget.Image({
            iconName: "caret-right-symbolic",
          }),
          Widget.Label({
            wrap: true,
            xalign: 0,
            label: firstPinnedSubnode.description,
          }),
        ],
      });
    }

    const information = Widget.CenterBox({
      cssClasses: ["interior"],
      orientation: 1,
      startWidget: Widget.Box({
        cssClasses: ["top"],
        vertical: true,
        valign: Gtk.Align.START,
        spacing: 6,
        children: [title],
        setup: (self) => {
          if (this.goal.status != "pending") {
            self.append(status);
          }

          if (pinned != null) {
            self.append(pinned);
          }
        },
      }),
      endWidget: Widget.CenterBox({
        cssClasses: ["bottom"],
        startWidget: targetDate,
        endWidget: progress,
      }),
    });

    this.child = astalify(Gtk.Picture)({
      cssClasses: ["imagebox"],
      contentFit: Gtk.ContentFit.FILL,
      file: Gio.File.new_for_path(this.goal.imgpath),
    });

    this.add_overlay(information);
  }
}

export const GoalBox = (props: Partial<GoalBoxProps>) => {
  return new _GoalBox(props);
};
