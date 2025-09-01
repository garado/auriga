/**
 * █▀ █ █▀▄ █▀▀ █▄▄ ▄▀█ █▀█
 * ▄█ █ █▄▀ ██▄ █▄█ █▀█ █▀▄
 *
 * Allows user to:
 * - select origin/destination for trips
 * - preview different trip itineraries
 * - select a trip itinerary and view its details
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Astalified from "@/components/astalified";
import { Gdk, Gtk, Widget } from "astal/gtk4";
import { bind, Variable } from "astal";

import {
  destination,
  origin,
  endpointsSelected,
  sidebarContent,
  sidebarRevealState,
  tripPlan,
} from "../StateManagement";
import Transit from "@/services/Transit";
import { Decoration } from "./components/Decoration";
import { SearchBox } from "./components/SearchBox";

/*****************************************************************************
 * Module vars
 *****************************************************************************/

const transit = Transit.get_default();

const CSS_CLASSES = {
  ORIGIN_DEST_SWAP: "origin-dest-swap",
} as const;

/*****************************************************************************
 * Widget
 *****************************************************************************/

const SidebarTop = () => {
  const tripPlanningHeader = Widget.Revealer({
    revealChild: bind(endpointsSelected).as((x) => x === false),
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
    setup: (self) => {
      origin.subscribe((origin) => {
        if (origin !== undefined) {
          self.child.grab_focus();
        }
      });
    },
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

  const fetchTripPlanBtn = Widget.Button({
    cssClasses: ["plan-trip-btn"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: "Plan trip",
    }),
    onButtonPressed: async () => {
      if (origin.get() === undefined || destination.get() === undefined) return;

      try {
        const _tripPlan = await transit.planTrip(
          origin.get()!.lat,
          origin.get()!.lon,
          destination.get()!.lat,
          destination.get()!.lon,
        );

        tripPlan.set(_tripPlan);
      } catch (error) {
        console.error(error);
      }
    },
  });

  const revealTripPlanBtn = Variable.derive(
    [endpointsSelected, tripPlan],
    (_endpointsSelected, _tripPlan) => {
      return _endpointsSelected && _tripPlan === undefined;
    },
  );

  return Widget.Box({
    cssClasses: ["top-section"],
    vexpand: false,
    hexpand: true,
    vertical: true,
    children: [
      tripPlanningHeader,
      Widget.Box({
        cssClasses: ["top-section"],
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
      }),
      Widget.Revealer({
        child: fetchTripPlanBtn,
        revealChild: bind(revealTripPlanBtn),
      }),
    ],
  });
};

export default () => {
  const sidebar = Widget.Box({
    cssClasses: ["sidebar"],
    vexpand: true,
    hexpand: false,
    halign: Gtk.Align.START,
    overflow: Gtk.Overflow.HIDDEN,
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

  const sidebarRevealer = Widget.Revealer({
    canTarget: true,
    vexpand: true,
    hexpand: false,
    child: sidebar,
    halign: Gtk.Align.START,
    transitionType: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    revealChild: bind(sidebarRevealState),
  });

  /** Button to toggle sidebar revealer */
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

  return Widget.Box({
    cssClasses: ["sidebar-container"],
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: false,
    children: [sidebarHandle, sidebarRevealer],
  });
};
