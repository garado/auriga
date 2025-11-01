/*****************************************************************************
 * Imports
 *****************************************************************************/

import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";
import { bind } from "astal";
import MapsController, { MapsState } from "../../../controller";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const controller = new MapsController();

const Frame = astalify(Gtk.Frame);

const CSS_CLASSES = {
  ORIGIN_DEST_SWAP: "origin-dest-swap",
} as const;

/*****************************************************************************
 * Widget
 *****************************************************************************/

const SidebarTop = () => {
  // "Where to?"
  const tripPlanningHeader = Widget.Revealer({
    revealChild: bind(controller, "sidebarRevealState").as((x) => x === false),
    child: Widget.Label({
      cssClasses: ["trip-planning-header"],
      label: "Where to?",
    }),
  });

  // Trip origin
  const startingPointContainer = Frame({
    cssClasses: ["search"],
    hexpand: true,
    // child: SearchBox({
    //   placeholder: "Origin",
    //   contentTarget: sidebarContent,
    //   selectionTarget: origin,
    // }),
    setup: (self) => {
      controller.connect("notify::sidebar-reveal-state", (revealed) => {
        print("startingPointCOntainer - revealed!");
        if (revealed) {
          self.child.grab_focus();
        }
      });
    },
  });

  // Trip destination
  // const endingPointContainer = Astalified.Frame({
  //   cssClasses: ["search"],
  //   hexpand: true,
  //   child: SearchBox({
  //     placeholder: "Destination",
  //     contentTarget: sidebarContent,
  //     selectionTarget: destination,
  //   }),
  //   setup: (self) => {
  //     origin.subscribe((origin) => {
  //       if (origin !== undefined) {
  //         self.child.grab_focus();
  //       }
  //     });
  //   },
  // });

  // Button to swap origin <-> destination contents
  // const swapOriginAndDestination = Widget.Button({
  //   cursor: Gdk.Cursor.new_from_name("pointer", null),
  //   valign: Gtk.Align.CENTER,
  //   cssClasses: [CSS_CLASSES.ORIGIN_DEST_SWAP],
  //   iconName: "arrow-down-up-symbolic",
  //   onButtonPressed: () => {
  //     const newOrigin = destination.get();
  //     const newDestination = origin.get();
  //     origin.set(newOrigin);
  //     destination.set(newDestination);
  //   },
  // });

  // Button to trigger Transit API call to start trip
  // const fetchTripPlanBtn = Widget.Button({
  //   cssClasses: ["plan-trip-btn"],
  //   hexpand: true,
  //   cursor: Gdk.Cursor.new_from_name("pointer", null),
  //   child: Widget.Label({
  //     label: "Plan trip",
  //   }),
  //   onButtonPressed: async () => {
  //     if (origin.get() === undefined || destination.get() === undefined) return;
  //
  //     try {
  //       const _tripPlan = await transit!.planTrip(
  //         origin.get()!.lat,
  //         origin.get()!.lon,
  //         destination.get()!.lat,
  //         destination.get()!.lon,
  //       );
  //
  //       tripPlan.set(_tripPlan);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   },
  // });

  // const revealTripPlanBtn = Variable.derive(
  //   [endpointsSelected, tripPlan],
  //   (_endpointsSelected, _tripPlan) => {
  //     return _endpointsSelected && _tripPlan === undefined;
  //   },
  // );

  return Widget.Box({
    cssClasses: ["top-section"],
    vexpand: false,
    hexpand: true,
    vertical: true,
    children: [tripPlanningHeader],
  });
};

export const endpointSelectView = () => {
  return Widget.Box({
    visible: bind(controller, "currentState").as(
      (state) => state === MapsState.ENDPOINTS_SELECT,
    ),
    children: [Widget.Label({ label: "endpoint select " })],
  });
};
