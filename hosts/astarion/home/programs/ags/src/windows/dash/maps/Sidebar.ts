/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 *
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Astalified from "@/components/astalified";
import { bind, Variable } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk4";

/*****************************************************************************
 * Widget
 *****************************************************************************/

const CSS_CLASSES = {
  ORIGIN_DEST_SWAP: "origin-dest-swap",
} as const;

const sidebarRevealState = Variable(false);

/** Top portion of the sidebar where user selects origin/destination */
const SidebarTop = () => {
  const startingPoint = Widget.Entry({
    cssClasses: ["search"],
    placeholderText: "Origin",
  });

  const startingPointContainer = Astalified.Frame({
    child: startingPoint,
  });

  const endingPoint = Widget.Entry({
    cssClasses: ["search"],
    placeholderText: "Destination",
  });

  const endingPointContainer = Astalified.Frame({
    child: endingPoint,
  });

  const swapOriginAndDestination = Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    valign: Gtk.Align.CENTER,
    cssClasses: [CSS_CLASSES.ORIGIN_DEST_SWAP],
    iconName: "arrow-down-up-symbolic",
  });

  const content = Widget.Box({
    cssClasses: ["top-section"],
    vexpand: false,
    hexpand: true,
    vertical: false,
    children: [
      Widget.Box({
        vertical: true,
        hexpand: true,
        spacing: 8,
        children: [startingPointContainer, endingPointContainer],
      }),
      swapOriginAndDestination,
    ],
  });

  return Widget.Box({
    cssClasses: ["top-section"],
    vexpand: false,
    hexpand: true,
    vertical: true,
    children: [
      Widget.Label({
        cssClasses: ["header"],
        label: "Where to?",
      }),
      content,
    ],
  });
};

export default () => {
  const sidebarContent = Widget.Box({
    cssClasses: bind(sidebarRevealState).as((state) => [
      "sidebar",
      ...(state ? ["expanded"] : []),
    ]),
    vexpand: true,
    vertical: true,
    spacing: 8,
    children: [SidebarTop()],
  });

  const sidebarHandle = Widget.CenterBox({
    cssClasses: ["handle"],
    valign: Gtk.Align.CENTER,
    centerWidget: Widget.Button({
      canFocus: false,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      child: Widget.Image({
        iconName: bind(sidebarRevealState).as((revealed) =>
          revealed ? "caret-left-symbolic" : "caret-right-symbolic",
        ),
      }),
      onButtonPressed: () => {
        sidebarRevealState.set(!sidebarRevealState.get());
      },
    }),
  });

  const sidebarRevealer = Widget.Revealer({
    canTarget: true,
    child: sidebarContent,
    transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    revealChild: bind(sidebarRevealState),
  });

  const ret = Widget.Box({
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: false,
    children: [sidebarHandle, sidebarRevealer],
  });

  Object.assign(ret, {
    revealer: sidebarRevealState,
  });

  sidebarRevealState.subscribe((revealed) => {
    if (revealed) {
      startingPoint.grab_focus();
    }
  });

  return ret;
};
