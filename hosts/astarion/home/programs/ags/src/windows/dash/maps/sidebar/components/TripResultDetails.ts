/**
 * ▀█▀ █▀█ █ █▀█   █▀▄ █▀▀ ▀█▀ ▄▀█ █ █░░ █▀
 * ░█░ █▀▄ █ █▀▀   █▄▀ ██▄ ░█░ █▀█ █ █▄▄ ▄█
 *
 * Shows detailed trip itinerary.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget } from "astal/gtk4";
import {
  Mode,
  PlanLeg,
  PlanLeg_Transit,
  Stop,
  TripItinerary,
} from "@/services/Transit";
import { epochToHHMM, epochToRelativeTime } from "@/utils/Time";
import { ExpansionPanel } from "@/components/ExpansionPanel";
import Astalified from "@/components/astalified";
import { destination } from "../../StateManagement";

/*****************************************************************************
 * Helpers
 *****************************************************************************/

const durationInMinutes = (planLeg: PlanLeg) =>
  `${Math.round(planLeg.duration / 60)}m`;

/*****************************************************************************
 * Widgets
 *****************************************************************************/

/**
 * Show detailed information about a certain leg of a trip.
 * This is for legs of the trip where you use your... legs. (bike, walk, etc.)
 */
const PlanLegWidget_Legs = (planLeg: PlanLeg): Gtk.Widget => {
  let icon = "person-simple-walk-symbolic";
  if (Mode.BICYCLE === planLeg.mode) icon = "bike-symbolic";

  return Widget.Box({
    cssClasses: ["plan-leg", "walk"],
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
      }),
    ],
  });

  /**
   * Display the starting point of the transit trip
   * "Get on at this stop"
   */
  const startStop = Astalified.CenterBox({
    cssClasses: ["stop-endpoint"],
    vertical: false,
    hexpand: false,
    startWidget: Widget.Label({
      cssClasses: ["location"],
      label: `${planLeg.from.name}`,
      wrap: true,
    }),
    endWidget: Widget.Label({
      cssClasses: ["time"],
      label: `${epochToHHMM(planLeg.startTime)}`,
      wrap: true,
    }),
  });

  /**
   * Display the ending point of the transit trip
   * "Get off at this stop"
   */
  const endStop = Astalified.CenterBox({
    cssClasses: ["stop-endpoint"],
    vertical: false,
    hexpand: false,
    startWidget: Widget.Label({
      label: `${planLeg.to.name}`,
      cssClasses: ["location"],
      wrap: true,
    }),
    endWidget: Widget.Label({
      label: `${epochToHHMM(planLeg.endTime)}`,
      cssClasses: ["time"],
      wrap: true,
    }),
  });

  /**
   * Container holding all information for the transit trip.
   * The container text and background are recolored to match the color scheme of
   * the selected transit line. (The Transit API provides this information. Cool!)
   */
  const container = Widget.Box({
    cssClasses: [`route-${planLeg.routeShortName}` || "", "transit-leg"],
    vertical: true,
    halign: Gtk.Align.FILL,
    children: [routeSummary, startStop, endStop],
    setup: (self) => {
      // Custom CSS provider needed to modify styles at runtime
      const cssProvider = new Gtk.CssProvider();
      const styleContext = self.get_style_context();
      styleContext.add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);

      cssProvider.load_from_string(`
        .route-${planLeg.routeShortName} {
          background-color: #${planLeg.routeColor};
          color: #${planLeg.routeTextColor};
        }
      `);
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

export const TripResultDetails = (selectedItinerary: TripItinerary) => {
  const leaveTime = epochToHHMM(selectedItinerary.startTime);
  const arriveTime = epochToHHMM(selectedItinerary.endTime);
  const timeUntilDeparture = epochToRelativeTime(
    selectedItinerary.startTime / 1000,
  );
  const destinationName = destination.get()?.displayPlace;
  const destinationAddress = destination.get()?.displayAddress;

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
    children: selectedItinerary.legs.map((leg) =>
      modeHandlers[leg.mode as Mode](leg),
    ),
  });

  /** Destination name/address */
  const destinationSummary = Astalified.CenterBox({
    cssClasses: ["destination"],
    vertical: false,
    hexpand: false,
    startWidget: Widget.Image({
      cssClasses: ["icon"],
      iconName: "map-pin-symbolic",
    }),
    centerWidget: Widget.Box({
      cssClasses: ["info"],
      vertical: true,
      halign: Gtk.Align.FILL,
      children: [
        Widget.Label({
          cssClasses: ["destination-name"],
          hexpand: true,
          label: destinationName,
          halign: Gtk.Align.START,
          justify: Gtk.Justification.LEFT,
          wrap: true,
        }),
        Widget.Label({
          // naturalWrapMode: Gtk.NaturalWrapMode.NONE,
          cssClasses: ["destination-address"],
          label: destinationAddress,
          justify: Gtk.Justification.LEFT,
          halign: Gtk.Align.FILL,
          hexpand: true,
          maxWidthChars: 1000,
          wrap: true,
          xalign: 0,
        }),
      ],
    }),
    endWidget: Widget.Label({
      label: arriveTime,
    }),
  });

  return Widget.Box({
    cssClasses: ["trip-details"],
    hexpand: false,
    vertical: true,
    spacing: 12,
    children: [timeSummary, legs, destinationSummary],
  });
};
