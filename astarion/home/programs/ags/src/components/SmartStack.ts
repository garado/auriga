/* █▀ █▀▄▀█ ▄▀█ █▀█ ▀█▀   █▀ ▀█▀ ▄▀█ █▀▀ █▄▀ */
/* ▄█ █░▀░█ █▀█ █▀▄ ░█░   ▄█ ░█░ █▀█ █▄▄ █░█ */

/* A Gtk.Stack, but the transition types are dynamically adjusted
 * based on the new visibleChild's index relative to the current
 * visibleChild.
 *
 * e.g. if the stack is laid out "vertically", the transitions will
 * switch between SLIDE_UP and SLIDE_DOWN. If the stack is laid out
 * "horizontally", they will will switch between SLIDE_LEFT and
 * SLIDE_RIGHT. */

import { Gtk, Gdk, Widget } from "astal/gtk4";

export const SmartStack = (props: {
  children: Array<Object> /* { ui: function, name: string } */;
  vertical?: boolean;
  cssClasses?: Array<string>;
  bindNamedSwitchTo?: Binding /* @TODO: could add more clarity */;
  bindNumberedSwitchTo?: Binding /* @TODO: could add more clarity */;
}) => {
  const defaultTransition = props.vertical
    ? Gtk.StackTransitionType.SLIDE_DOWN
    : Gtk.StackTransitionType.SLIDE_UP;

  const childIndices = props.children.map((c) => c.name);

  const Stack = Widget.Stack({
    transition_type: defaultTransition,
    cssClasses: props.cssClasses,
    setup: (self) => {
      props.children.map((c) => {
        self.add_named(c.ui(), c.name);
      });

      self.controller = new Gtk.EventControllerKey();
      self.add_controller(self.controller);
      self.controller.connect("key-pressed", (controller, keyval) => {
        log("dashKeyController", "SmartStack");
        switch (keyval) {
          case Gdk.KEY_H:
            self.iterTab(-1);
            return true;
            break;

          case Gdk.KEY_L:
            self.iterTab(1);
            return true;
            break;

          default:
            controller.forward(self.get_visible_child());
            return false;
            break;
        }
      });
    },
  });

  if (props.bindNamedSwitchTo) {
    props.bindNamedSwitchTo.subscribe((newName: string) => {
      const currentName = Stack.get_visible_child_name();
      if (currentName === newName) return;

      const isNext =
        childIndices.indexOf(currentName) < childIndices.indexOf(newName);

      if (props.vertical) {
        Stack.set_transition_type(
          isNext
            ? Gtk.StackTransitionType.SLIDE_UP
            : Gtk.StackTransitionType.SLIDE_DOWN,
        );
      } else {
        Stack.set_transition_type(
          isNext
            ? Gtk.StackTransitionType.SLIDE_LEFT
            : Gtk.StackTransitionType.SLIDE_RIGHT,
        );
      }

      Stack.visibleChildName = newName;
    });
  }

  if (props.bindNumberedSwitchTo) {
    props.bindNumberedSwitchTo.subscribe((newIndex: number) => {
      const currentIndex = childIndices.indexOf(Stack.get_visible_child_name());
      if (currentIndex === newIndex) return;

      const isNext = currentIndex < newIndex;

      if (props.vertical) {
        Stack.set_transition_type(
          isNext
            ? Gtk.StackTransitionType.SLIDE_UP
            : Gtk.StackTransitionType.SLIDE_DOWN,
        );
      } else {
        Stack.set_transition_type(
          isNext
            ? Gtk.StackTransitionType.SLIDE_LEFT
            : Gtk.StackTransitionType.SLIDE_RIGHT,
        );
      }

      Stack.visibleChildName = childIndices[newIndex];
    });
  }

  /**
   * Iterate through pages (no wrapping)
   */
  Stack.iterTab = (dir: number) => {
    const lastPageIndex = childIndices.indexOf(Stack.get_visible_child_name());
    let newIndex = lastPageIndex + 1 * dir;
    if (newIndex < 0) newIndex = 0;
    if (newIndex > props.children.length - 1)
      newIndex = props.children.length - 1;

    if (props.bindNumberedSwitchTo) {
      props.bindNumberedSwitchTo.set(newIndex);
    } else if (props.bindNamedSwitchTo) {
      props.bindNamedSwitchTo.set(props.children[newIndex].name);
    }
  };

  return Stack;
};
