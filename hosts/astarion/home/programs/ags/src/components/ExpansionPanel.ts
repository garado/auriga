/* █▀▀ ▀▄▀ █▀█ ▄▀█ █▄░█ █▀ █ █▀█ █▄░█   █▀█ ▄▀█ █▄░█ █▀▀ █░░ */
/* ██▄ █░█ █▀▀ █▀█ █░▀█ ▄█ █ █▄█ █░▀█   █▀▀ █▀█ █░▀█ ██▄ █▄▄ */

/* Provides consistent implementation for quick settings widgets. */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk, Widget, astalify } from "astal/gtk4";
import { Binding, Variable, bind } from "astal";
import Pango from "gi://Pango?version=1.0";

const Scrollable = astalify(Gtk.ScrolledWindow);

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const ExpansionPanel = (props: {
  icon?: string;
  label?: string | Binding<string>;
  children: Array<Gtk.Widget> | Binding<Gtk.Widget[]>;
  maxDropdownHeight: number;
  vertical: boolean;
  cssClasses?: Array<string>;
  globalRevealerState: Variable<boolean>;
}) => {
  const contentRevealerState = Variable(false);

  /********************************************************
   * TOP TAB
   ********************************************************/

  /**
   * Top tab. Clicking reveals/hides the dropdown content.
   */
  const ExpanderTab = () =>
    Widget.Box({
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      hexpand: true,
      spacing: 10,
      cssClasses: ["tab"],
      vertical: false,
      children: [ExpanderContentIcon(), ExpanderLabel(), ExpanderStateIcon()],
      onButtonPressed: (self) => {
        if (!self.has_css_class("revealed")) {
          props.globalRevealerState.set(!props.globalRevealerState.get());
        }

        contentRevealerState.set(!contentRevealerState.get());
      },
      setup: (self) => {
        contentRevealerState.subscribe((state) => {
          if (state) {
            self.add_css_class("revealed");
          } else {
            self.remove_css_class("revealed");
          }
        });
      },
    });

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
    children: [ExpanderTab(), ContentRevealer()],
    setup: () => {
      /* Closing the global revealer closes this revealer too */
      props.globalRevealerState.subscribe(() => {
        contentRevealerState.set(false);
      });
    },
  });

  return Final;
};
