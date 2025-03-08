import { Gtk, Gdk, Widget, hook, astalify } from "astal/gtk4";
import Goals, { Goal } from "@/services/Goals";
import { bind } from "astal";
import { formatISODateToCustomFormat } from "@/utils/Helpers";

const gs = Goals.get_default();

/**
 * Show children
 */
const GoalChildren = () => {
  const Child = (child: Goal) => {
    let iconName = "circle-symbolic";

    if (child.status == "completed") {
      iconName = "check-circle-symbolic";
    }

    return Widget.Box({
      vertical: false,
      cssClasses: [child.status],
      children: [
        Widget.Image({
          valign: Gtk.Align.START,
          iconName: iconName,
        }),
        Widget.Label({
          valign: Gtk.Align.START,
          hexpand: false,
          xalign: 0,
          label: child.description,
          wrap: true,
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
 * Show more details for the currently selected goal.
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

  const CategoryWidget = Widget.Label({
    hexpand: true,
    xalign: 0,
    label: bind(gs, "sidebarGoal").as((g) => g?.project ?? "None"),
  });

  const StatusWidget = Widget.Label({
    hexpand: true,
    xalign: 0,
    label: bind(gs, "sidebarGoal").as((g) => g?.status ?? "None"),
  });

  const DueWidget = Widget.Entry({
    hexpand: true,
    text: bind(gs, "sidebarGoal").as((g) => {
      if (g) {
        return g.due ? formatISODateToCustomFormat(g.due) : "None";
      } else {
        return "None";
      }
    }),
  });

  const ParentWidget = Widget.Label({
    hexpand: true,
    xalign: 0,
    label: bind(gs, "sidebarGoal").as((g) => g?.parent?.description ?? "None"),
  });

  const WhyWidget = astalify(Gtk.TextView)({
    hexpand: true,
    vexpand: true,
    cssClasses: ["textview"],
    setup: (self) => {
      self.set_wrap_mode(Gtk.WrapMode.WORD);

      hook(self, gs, "notify::sidebar-goal", () => {
        self.buffer.text = gs.sidebarGoal?.why ?? "None";
      });
    },
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
        ["Why", WhyWidget],
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
        onButtonPressed: () => {
          gs.sidebarVisible = false;
        },
      }),
      // Widget.Box({
      //   child: Widget.Icon("arrow-left-symbolic"),
      //   visible: GoalService.bind("sidebar-breadcrumbs").as(
      //     (x) => x.length > 0,
      //   ),
      //   onPrimaryClick: () => {
      //     GoalService.followBreadcrumbs(-1);
      //   },
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
    spacing: 8,
    children: [
      Widget.CenterBox({
        orientation: Gtk.Orientation.HORIZONTAL,
        startWidget: Breadcrumbs,
        endWidget: CloseBtn,
      }),
      Description,
      GoalDetails(),
      GoalChildren(),
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
