/**
 * █ ▀█▀ █ █▄░█ █▀▀ █▀█ ▄▀█ █▀█ █▄█   █▀█ █▀█ █▀▀ █░█ █ █▀▀ █░█░█
 * █ ░█░ █ █░▀█ ██▄ █▀▄ █▀█ █▀▄ ░█░   █▀▀ █▀▄ ██▄ ▀▄▀ █ ██▄ ▀▄▀▄▀
 *
 * After selecting an origin/destination, the Maps tab will provide the user with different
 * itineraries to select from.
 *
 * This file implements the trip itinerary preview, which includes:
 * - Trip duration
 * - Start/end time
 * - All legs of trip and how long they take (transit, walking, etc)
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Mode, PlanLeg, TripItinerary } from "@/services/Transit";
import {
  epochToDuration,
  epochToHHMM,
  epochToRelativeTime,
} from "@/utils/Time";
import BetterFlowBox from "@/views/components/BetterFlowBox";
import MapsController from "../../../controller";

/*****************************************************************************
 * Helpers
 *****************************************************************************/

const durationInMinutes = (planLeg: PlanLeg) =>
  `${Math.round(planLeg.duration / 60)}m`;

/*****************************************************************************
 * Widgets
 *****************************************************************************/

/**
 * Show minimal information about a certain leg of a trip.
 * This is for legs of the trip where you use your... legs. (bike, walk, etc.)
 */
const PlanLegWidget_Legs = (planLeg: PlanLeg): Gtk.Widget =>
  Widget.Box({
    cssClasses: ["plan-leg", "use-your-legs"],
    spacing: 4,
    canFocus: false,
    halign: Gtk.Align.CENTER,
    children: [
      Widget.Image({
        iconName: "person-simple-walk-symbolic",
      }),
      Widget.Label({
        label: durationInMinutes(planLeg),
      }),
    ],
  });

/**
 * Show minimal information about a certain leg of a trip.
 * This is for legs of the trip which use some type of public transit.
 */
const PlanLegWidget_Transit = (planLeg: PlanLeg): Gtk.Widget => {
  let icon = "train-symbolic";
  if (Mode.BUS == planLeg.mode) icon = "bus-symbolic";
  if (Mode.SUBWAY == planLeg.mode) icon = "train-symbolic";

  return Widget.Box({
    cssClasses: ["plan-leg", "transit"],
    vertical: false,
    canFocus: false,
    valign: Gtk.Align.START,
    halign: Gtk.Align.START,
    hexpand: false,
    vexpand: false,
    spacing: 4,
    children: [
      Widget.Image({
        iconName: icon,
        halign: Gtk.Align.START,
        hexpand: false,
        vexpand: false,
      }),
      Widget.Box({
        halign: Gtk.Align.START,
        hexpand: false,
        vexpand: false,
        cssClasses: ["route-id"],
        children: [Widget.Label({ label: planLeg.routeShortName })],
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
      }),
    ],
  });
};

/**
 * Show minimal information about a certain leg of a trip.
 * This is the default widget.
 */
const PlanLegWidget_Default = (_planLeg: PlanLeg): Gtk.Widget =>
  Widget.Label({
    hexpand: false,
    canFocus: false,
    vexpand: false,
    halign: Gtk.Align.START,
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

/** Separator between PlanLeg widgets. */
const Separator = () =>
  Widget.Label({
    hexpand: false,
    vexpand: false,
    canFocus: false,
    halign: Gtk.Align.START,
    cssClasses: ["separator"],
    label: ">",
  });

export const ItineraryPreview = (itinerary: TripItinerary) => {
  const controller = MapsController.get_default();

  const childrenWithSeparators: Gtk.Widget[] = [];
  itinerary.legs.forEach((leg, index) => {
    childrenWithSeparators.push(modeHandlers[leg.mode as Mode](leg));
    if (index < itinerary.legs.length - 1) {
      childrenWithSeparators.push(Separator());
    }
  });

  const tripDetails = BetterFlowBox({
    cssClasses: ["trip-itinerary-overview"],
    canFocus: false,
    vexpand: false,
    hexpand: false,
    halign: Gtk.Align.START,
    valign: Gtk.Align.START,
    rowSpacing: 8,
    columnSpacing: 10,
    children: childrenWithSeparators,
  });

  const duration = epochToDuration(itinerary.duration);

  const tripDuration = Widget.Box({
    cssClasses: ["trip-duration"],
    vertical: true,
    hexpand: false,
    valign: Gtk.Align.START,
    children: [
      Widget.Label({
        cssClasses: ["big-text"],
        label: duration.hours,
      }),
      Widget.Label({
        cssClasses: ["little-text"],
        label: duration.minutes,
      }),
    ],
  });

  const tripTimes = Widget.Label({
    cssClasses: ["trip-times"],
    hexpand: false,
    halign: Gtk.Align.START,
    justify: Gtk.Justification.LEFT,
    setup: (self) => {
      const start = epochToHHMM(itinerary.startTime);
      const end = epochToHHMM(itinerary.endTime);
      self.set_text(`${start} - ${end}`);
    },
  });

  const timeUntilDeparture = Widget.Label({
    cssClasses: ["time-until-departure"],
    hexpand: false,
    halign: Gtk.Align.START,
    justify: Gtk.Justification.LEFT,
    label: `(${epochToRelativeTime(itinerary.startTime / 1000)})`,
  });

  return Widget.Button({
    cssClasses: ["trip-result"],
    child: Widget.Box({
      hexpand: true,
      vertical: false,
      children: [
        tripDuration,
        Widget.Box({
          vertical: true,
          hexpand: true,
          children: [
            Widget.Box({
              vertical: false,
              hexpand: true,
              spacing: 4,
              children: [tripTimes, timeUntilDeparture],
            }),
            tripDetails,
          ],
        }),
      ],
    }),
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: true,
    onHoverEnter: () => {
      if (controller.previewedItinerary !== itinerary) {
        controller.previewedItinerary = itinerary;
      }
    },
    onButtonPressed: () => {
      if (controller.selectedItinerary !== itinerary) {
        controller.selectedItinerary = itinerary;
      }
    },
  });
};
