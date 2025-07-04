import { Gtk, Gdk, Widget, hook, astalify } from "astal/gtk4";
import Goals, { Annotation, Goal } from "@/services/Goals";
import { bind, exec } from "astal";
import { formatISODateToCustomFormat } from "@/utils/Helpers";
import { Dropdown } from "@/components/Dropdown";

const gs = Goals.get_default();

/**
 * Show annotations.
 */
const GoalAnnotations = () => {
  const AnnotationWidget = (a: Annotation) =>
    Widget.Box({
      children: [
        Widget.Label({
          cssClasses: ["date"],
          label: formatISODateToCustomFormat(a.entry),
        }),
        Widget.Label({
          cssClasses: ["content"],
          label: a.description,
        }),
      ],
    });

  return Widget.Box({
    cssClasses: ["annotations"],
    visible: bind(gs, "sidebarGoal").as((g) => g?.annotations.length > 0),
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: ["section-header"],
        label: "Notes",
        xalign: 0,
      }),
      bind(gs, "sidebarGoal").as((g) => g?.annotations.map(AnnotationWidget)),
    ],
  });
};

/**
 * Show subgoals.
 */
const GoalChildren = () => {
  const Child = (child: Goal) => {
    let iconName = "circle-symbolic";

    if (child.status == "completed") {
      iconName = "check-circle-symbolic";
    }

    return Widget.Box({
      vertical: false,
      children: [
        Widget.Image({
          valign: Gtk.Align.START,
          iconName: iconName,
        }),
        Widget.Label({
          cssClasses: ["link", child.status],
          valign: Gtk.Align.START,
          hexpand: false,
          xalign: 0,
          label: child.description,
          wrap: true,
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          onButtonPressed: () => {
            gs.sidebarBreadcrumbs.push(gs.sidebarGoal);
            gs.sidebarBreadcrumbIndex++;
            gs.sidebarGoal = child;
          },
        }),
      ],
    });
  };

  return Widget.Box({
    cssClasses: ["children"],
    vertical: true,
    hexpand: false,
    visible: bind(gs, "sidebarGoal").as((g) => g?.children.length > 0),
    children: [
      Widget.Label({
        cssClasses: ["section-header"],
        label: "Subgoals",
        xalign: 0,
      }),
      bind(gs, "sidebarGoal").as((g) => g?.children.map(Child)),
    ],
  });
};

/**
 * Show and edit details for the currently selected goal.
 */
const GoalDetails = () => {
  const ListBox = astalify(Gtk.ListBox);

  const KeyWidgetFactory = (key: string) =>
    Widget.Label({
      cssClasses: ["key"],
      xalign: 0,
      valign: Gtk.Align.START,
      label: key,
    });

  const CategoryWidget = Widget.Entry({
    cssClasses: ["value"],
    hexpand: true,
    text: bind(gs, "sidebarGoal").as((g) => g?.project ?? "None"),
    onActivate: (self) => {
      gs.modify(gs.sidebarGoal, "project", self.text);
    },
  });

  const StatusWidget = Widget.Label({
    cssClasses: ["value"],
    hexpand: true,
    xalign: 0,
    label: bind(gs, "sidebarGoal").as((g) => g?.status ?? "None"),
  });

  const DueWidget = Widget.Entry({
    cssClasses: ["value"],
    hexpand: true,
    text: bind(gs, "sidebarGoal").as((g) =>
      g?.due ? formatISODateToCustomFormat(g.due) : "None",
    ),
    onActivate: (self) => {
      gs.modify(gs.sidebarGoal, "due", self.text);
    },
  });

  const IconWidget = Widget.Entry({
    cssClasses: ["value"],
    hexpand: true,
    text: bind(gs, "sidebarGoal").as((g) => {
      if (g) {
        return g.icon ?? "None";
      } else {
        return "None";
      }
    }),
    onActivate: (self) => {
      gs.modify(gs.sidebarGoal, "icon", self.text);
    },
  });

  const ParentWidget = Widget.Label({
    cssClasses: ["link"],
    valign: Gtk.Align.START,
    hexpand: false,
    xalign: 0,
    label: bind(gs, "sidebarGoal").as((g) => g?.parent?.description ?? "None"),
    wrap: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      gs.sidebarGoal = gs.sidebarBreadcrumbs.pop()!;
    },
  });

  const UUIDWidget = Widget.Label({
    cssClasses: ["value"],
    hexpand: true,
    xalign: 0,
    selectable: true,
    label: bind(gs, "sidebarGoal").as((g) => g?.uuid.substring(0, 7) ?? "None"),
  });

  const WhyWidget = astalify(Gtk.TextView)({
    hexpand: true,
    vexpand: true,
    cssClasses: ["value"],
    onKeyPressed: (self, keyval, _, state) => {
      /* Allow Shift-Return for newlines. Otherwise - treat "Return" as
       * "entry complete" signal. */
      if (Gdk.KEY_Return == keyval && Gdk.ModifierType.SHIFT_MASK != state) {
        self.editable = false; /* prob a better way to do this? */
        gs.modify(gs.sidebarGoal, "why", self.buffer.text);
      } else {
        self.editable = true;
      }
    },
    setup: (self) => {
      self.set_wrap_mode(Gtk.WrapMode.WORD);

      hook(self, gs, "notify::sidebar-goal", () => {
        self.buffer.text = gs.sidebarGoal?.why ?? "None";
      });
    },
  });

  const TimescaleWidget = Dropdown({
    exclusive: true,
  });

  return ListBox({
    cssClasses: ["details"],
    hexpand: true,
    vexpand: false,
    setup: (self) => {
      /* Stuff to display in list */
      const fields = [
        ["Category", CategoryWidget],
        ["Status", StatusWidget],
        ["Due", DueWidget],
        ["Parent", ParentWidget],
        ["Timescale", TimescaleWidget],
        ["Why", WhyWidget],
        ["Icon", IconWidget],
        ["UUID", UUIDWidget],
      ];

      /* Populate listbox with rows */
      fields.forEach(([label, value]: any) => {
        const row = Widget.Box({
          children: [KeyWidgetFactory(label), value],
        });

        self.append(row);
      });
    },
  });
};

const _SidebarTop = () => {
  /* Button to close sidebar */
  const CloseBtn = Widget.Image({
    halign: Gtk.Align.START,
    iconName: "x-symbolic",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      gs.sidebarVisible = false;
    },
  });

  /* Button to navigate to the last viewed goal */
  const Breadcrumbs = Widget.Box({
    spacing: 4,
    halign: Gtk.Align.START,
    cssClasses: ["breadcrumbs"],
    children: [
      Widget.Image({
        iconName: "caret-left-symbolic",
        cursor: Gdk.Cursor.new_from_name("pointer", null),
        onButtonPressed: () => {
          if (gs.sidebarBreadcrumbs.length > 0) {
            gs.sidebarGoal = gs.sidebarBreadcrumbs.pop()!;
          }
        },
      }),
      // Widget.Image({
      //   iconName: "caret-right-symbolic",
      //   cursor: Gdk.Cursor.new_from_name("pointer", null),
      //   visible: bind(gs, "sidebarBreadcrumbIndex").as((bci) => bci > 0),
      //   onButtonPressed: () => {},
      // }),
    ],
  });

  /* Goal title */
  const Description = Widget.Label({
    cssClasses: ["description"],
    label: bind(gs, "sidebarGoal").as((g) => g?.description ?? "None"),
    maxWidthChars: 30,
    wrap: true,
    xalign: 0,
  });

  return Widget.Box({
    vertical: true,
    spacing: 12,
    children: [
      Widget.CenterBox({
        orientation: Gtk.Orientation.HORIZONTAL,
        startWidget: Breadcrumbs,
        endWidget: CloseBtn,
      }),
      Description,
      GoalDetails(),
      GoalChildren(),
      GoalAnnotations(),
    ],
  });
};

export const Sidebar = () => {
  return Widget.Box({
    canTarget: true,
    cssClasses: ["sidebar"],
    vertical: true,
    vexpand: true,
    hexpand: true,
    children: [_SidebarTop()],
  });
};
