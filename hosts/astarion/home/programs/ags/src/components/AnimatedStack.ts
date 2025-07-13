/* ▄▀█ █▄░█ █ █▀▄▀█ ▄▀█ ▀█▀ █▀▀ █▀▄   █▀ ▀█▀ ▄▀█ █▀▀ █▄▀ */
/* █▀█ █░▀█ █ █░▀░█ █▀█ ░█░ ██▄ █▄▀   ▄█ ░█░ █▀█ █▄▄ █░█ */

/* A Gtk.Stack, but the transition types are dynamically adjusted
 * based on the new visibleChild's index relative to the current
 * visibleChild.
 *
 * e.g. if the stack is laid out "vertically", the transitions will
 * switch between SLIDE_UP and SLIDE_DOWN. If the stack is laid out
 * "horizontally", they will will switch between SLIDE_LEFT and
 * SLIDE_RIGHT. */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";
import { setupEventController } from "@/utils/EventControllerKeySetup";

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

export interface AnimatedStackChild extends Gtk.Stack {
  ui: () => Gtk.Widget;
  name: string;
}

interface AnimatedStackWidget extends Gtk.Stack {
  iterTab: (dir: number) => void;
}

/*****************************************************************************
 * Main widget definition
 *****************************************************************************/

export const AnimatedStack = (props: {
  name?: string;
  children: Array<AnimatedStackChild>;
  vertical?: boolean;
  cssClasses?: Array<string>;
  activePageName?: Variable<string>;
  activePageIndex?: Variable<number>;
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

      setupEventController({
        widget: self,
        name: props.name || "AnimatedStack",
        forwardTarget: () => self.get_visible_child(),
        binds: {
          H: () => {
            (self as AnimatedStackWidget).iterTab(-1);
          },
          L: () => {
            (self as AnimatedStackWidget).iterTab(1);
          },
        },
      });
    },
  }) as AnimatedStackWidget;

  // Helper function to set transition direction and switch pages
  const switchToPage = (targetName: string) => {
    const currentName = Stack.get_visible_child_name();
    if (currentName === null || currentName === targetName) return;

    const currentIndex = childIndices.indexOf(currentName);
    const targetIndex = childIndices.indexOf(targetName);
    const isNext = currentIndex < targetIndex;

    const transitionType = props.vertical
      ? isNext
        ? Gtk.StackTransitionType.SLIDE_UP
        : Gtk.StackTransitionType.SLIDE_DOWN
      : isNext
        ? Gtk.StackTransitionType.SLIDE_LEFT
        : Gtk.StackTransitionType.SLIDE_RIGHT;

    Stack.set_transition_type(transitionType);
    Stack.visibleChildName = targetName;
  };

  // Set up auto-transitions
  if (props.activePageName) {
    props.activePageName.subscribe(switchToPage);
  }

  if (props.activePageIndex) {
    props.activePageIndex.subscribe((newIndex: number) => {
      switchToPage(childIndices[newIndex]);
    });
  }

  // Iterate through pages (note: does not wrap)
  Stack.iterTab = (dir: number) => {
    const currentName = Stack.get_visible_child_name();
    if (currentName === null) return;

    const lastPageIndex = childIndices.indexOf(currentName);
    let newIndex = lastPageIndex + 1 * dir;
    if (newIndex < 0) newIndex = 0;
    if (newIndex > props.children.length - 1)
      newIndex = props.children.length - 1;

    // @TODO Why does LSP complain if `as any` is removed
    if (props.activePageIndex) {
      props.activePageIndex.set(newIndex);
    } else if (props.activePageName) {
      props.activePageName.set(props.children[newIndex].name);
    }
  };

  return Stack;
};
