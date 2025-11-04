/**
 * █ ▀█▀ █ █▄░█ █▀▀ █▀█ ▄▀█ █▀█ █▄█   █▀▄ █ █▀ █▀█ █░░ ▄▀█ █▄█
 * █ ░█░ █ █░▀█ ██▄ █▀▄ █▀█ █▀▄ ░█░   █▄▀ █ ▄█ █▀▀ █▄▄ █▀█ ░█░
 *
 * Sidebar contents during itinerary display state
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Gdk, Widget } from "astal/gtk4";
import { bind } from "astal";

import {
  Mode,
  PlanLeg,
  PlanLeg_Transit,
  Stop,
  TripItinerary,
} from "@/services/Transit";
import MapsController, { MapsState } from "../../../controller";
import { epochToHHMM, epochToRelativeTime } from "@/utils/Time";
import { ExpansionPanel } from "@/views/components/ExpansionPanel";
import Pushover from "@/services/Pushover";

/*****************************************************************************
 * Helpers
 *****************************************************************************/

const durationInMinutes = (planLeg: PlanLeg) =>
  `${Math.round(planLeg.duration / 60)}m`;

/*****************************************************************************
 * Widget definitions: PlanLegs
 *****************************************************************************/

/**
 * Show detailed information about a certain leg of a trip.
 * This is for legs of the trip where you use your... legs. (bike, walk, etc.)
 */
const PlanLegWidget_Legs = (planLeg: PlanLeg): Gtk.Widget => {
  let icon = "person-simple-walk-symbolic";
  if (Mode.BICYCLE === planLeg.mode) icon = "bike-symbolic";

  return Widget.Box({
    cssClasses: ["plan-leg", "use-your-legs"],
    vertical: false,
    spacing: 4,
    children: [
      Widget.Image({ iconName: icon }),
      Widget.Label({ label: durationInMinutes(planLeg) }),
    ],
  });
};

/**
 * Show detailed information about a certain leg of a trip.
 * This is for legs of the trip which involve some type of transit.
 */
const PlanLegWidget_Transit = (planLeg: PlanLeg): Gtk.Widget => {
  let icon = "train-symbolic";
  if (Mode.BUS == planLeg.mode) icon = "bus-symbolic";
  if (Mode.SUBWAY == planLeg.mode) icon = "train-symbolic";

  // Show transit line icon, name
  const routeSummary = Widget.Box({
    cssClasses: ["route-summary"],
    vertical: false,
    spacing: 8,
    children: [
      Widget.Image({
        iconName: icon,
      }),
      Widget.Label({
        label: planLeg.routeShortName,
        wrap: true,
      }),
    ],
  });

  /**
   * Display the starting point of the transit trip
   * "Get on at this stop"
   */
  const startStop = Widget.CenterBox({
    cssClasses: ["stop-endpoint"],
    orientation: Gtk.Orientation.HORIZONTAL,
    hexpand: true,
    startWidget: Widget.Label({
      cssClasses: ["location"],
      label: `${planLeg.from.name}`,
      wrap: true,
    }),
    endWidget: Widget.Label({
      cssClasses: ["time"],
      label: `${epochToHHMM(planLeg.startTime)}`,
      wrap: false,
    }),
  });

  /**
   * Display the ending point of the transit trip
   * "Get off at this stop"
   */
  const endStop = Widget.CenterBox({
    cssClasses: ["stop-endpoint"],
    orientation: Gtk.Orientation.HORIZONTAL,
    hexpand: false,
    startWidget: Widget.Label({
      label: `${planLeg.to.name}`,
      cssClasses: ["location"],
      wrap: true,
    }),
    endWidget: Widget.Label({
      label: `${epochToHHMM(planLeg.endTime)}`,
      cssClasses: ["time"],
      wrap: false,
    }),
  });

  /**
   * Container holding all information for the transit trip.
   * The container text and background are recolored to match the color scheme of
   * the selected transit line. (The Transit API provides this information. Cool!)
   */
  const container = Widget.Box({
    cssClasses: ["transit-leg"],
    vertical: true,
    halign: Gtk.Align.FILL,
    children: [routeSummary, startStop, endStop],
    setup: (self) => {
      // Set up custom CSS provider for modifying styles at runtime
      const cssProvider = new Gtk.CssProvider();
      const className = `route-${planLeg.routeShortName?.replaceAll(" ", "-")}`;

      const routeCss = `
        .${className} {
          background-color: #${planLeg.routeColor};
        }

        .${className} label,
        .${className} image {
          color: #${planLeg.routeTextColor};
        }
      `;

      cssProvider.load_from_string(routeCss);

      Gtk.StyleContext.add_provider_for_display(
        self.get_display(),
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_USER,
      );

      self.add_css_class(className);
    },
  });

  // Display intermediate stops, if any
  if ((planLeg as PlanLeg_Transit).intermediateStops.length > 0) {
    const intermediateStops = (planLeg as PlanLeg_Transit).intermediateStops;

    const IntermediateStop = (stop: Stop) => {
      return Widget.Label({
        label: stop.name,
        cssClasses: ["stop-intermediate"],
        halign: Gtk.Align.START,
        hexpand: false,
        wrap: true,
      });
    };

    const stops = ExpansionPanel({
      cssClasses: ["stop-dropdown"],
      label: `${intermediateStops.length} stops before...`,
      vertical: true,
      children: intermediateStops.map(IntermediateStop),
      showExpanderIcon: true,
      expanderIconPosition: Gtk.PositionType.LEFT,
      maxDropdownHeight: 1000,
    });

    container.insert_child_after(stops, startStop);
  }

  return container;
};

/**
 * Show detailed information about a certain leg of a trip.
 * This is the default widget.
 */
const PlanLegWidget_Default = (_planLeg: PlanLeg): Gtk.Widget =>
  Widget.Label({
    label: "?",
  });

/** Map all possible travel modes to a respective PlanLeg widget */
const modeHandlers: Record<Mode, (planLeg: PlanLeg) => Gtk.Widget> = {
  [Mode.WALK]: PlanLegWidget_Legs,
  [Mode.AIRPLANE]: PlanLegWidget_Default,
  [Mode.BICYCLE]: PlanLegWidget_Default,
  [Mode.BUS]: PlanLegWidget_Transit,
  [Mode.CABLE_CAR]: PlanLegWidget_Default,
  [Mode.CAR]: PlanLegWidget_Default,
  [Mode.CARPOOL]: PlanLegWidget_Default,
  [Mode.COACH]: PlanLegWidget_Default,
  [Mode.FERRY]: PlanLegWidget_Default,
  [Mode.FLEX]: PlanLegWidget_Default,
  [Mode.FLEXIBLE]: PlanLegWidget_Default,
  [Mode.FUNICULAR]: PlanLegWidget_Default,
  [Mode.GONDOLA]: PlanLegWidget_Default,
  [Mode.LEG_SWITCH]: PlanLegWidget_Default,
  [Mode.MONORAIL]: PlanLegWidget_Default,
  [Mode.RAIL]: PlanLegWidget_Default,
  [Mode.SCOOTER]: PlanLegWidget_Default,
  [Mode.SUBWAY]: PlanLegWidget_Transit,
  [Mode.TAXI]: PlanLegWidget_Default,
  [Mode.TRAM]: PlanLegWidget_Default,
  [Mode.TRANSIT]: PlanLegWidget_Default,
  [Mode.TROLLEYBUS]: PlanLegWidget_Default,
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const DisplayView = (itinerary: TripItinerary) => {
  const controller = MapsController.get_default();
  const origin = controller.currentOrigin;
  const destination = controller.currentDestination;

  if (destination === undefined || origin === undefined) return;

  const leaveTime = epochToHHMM(itinerary.startTime);
  const arriveTime = epochToHHMM(itinerary.endTime);
  const timeUntilDeparture = epochToRelativeTime(itinerary.startTime / 1000);
  const destinationName = destination.displayPlace;
  const destinationAddress = destination.displayAddress;

  const returnToTripSelect = Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    cssClasses: ["back-btn"],
    child: Widget.Box({
      vertical: false,
      children: [
        Widget.Image({
          iconName: "caret-left-symbolic",
        }),
        Widget.Label({
          label: "Back to trip results",
        }),
      ],
    }),
    onClicked: () => {
      controller.selectedItinerary = undefined;
    },
  });

  const sendToPhoneText = Widget.Revealer({
    revealChild: false,
    transitionType: Gtk.RevealerTransitionType.SLIDE_LEFT,
    child: Widget.Label({
      label: "Send to phone",
    }),
  });

  const sendToPhoneButton = Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Image({
      iconName: "share-fat-symbolic",
    }),
    onHoverEnter: () => {
      sendToPhoneText.revealChild = true;
    },
    onHoverLeave: () => {
      sendToPhoneText.revealChild = false;
    },
    onClicked: () => {
      const from = `${origin.displayPlace}, ${origin.displayAddress}`;
      const to = `${destination.displayPlace}, ${destination.displayAddress}`;

      Pushover.get_default().sendWithUrl(
        `Transit: ${origin.displayPlace} -> ${destination.displayPlace}`,
        `transit://directions?from=${from}&to=${to}?utm_campaign=trip-planner`,
        "Transit",
      );
    },
  });

  /** Departure and arrival time */
  const timeSummary = Widget.Box({
    cssClasses: ["time-summary"],
    hexpand: false,
    vertical: true,
    children: [
      Widget.Label({
        hexpand: false,
        justify: Gtk.Justification.LEFT,
        halign: Gtk.Align.START,
        cssClasses: ["leave-at"],
        label: `Leave at ${leaveTime} (${timeUntilDeparture})`,
      }),
      Widget.Label({
        hexpand: false,
        justify: Gtk.Justification.LEFT,
        halign: Gtk.Align.START,
        cssClasses: ["arrive-at"],
        label: `Arrive at ${arriveTime}`,
      }),
    ],
  });

  /** All legs of the currently selected itinerary */
  const legs = Widget.Box({
    vertical: true,
    spacing: 12,
    children: itinerary.legs.map((leg) => modeHandlers[leg.mode as Mode](leg)),
  });

  /** Destination name/address */
  const destinationSummary = Widget.Box({
    cssClasses: ["destination"],
    vertical: false,
    hexpand: false,
    children: [
      Widget.Image({
        cssClasses: ["icon"],
        iconName: "map-pin-symbolic",
      }),
      Widget.Box({
        cssClasses: ["info"],
        vertical: true,
        halign: Gtk.Align.START,
        children: [
          Widget.Label({
            cssClasses: ["destination-name"],
            hexpand: true,
            label: destinationName,
            halign: Gtk.Align.START,
            xalign: 0,
            wrap: true,
          }),
          Widget.Label({
            cssClasses: ["destination-address"],
            label: destinationAddress,
            halign: Gtk.Align.FILL,
            hexpand: true,
            maxWidthChars: 1000,
            wrap: true,
            xalign: 0,
          }),
        ],
      }),
      Widget.Label({
        label: arriveTime,
      }),
    ],
  });

  return Widget.Box({
    cssClasses: ["trip-details"],
    hexpand: false,
    vertical: true,
    spacing: 12,
    children: [
      Widget.CenterBox({
        orientation: Gtk.Orientation.HORIZONTAL,
        startWidget: returnToTripSelect,
        endWidget: Widget.Box({
          vertical: false,
          spacing: 8,
          children: [sendToPhoneText, sendToPhoneButton],
        }),
      }),
      timeSummary,
      legs,
      destinationSummary,
    ],
  });
};

export const itineraryDisplayView = () => {
  const controller = MapsController.get_default();

  return Widget.Box({
    visible: bind(controller, "currentState").as(
      (state) => state === MapsState.ITINERARY_DISPLAY,
    ),
    cssClasses: ["section-content"],
    children: bind(controller, "selectedItinerary").as(
      (selectedItinerary): Gtk.Widget[] => {
        return selectedItinerary ? [DisplayView(selectedItinerary)!] : [];
      },
    ),
  });
};
