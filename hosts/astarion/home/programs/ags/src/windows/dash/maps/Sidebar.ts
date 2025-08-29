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

const sidebarRevealState = Variable(false);

export default () => {
  const startingPoint = Widget.Entry({
    cssClasses: ["search"],
  });

  const startingPointContainer = Astalified.Frame({
    label: "Starting point",
    child: startingPoint,
  });

  const endingPoint = Widget.Entry({
    cssClasses: ["search"],
  });

  const endingPointContainer = Astalified.Frame({
    label: "Destination",
    child: endingPoint,
  });

  const sidebarContent = Widget.Box({
    cssClasses: bind(sidebarRevealState).as((state) => [
      "sidebar",
      ...(state ? ["expanded"] : []),
    ]),
    vexpand: true,
    vertical: true,
    spacing: 8,
    children: [
      Widget.Label({
        cssClasses: ["header"],
        label: "Where to?",
      }),
      startingPointContainer,
      endingPointContainer,
    ],
  });

  const sidebarHandle = Widget.Box({
    cssClasses: ["handle"],
    children: [
      Widget.Button({
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
    ],
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
