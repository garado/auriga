/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 *
 * Shows detailed information for a particular goal and allow editing goal
 * metadata.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Gdk, Widget, hook, astalify } from "astal/gtk4";
import { bind } from "astal";

import Goals, { Annotation, Goal } from "@/services/Goals";
import { formatISODateToCustomFormat } from "@/utils/Helpers";
import { Dropdown } from "@/components/Dropdown";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let goalsService: InstanceType<typeof Goals> | undefined = undefined;

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  sidebar: "sidebar",
  sectionHeader: "section-header",
  fieldKey: "field-key",
  fieldValue: "field-value",
  clickableLink: "clickable-link",
  goalDescription: "goal-description",
  breadcrumbNavigation: "breadcrumb-navigation",
  annotationsSection: "annotations-section",
  annotationDate: "annotation-date",
  annotationContent: "annotation-content",
  childrenSection: "children-section",
  detailsSection: "details-section",
} as const;

const STATUS_ICONS = {
  completed: "check-circle-symbolic",
  default: "circle-symbolic",
  close: "x-symbolic",
  caretLeft: "caret-left-symbolic",
  caretRight: "caret-right-symbolic",
} as const;

const KEYBOARD_SHORTCUTS = {
  ENTER: Gdk.KEY_Return,
  SHIFT_ENTER: Gdk.ModifierType.SHIFT_MASK,
} as const;

/** List model for timescale dropdown */
const timescaleOptions = ["<none>", "short", "mid", "long", "aspirational"];

const timescaleListModel = Gtk.StringList.new(timescaleOptions);

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * Renders a list of annotations for the current goal.
 */
const GoalAnnotationsSection = () => {
  // Displays a single annottation
  const AnnotationWidget = (annotation: Annotation) =>
    Widget.Box({
      children: [
        Widget.Label({
          cssClasses: [CSS_CLASSES.annotationDate],
          label: formatISODateToCustomFormat(annotation.entry),
        }),
        Widget.Label({
          cssClasses: [CSS_CLASSES.annotationContent],
          label: annotation.description,
        }),
      ],
    });

  // Instantiate one of the above for every annotation
  return Widget.Box({
    cssClasses: [CSS_CLASSES.annotationsSection],
    visible: bind(goalsService!, "sidebarGoal").as(
      (goal) => goal?.annotations!.length > 0,
    ),
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.sectionHeader],
        label: "Notes",
        xalign: 0,
      }),
      bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.annotations!.map(AnnotationWidget) ?? [],
      ),
    ],
  });
};

/**
 * Renders a list of subgoals for the current goal.
 */
const GoalChildrenSection = () => {
  /**
   * Displays a single child goal.
   * @param childGoal - The child goal to display
   */
  const ChildGoalWidget = (childGoal: Goal) => {
    const iconName =
      childGoal.status === "completed"
        ? STATUS_ICONS.completed
        : STATUS_ICONS.default;

    const handleChildGoalNavigation = () => {
      goalsService!.sidebarBreadcrumbs.push(goalsService!.sidebarGoal);
      goalsService!.sidebarBreadcrumbIndex++;
      goalsService!.sidebarGoal = childGoal;
    };

    return Widget.Box({
      vertical: false,
      children: [
        Widget.Image({
          valign: Gtk.Align.START,
          iconName: iconName,
        }),
        Widget.Label({
          cssClasses: [CSS_CLASSES.clickableLink, childGoal.status],
          valign: Gtk.Align.START,
          hexpand: false,
          xalign: 0,
          label: childGoal.description,
          wrap: true,
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          onButtonPressed: handleChildGoalNavigation,
        }),
      ],
    });
  };

  return Widget.Box({
    cssClasses: [CSS_CLASSES.childrenSection],
    vertical: true,
    hexpand: false,
    visible: bind(goalsService!, "sidebarGoal").as(
      (goal) => goal?.children.length > 0,
    ),
    children: [
      Widget.Label({
        cssClasses: [CSS_CLASSES.sectionHeader],
        label: "Subgoals",
        xalign: 0,
      }),
      bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.children.map(ChildGoalWidget) ?? [],
      ),
    ],
  });
};

/**
 * Renders editable details for the currently selected goal.
 */
const GoalDetailsSection = () => {
  const DetailsList = astalify(Gtk.ListBox);

  /**
   * Label widget for form field keys.
   * @param labelText - The label text to display
   */
  const FieldLabel = (labelText: string) =>
    Widget.Label({
      cssClasses: [CSS_CLASSES.fieldKey],
      xalign: 0,
      valign: Gtk.Align.CENTER,
      label: labelText,
    });

  /** Editable entry widget for the goal's project/category. */
  const ProjectEntry = () =>
    Widget.Entry({
      cssClasses: [CSS_CLASSES.fieldValue],
      hexpand: true,
      text: bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.project ?? "None",
      ),
      onActivate: (self) => {
        goalsService!.modify(goalsService!.sidebarGoal, "project", self.text);
      },
    });

  /** Read-only label for the goal's status. */
  const StatusLabel = () =>
    Widget.Label({
      cssClasses: [CSS_CLASSES.fieldValue],
      hexpand: true,
      xalign: 0,
      label: bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.status ?? "None",
      ),
    });

  /** Editable entry widget for the goal's due date. */
  const DueDateEntry = () =>
    Widget.Entry({
      cssClasses: [CSS_CLASSES.fieldValue],
      hexpand: true,
      text: bind(goalsService!, "sidebarGoal").as((goal) =>
        goal?.due ? formatISODateToCustomFormat(goal.due) : "None",
      ),
      onActivate: (self) => {
        goalsService!.modify(goalsService!.sidebarGoal, "due", self.text);
      },
    });

  /** Editable entry widget for the goal's icon. */
  const IconEntry = () =>
    Widget.Entry({
      cssClasses: [CSS_CLASSES.fieldValue],
      hexpand: true,
      text: bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.icon ?? "None",
      ),
      onActivate: (self) => {
        goalsService!.modify(goalsService!.sidebarGoal, "icon", self.text);
      },
    });

  /** Clickable label for navigating to parent goal */
  const ParentNavigationLabel = () => {
    const handleParentNavigation = () => {
      const parentGoal = goalsService!.sidebarBreadcrumbs.pop();
      if (parentGoal) {
        goalsService!.sidebarGoal = parentGoal;
      }
    };

    return Widget.Label({
      cssClasses: [CSS_CLASSES.clickableLink],
      valign: Gtk.Align.START,
      hexpand: false,
      xalign: 0,
      label: bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.parent?.description ?? "None",
      ),
      wrap: true,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      onButtonPressed: handleParentNavigation,
    });
  };

  /** Taskwarrior UUID */
  const UUIDLabel = () =>
    Widget.Label({
      cssClasses: [CSS_CLASSES.fieldValue],
      hexpand: true,
      xalign: 0,
      selectable: true,
      label: bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.uuid.substring(0, 7) ?? "None",
      ),
    });

  /** Multi-line text view for editing the goal's "why" field. */
  const WhyTextView = () => {
    const textView = astalify(Gtk.TextView)({
      hexpand: true,
      vexpand: true,
      cssClasses: [CSS_CLASSES.fieldValue],
      onKeyPressed: (self, keyval, _, state) => {
        // Allow Shift+Enter for newlines, otherwise treat Enter as completion
        if (
          keyval === KEYBOARD_SHORTCUTS.ENTER &&
          state !== KEYBOARD_SHORTCUTS.SHIFT_ENTER
        ) {
          self.editable = false;
          goalsService!.modify(
            goalsService!.sidebarGoal,
            "why",
            self.buffer.text,
          );
        } else {
          self.editable = true;
        }
      },
      setup: (self) => {
        self.set_wrap_mode(Gtk.WrapMode.WORD);

        hook(self, goalsService!, "notify::sidebar-goal", () => {
          self.buffer.text = goalsService!.sidebarGoal?.why ?? "None";
        });
      },
    });

    return textView;
  };

  /** Dropdown widget for selecting timescale. */
  const TimescaleDropdown = () =>
    Dropdown({
      model: timescaleListModel,
      setup: (self) => {
        let updating = false;

        const goal = goalsService!.sidebarGoal;
        const index = timescaleOptions.indexOf(goal?.timescale ?? "<none>");
        self.set_selected(index >= 0 ? index : 0);

        // Update dropdown when goal changes
        hook(self, goalsService!, "notify::sidebar-goal", () => {
          if (updating) return;
          updating = true;

          const goal = goalsService!.sidebarGoal;
          const index = timescaleOptions.indexOf(goal?.timescale ?? "<none>");
          self.set_selected(index >= 0 ? index : 0);

          updating = false;
        });

        // Update goal when dropdown changes
        self.connect("notify::selected", () => {
          if (updating) return;
          updating = true;

          const item = self.get_selected_item() as Gtk.StringObject;
          const value = item.get_string();

          const goal = goalsService!.sidebarGoal;
          goalsService?.modify(goal, "timescale", value);

          updating = false;
        });
      },
    });

  return DetailsList({
    cssClasses: [CSS_CLASSES.detailsSection],
    hexpand: true,
    vexpand: false,
    setup: (self) => {
      const formFields = [
        ["Category", ProjectEntry()],
        ["Status", StatusLabel()],
        ["Due", DueDateEntry()],
        ["Parent", ParentNavigationLabel()],
        ["Timescale", TimescaleDropdown()],
        ["Why", WhyTextView()],
        ["Icon", IconEntry()],
        ["UUID", UUIDLabel()],
      ];

      formFields.forEach(([labelText, valueWidget]) => {
        const fieldRow = Widget.Box({
          children: [
            FieldLabel(labelText as string),
            valueWidget as Gtk.Widget,
          ],
        });

        self.append(fieldRow);
      });
    },
  });
};

/** Top section of the sidebar with navigation and goal title. */
const SidebarHeader = () => {
  /** Closes sidebar */
  const CloseButton = () =>
    Widget.Image({
      halign: Gtk.Align.START,
      iconName: STATUS_ICONS.close,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      onButtonPressed: () => {
        goalsService!.sidebarVisible = false;
      },
    });

  /** Navigating goals hierarchies */
  const BreadcrumbNavigation = () => {
    const handleBreadcrumbNavigation = () => {
      if (goalsService!.sidebarBreadcrumbs.length > 0) {
        const previousGoal = goalsService!.sidebarBreadcrumbs.pop();
        if (previousGoal) {
          goalsService!.sidebarGoal = previousGoal;
        }
      }
    };

    return Widget.Box({
      spacing: 4,
      halign: Gtk.Align.START,
      cssClasses: [CSS_CLASSES.breadcrumbNavigation],
      children: [
        Widget.Image({
          iconName: STATUS_ICONS.caretLeft,
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          onButtonPressed: handleBreadcrumbNavigation,
        }),
        // Future: Add forward navigation
        // Widget.Image({
        //   iconName: STATUS_ICONS.caretRight,
        //   cursor: Gdk.Cursor.new_from_name("pointer", null),
        //   visible: bind(goalsService!, "sidebarBreadcrumbIndex").as((index) => index > 0),
        //   onButtonPressed: () => {},
        // }),
      ],
    });
  };

  const GoalTitle = () =>
    Widget.Label({
      cssClasses: [CSS_CLASSES.goalDescription],
      label: bind(goalsService!, "sidebarGoal").as(
        (goal) => goal?.description ?? "None",
      ),
      wrap: true,
      xalign: 0,
    });

  return Widget.Box({
    vertical: true,
    spacing: 12,
    children: [
      Widget.CenterBox({
        orientation: Gtk.Orientation.HORIZONTAL,
        startWidget: BreadcrumbNavigation(),
        endWidget: CloseButton(),
      }),
      GoalTitle(),
      GoalDetailsSection(),
      GoalChildrenSection(),
      GoalAnnotationsSection(),
    ],
  });
};

/**
 * Main sidebar component for displaying and editing goal details.
 * @returns Widget containing the complete sidebar interface
 */
export const Sidebar = () => {
  goalsService = Goals.get_default();
  const Scrollable = astalify(Gtk.ScrolledWindow);

  return Scrollable({
    hexpand: true,
    setup: (self) => {
      self.hscrollbar_policy = Gtk.PolicyType.NEVER;
      self.vscrollbar_policy = Gtk.PolicyType.ALWAYS;

      self.set_child(
        Widget.Box({
          canTarget: true,
          cssClasses: [CSS_CLASSES.sidebar],
          vertical: true,
          vexpand: true,
          hexpand: false,
          children: [SidebarHeader()],
        }),
      );
    },
  });
};
