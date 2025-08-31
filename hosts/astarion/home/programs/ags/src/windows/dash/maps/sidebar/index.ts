/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Astalified from "@/components/astalified";
import { bind, Variable } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk4";

import { destination, origin, sidebarRevealState } from "../StateManagement";
import { SearchBox } from "./components/SearchBox";

/*****************************************************************************
 * Widget
 *****************************************************************************/

const CSS_CLASSES = {
  ORIGIN_DEST_SWAP: "origin-dest-swap",
} as const;

const sidebarContent = Widget.Box({
  cssClasses: ["section-content"],
  hexpand: false,
  spacing: 8,
  vertical: true,
});

/** Top portion of the sidebar where user selects origin/destination */
const SidebarTop = () => {
  const startingPointContainer = Astalified.Frame({
    cssClasses: ["search"],
    child: SearchBox({
      placeholder: "Origin",
      contentTarget: sidebarContent,
      selectionTarget: origin,
    }),
    setup: (self) => {
      sidebarRevealState.subscribe((revealed) => {
        if (revealed) {
          self.child.grab_focus();
        }
      });
    },
  });

  const endingPointContainer = Astalified.Frame({
    cssClasses: ["search"],
    child: SearchBox({
      placeholder: "Destination",
      contentTarget: sidebarContent,
      selectionTarget: destination,
    }),
  });

  const decoration = Widget.Box({
    cssClasses: ["decoration"],
    vertical: true,
    spacing: 30,
    vexpand: true,
    valign: Gtk.Align.CENTER,
    children: [
      Widget.Image({
        cssClasses: ["circle"],
        iconName: "circle-symbolic",
      }),
      Widget.Image({
        cssClasses: ["circle"],
        iconName: "circle-symbolic",
      }),
    ],
  });

  const swapOriginAndDestination = Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    valign: Gtk.Align.CENTER,
    cssClasses: [CSS_CLASSES.ORIGIN_DEST_SWAP],
    iconName: "arrow-down-up-symbolic",
    onButtonPressed: () => {
      const newOrigin = destination.get();
      const newDestination = origin.get();
      origin.set(newOrigin);
      destination.set(newDestination);
    },
  });

  const startTrip = Widget.Button({
    cssClasses: ["start-trip-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: "Start trip",
    }),
    setup: (self) => {
      Variable.derive([origin, destination], (x, y) => {
        self.visible = x !== undefined && y !== undefined;
      });
    },
  });

  const content = Widget.Box({
    cssClasses: ["top-section"],
    vexpand: false,
    hexpand: true,
    vertical: false,
    spacing: 16,
    children: [
      decoration,
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
    spacing: 8,
    children: [
      Widget.Label({
        cssClasses: ["header"],
        label: "Where to?",
      }),
      content,
      startTrip,
    ],
  });
};

export default () => {
  const sidebar = Widget.Box({
    cssClasses: bind(sidebarRevealState).as((state) => [
      "sidebar",
      ...(state ? ["expanded"] : []),
    ]),
    vexpand: true,
    hexpand: false,
    vertical: true,
    spacing: 8,
    children: [SidebarTop(), sidebarContent],
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
    child: sidebar,
    hexpand: false,
    transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    revealChild: bind(sidebarRevealState),
  });

  return Widget.Box({
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: false,
    children: [sidebarHandle, sidebarRevealer],
  });
};
