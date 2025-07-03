/**
 * ▀█▀ ▄▀█ █▀ █▄▀   █░░ █ █▀ ▀█▀
 * ░█░ █▀█ ▄█ █░█   █▄▄ █ ▄█ ░█░
 *
 * Shows tasks for the currently selected project.
 */

import { Gdk, Gtk, Widget, astalify, hook } from "astal/gtk4";
import Tasks, { Task } from "@/services/Tasks";
import { relativeTimeFromISO } from "@/utils/Helpers";
import { bind } from "astal";
import Pango from "gi://Pango?version=1.0";

const ts = Tasks.get_default();

const commonPrefix = (str1: string, str2: string): string => {
  let prefix = "";
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    prefix += str1[i];
    i++;
  }

  return prefix;
};

/**
 * Show if no tasks are present.
 */
const Placeholder = () =>
  Widget.Label({
    label: "No tasks found.",
    vexpand: true,
  });

/**
 * Constructor for top bar showing statistics for the currently selected
 * project.
 */
const TopBar = () => {
  const Header = Widget.CenterBox({
    cssClasses: ["header"],
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Label({
      label: bind(ts, "selectedProject").as(
        (x) => x?.data.name ?? "No project selected",
      ),
    }),
  });

  const Breadcrumbs = Widget.Box({
    cssClasses: ["breadcrumbs"],
    children: bind(ts, "selectedProject").as((x) => {
      if (x === null) return [Widget.Label()];

      const children: Array<Gtk.Widget> = [];

      x.data.hierarchy.forEach((value, index) => {
        children.push(
          Widget.Label({
            label: value,
          }),
        );

        if (index != x.data.hierarchy.length - 1) {
          children.push(
            Widget.Image({
              iconName: "caret-right-symbolic",
            }),
          );
        }
      });

      return children;
    }),
  });

  return Widget.Box({
    vertical: true,
    hexpand: true,
    children: [Header, Breadcrumbs],
  });
};

/**
 * Constructor for a widget displaying a single task.
 */
const TaskWidget = (task: Task) => {
  const Indicator = Widget.Label({
    cssClasses: ["indicator"],
    xalign: 0,
    // label: bind(ts, "selectedTask").as((st) =>
    //   st?.uuid == task.uuid ? "∘" : "",
    // ),
  });

  const Desc = Widget.Label({
    cssClasses: ["description"],
    label: task.description,
  });

  const Due = Widget.Label({
    cssClasses: ["due"],
    hexpand: false,
    justify: Gtk.Justification.LEFT,
    ellipsize: Pango.EllipsizeMode.END,
    label: task.due ? relativeTimeFromISO(task.due) : "No due date",
  });

  const Project = Widget.Label({
    cssClasses: ["project"],
    hexpand: false,
    ellipsize: Pango.EllipsizeMode.END,
    justify: Gtk.Justification.LEFT,
    setup: (self) => {
      const hierarchy = [
        ...ts.selectedProject.data.hierarchy,
        ts.selectedProject.data.name,
      ];

      const prefix = commonPrefix(task.project, hierarchy.join("."));
      const display = task.project.replace(prefix, "");
      self.label = display.replace(/^\./, "");
    },
  });

  /* My task urgencies appear to be roughly in the range 0 to 25ish.
   * Convert to range 1-5, so we can assign different shades of red to it. */
  const normalizedUrgency = Math.round((task.urgency / 25) * 5);

  return Widget.CenterBox({
    cssClasses: ["task", `urgency-${normalizedUrgency * 100}`],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: true,
    vexpand: false,
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Box({
      vertical: false,
      children: [Indicator, Desc],
    }),
    endWidget: Widget.Box({
      spacing: 6,
      vertical: false,
      children: [Project, Due],
    }),
    // onButtonPressed: () => {
    //   ts.selectedTask = task;
    // },
  });
};

export default () => {
  const ListBox = astalify(Gtk.ListBox);

  const CommandBar = Widget.Entry({
    hexpand: true,
    placeholderText: "search or command...",
    onActivate: () => {},
  });

  const Content = ListBox({
    hexpand: true,
    vexpand: true,
    setup: (self) => {
      hook(self, ts, "notify::displayed-tasks", () => {
        self.remove_all();

        const dt = ts.displayedTasks;

        if (dt == undefined) {
          self.append(Placeholder());
        } else {
          dt.map((t: Task) => {
            self.append(TaskWidget(t));
          });
        }
      });
    },
  });

  const Scrollable = new Gtk.ScrolledWindow({
    child: Content,
  });

  return Widget.Box({
    cssClasses: ["widget-container", "tasklist"],
    hexpand: true,
    vexpand: true,
    vertical: true,
    spacing: 12,
    children: [TopBar(), Scrollable],
  });
};
