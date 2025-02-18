/* Provides consistent implementation for quick settings widgets. */

import { Gtk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";

const Scrollable = astalify(Gtk.ScrolledWindow);

export const ExpansionPanel = (props: {
  icon: string;
  label: string;
  children: Array<Gtk.Widget>;
  maxDropdownHeight: number;
  vertical: boolean;
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
      hexpand: true,
      spacing: 10,
      cssClasses: ["tab"],
      vertical: false,
      children: [ExpanderContentIcon(), ExpanderLabel(), ExpanderStateIcon()],
      onButtonPressed: (self, state) => {
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
      iconName: props.icon,
    });

  /**
   * Text describing content.
   */
  const ExpanderLabel = () =>
    Widget.Label({
      hexpand: true,
      label: props.label,
      xalign: 0,
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
      heightRequest: props.maxDropdownHeight,
      child: ContentContainer(),
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
    cssClasses: ["expander"],
    vertical: true,
    children: [ExpanderTab(), ContentRevealer()],
    setup: () => {
      /* Closing the global revealer closes this revealer too */
      props.globalRevealerState.subscribe((state) => {
        if (state === false) {
          contentRevealerState.set(false);
        }
      });
    },
  });

  return Final;
};
