import { Gdk, Gtk, Widget, astalify, hook } from "astal/gtk4";
import { bind } from "astal";
import Tasks, { Task } from "@/services/Tasks";
import { relativeTimeFromISO } from "@/utils/Helpers";
import { EventControllerKeySetup } from "@/utils/EventControllerKeySetup";

const ts = Tasks.get_default();

const Placeholder = () =>
  Widget.Label({
    label: "No tasks found.",
    vexpand: true,
  });

/**
 * Yeah
 */
const TaskWidget = (task: Task) => {
  const Indicator = Widget.Label({
    cssClasses: ["indicator"],
    xalign: 0,
    label: bind(ts, "selectedTask").as((st) =>
      st?.uuid == task.uuid ? "∘" : "",
    ),
  });

  const Desc = Widget.Label({
    cssClasses: ["description"],
    label: task.description,
  });

  const Due = Widget.Label({
    cssClasses: ["due"],
    label: task.due ? relativeTimeFromISO(task.due) : "No due date",
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
    endWidget: Due,
    onButtonPressed: () => {
      ts.selectedTask = task;
    },
  });
};

export default () => {
  const Scrollable = astalify(Gtk.ScrolledWindow);
  const ListBox = astalify(Gtk.ListBox);

  const Header = Widget.CenterBox({
    cssClasses: ["header"],
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Label({
      label: bind(ts, "selectedProject"),
    }),
  });

  const Subheader = Widget.CenterBox({
    cssClasses: ["subheader"],
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Label({
      label: bind(ts, "selectedTag"),
    }),
  });

  const TopBar = Widget.Box({
    vertical: true,
    hexpand: true,
    children: [Header, Subheader],
  });

  const CommandBar = Widget.Entry({
    hexpand: true,
    placeholderText: "search or command...",
    onActivate: () => {},
  });

  const Content = ListBox({
    orientation: Gtk.Orientation.VERTICAL,
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

  return Widget.Box({
    cssClasses: ["widget-container", "tasklist"],
    hexpand: true,
    vertical: true,
    spacing: 12,
    children: [
      TopBar,
      Scrollable({
        child: Content,
      }),
      CommandBar,
    ],
    setup: (self) => {
      EventControllerKeySetup({
        name: "Tasklist",
        widget: self,
        forwardTo: CommandBar,
        binds: {},
      });
    },
  });
};
