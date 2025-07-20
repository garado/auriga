/**
 * █▀▀ ▀▄▀ █▀█ ▄▀█ █▄░█ █▀ █ █▀█ █▄░█   █▀█ ▄▀█ █▄░█ █▀▀ █░░
 * ██▄ █░█ █▀▀ █▀█ █░▀█ ▄█ █ █▄█ █░▀█   █▀▀ █▀█ █░▀█ ██▄ █▄▄
 *
 * Provides consistent implementation for quick settings widgets.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk, Widget, astalify } from "astal/gtk4";
import { Binding, Variable, bind } from "astal";
import Pango from "gi://Pango?version=1.0";

const Scrollable = astalify(Gtk.ScrolledWindow);

/*****************************************************************************
 * Types and interface
 *****************************************************************************/

interface ExpansionPanelInterace {
  /**
   * Optional user-provided content for expander tab.
   * A default expander tab will be created if not provided.
   */
  expandTabContent?: Gtk.Widget;

  /** Icon to display in default expander tab content. */
  icon?: string;

  /** Label to display in default expander tab content. */
  label?: string | Binding<string>;

  /**
   * Child widgets to display in expander tab.
   * @TODO Make more generic - just accept widget; let user fully handle
   * dropdown content
   */
  children: Array<Gtk.Widget> | Binding<Gtk.Widget[]>;

  /** Whether children in dropdown are aligned vertically.
   * @TODO Once this widget is made more generic, this will be removed */
  vertical: boolean;

  /** Maximum dropdown height. Note that the dropdown has a vertical scrollbar. */
  maxDropdownHeight: number;

  /** CSS classes to add to the expander. */
  cssClasses?: Array<string>;

  globalRevealerState: Variable<boolean>;
}

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const ExpansionPanel = (props: ExpansionPanelInterace) => {
  const contentRevealerState = Variable(false);

  /********************************************************
   * TOP TAB
   ********************************************************/

  /**
   * Icon describing content.
   */
  const ExpanderContentIcon = () =>
    Widget.Image({
      halign: Gtk.Align.START,
      iconName: props.icon ?? "",
    });

  /**
   * Text describing content.
   */
  const ExpanderLabel = () =>
    Widget.Label({
      hexpand: true,
      label: props.label ?? "None",
      xalign: 0,
      ellipsize: Pango.EllipsizeMode.END,
    });

  const ExpanderStateIcon = () =>
    Widget.Image({
      halign: Gtk.Align.END,
      iconName: bind(contentRevealerState).as((state) =>
        state ? "caret-up-symbolic" : "caret-down-symbolic",
      ),
    });

  /**
   * Top tab. Clicking reveals/hides the dropdown content.
   */
  const DefaultExpanderTab = () =>
    Widget.Box({
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      hexpand: true,
      cssClasses: ["tab"],
      vertical: false,
      spacing: 10,
      children: [ExpanderContentIcon(), ExpanderLabel(), ExpanderStateIcon()],
    });

  /* User can optionally define expansion tab content. */
  let expanderTabWidget;

  if (props.expandTabContent) {
    expanderTabWidget = props.expandTabContent;
  } else {
    expanderTabWidget = DefaultExpanderTab();
  }

  const eventController = new Gtk.EventControllerLegacy();
  expanderTabWidget.add_controller(eventController);

  eventController.connect("event", (_, event) => {
    if (event.get_event_type() === Gdk.EventType.BUTTON_PRESS) {
      if (!expanderTabWidget.has_css_class("revealed")) {
        props.globalRevealerState.set(!props.globalRevealerState.get());
      }
      contentRevealerState.set(!contentRevealerState.get());
    }
  });

  contentRevealerState.subscribe((state) => {
    if (state) {
      expanderTabWidget.add_css_class("revealed");
    } else {
      expanderTabWidget.remove_css_class("revealed");
    }
  });

  /********************************************************
   * CONTENT
   ********************************************************/

  /**
   * Revealer container.
   */
  const ContentRevealer = () =>
    Widget.Revealer({
      cssClasses: ["content-revealer"],
      revealChild: bind(contentRevealerState),
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      child: ContentScrollableContainer(),
    });

  /**
   * Container for content.
   */
  const ContentScrollableContainer = () =>
    Scrollable({
      vexpand: false,
      setup: (self) => {
        self.set_child(ContentContainer());
        self.set_propagate_natural_height(true);
        self.set_max_content_height(props.maxDropdownHeight);
        self.set_min_content_height(0);
      },
    });

  /**
   * Container for content.
   */
  const ContentContainer = () =>
    Widget.Box({
      cssClasses: ["content"],
      spacing: 15,
      vertical: props.vertical,
      children: props.children,
    });

  /********************************************************
   * FINAL
   ********************************************************/

  const Final = Widget.Box({
    cssClasses: ["expander", ...(props.cssClasses || [])],
    vertical: true,
    children: [expanderTabWidget, ContentRevealer()],
    setup: () => {
      /* Closing the global revealer closes this revealer too */
      props.globalRevealerState.subscribe(() => {
        contentRevealerState.set(false);
      });
    },
  });

  return Final;
};
