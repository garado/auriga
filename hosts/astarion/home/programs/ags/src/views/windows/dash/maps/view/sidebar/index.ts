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

import { bind, Variable } from "astal";
import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import MapsController, { MapsState } from "../../controller";
import { endpointSelectView } from "./states/EndpointsSelect";
import { itinerarySelectView } from "./states/ItinerarySelect";
import { itineraryDisplayView } from "./states/ItineraryDisplay";
import { SearchBox } from "./components/SearchBox";
import { Decoration } from "./components/Decoration";
import Transit from "@/services/Transit";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

let transit: InstanceType<typeof Transit> | undefined = undefined;
const controller = MapsController.get_default();

const ScrolledWindow = astalify(Gtk.ScrolledWindow);
const Frame = astalify(Gtk.Frame);

const CSS_CLASSES = {
  SIDEBAR: "sidebar",
  SIDEBAR_CONTAINER: "sidebar-container",
  SIDEBAR_TOP_SECTION: "top-section",
  ORIGIN_DEST_SWAP: "origin-dest-swap",
  SEARCH_CONTAINER: "search",
  PLAN_TRIP_BTN: "plan-trip-btn",
  TRIP_PLANNING_HEADER: "trip-planning-header",
} as const;

// Controls visibility of the "Plan trip" button
const tripReadyToPlan = Variable.derive(
  [bind(controller, "bothEndpointsSelected"), bind(controller, "currentState")],
  (endpoints, state) => endpoints && state === MapsState.ENDPOINTS_SELECT,
);

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

/**
 * Top section of the sidebar containing the origin/destination search boxes
 */
const SidebarTop = () => {
  const originContainer = Frame({
    cssClasses: [CSS_CLASSES.SEARCH_CONTAINER],
    hexpand: true,
    setup: (self) => {
      self.set_child(SearchBox("currentOrigin"));

      controller.connect("notify::sidebar-reveal-state", () => {
        if (controller.sidebarRevealState) self.child.grab_focus();
      });
    },
  });

  const destinationContainer = Frame({
    cssClasses: [CSS_CLASSES.SEARCH_CONTAINER],
    hexpand: true,
    setup: (self) => {
      self.set_child(SearchBox("currentDestination"));

      controller.connect("notify::current-origin", () => {
        if (controller.currentOrigin !== undefined) self.child.grab_focus();
      });
    },
  });

  // Button to swap origin <-> destination contents
  const swapOriginDestinationBtn = Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    valign: Gtk.Align.CENTER,
    cssClasses: [CSS_CLASSES.ORIGIN_DEST_SWAP],
    iconName: "arrow-down-up-symbolic",
    onButtonPressed: () => {
      controller.swapOriginDestination();
    },
  });

  // Button to trigger Transit API call to get trip information
  const startTripPlanBtn = Widget.Button({
    cssClasses: [CSS_CLASSES.PLAN_TRIP_BTN],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: "Plan trip",
    }),
    onButtonPressed: async () => {
      if (controller.bothEndpointsSelected === false) return;

      const origin = controller.currentOrigin!;
      const destination = controller.currentDestination!;

      try {
        controller.currentTripPlan = await transit!.planTrip(
          origin.lat,
          origin.lon,
          destination.lat,
          destination.lon,
        );
      } catch (error) {
        console.error(error);
      }
    },
  });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.SIDEBAR_TOP_SECTION],
    vexpand: false,
    hexpand: true,
    vertical: true,
    children: [
      Widget.Revealer({
        child: Widget.Label({
          cssClasses: [CSS_CLASSES.TRIP_PLANNING_HEADER],
          label: "Where to?",
        }),
        revealChild: bind(controller, "currentState").as(
          (state) => state === MapsState.ENDPOINTS_SELECT,
        ),
      }),
      Widget.Box({
        cssClasses: [CSS_CLASSES.SIDEBAR_TOP_SECTION],
        vertical: false,
        spacing: 16,
        children: [
          Decoration(),
          Widget.Box({
            vertical: true,
            hexpand: true,
            spacing: 8,
            children: [originContainer, destinationContainer],
          }),
          swapOriginDestinationBtn,
        ],
      }),
      Widget.Revealer({
        child: startTripPlanBtn,
        revealChild: bind(tripReadyToPlan),
      }),
    ],
  });
};

export default () => {
  transit = Transit.get_default();

  const sidebarContent = Widget.Box({
    vertical: true,
    children: [
      SidebarTop(),

      // Only one view is displayed at any given time
      // The visibility of each view depends on the current MapsState
      endpointSelectView(),
      itinerarySelectView(),
      itineraryDisplayView(),
    ],
  });

  const sidebar = Widget.Box({
    cssClasses: [CSS_CLASSES.SIDEBAR_CONTAINER],
    vexpand: true,
    hexpand: false,
    halign: Gtk.Align.START,
    overflow: Gtk.Overflow.HIDDEN,
    vertical: true,
    spacing: 8,
    children: [
      ScrolledWindow({
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
    revealChild: bind(controller, "sidebarRevealState"),
  });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.SIDEBAR_CONTAINER],
    halign: Gtk.Align.END,
    vertical: false,
    hexpand: false,
    children: [sidebarRevealer],
  });
};
