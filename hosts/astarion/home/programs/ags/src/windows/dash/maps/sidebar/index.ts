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

import {
  destination,
  origin,
  planTripVisible,
  sidebarContent,
  sidebarRevealState,
  tripPlanUpdated,
} from "../StateManagement";
import { SearchBox } from "./components/SearchBox";
import Transit from "@/services/Transit";
import { Decoration } from "./components/Decoration";

/*****************************************************************************
 * Widget
 *****************************************************************************/

const transit = Transit.get_default();

const CSS_CLASSES = {
  ORIGIN_DEST_SWAP: "origin-dest-swap",
} as const;

/** Top portion of the sidebar where user selects origin/destination */
const SidebarTop = () => {
  const tripPlanningHeader = Widget.Revealer({
    revealChild: bind(planTripVisible).as((x) => !x),
    child: Widget.Label({
      cssClasses: ["trip-planning-header"],
      label: "Where to?",
    }),
  });

  const startingPointContainer = Astalified.Frame({
    cssClasses: ["search"],
    hexpand: true,
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
    hexpand: true,
    child: SearchBox({
      placeholder: "Destination",
      contentTarget: sidebarContent,
      selectionTarget: destination,
    }),
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

  // Button to trigger API call to start trip planning
  const planTripBtn = Widget.Button({
    cssClasses: ["plan-trip-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: "Plan trip",
    }),
    onButtonPressed: async () => {
      if (origin.get() === undefined || destination.get() === undefined) return;

      try {
        const tripPlan = await transit.planTrip(
          origin.get()!.lat,
          origin.get()!.lon,
          destination.get()!.lat,
          destination.get()!.lon,
        );

        tripPlanUpdated.set(tripPlan);
      } catch (error) {
        console.error(error);
      }
    },
    setup: () => {
      Variable.derive([origin, destination], (x, y) => {
        planTripVisible.set(x !== undefined && y !== undefined);
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
      Decoration(),
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
      tripPlanningHeader,
      content,
      Widget.Revealer({
        child: planTripBtn,
        revealChild: bind(planTripVisible),
      }),
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
    halign: Gtk.Align.START,
    vertical: true,
    spacing: 8,
    children: [
      SidebarTop(),
      Astalified.ScrolledWindow({
        hscrollbarPolicy: Gtk.PolicyType.NEVER,
        vscrollbarPolicy: Gtk.PolicyType.AUTOMATIC,
        vexpand: true,
        hexpand: true,
        child: new Gtk.Viewport({
          vscrollPolicy: Gtk.ScrollablePolicy.NATURAL,
          child: sidebarContent,
        }),
      }),
    ],
  });

  const sidebarHandle = Widget.CenterBox({
    cssClasses: ["handle"],
    vexpand: true,
    valign: Gtk.Align.CENTER,
    centerWidget: Widget.Button({
      cssClasses: ["handle-btn"],
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
    vexpand: true,
    hexpand: false,
    child: sidebar,
    halign: Gtk.Align.START,
    transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    revealChild: bind(sidebarRevealState),
  });

  return Widget.Box({
    cssClasses: ["sidebar-container"],
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: false,
    children: [sidebarHandle, sidebarRevealer],
  });
};
