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

const durationInMinutes = (planLeg: PlanLeg) =>
  `${Math.round(planLeg.duration / 60)}m`;

const PlanLeg_Walk = (planLeg: PlanLeg): Gtk.Widget =>
  Widget.Box({
    cssClasses: ["plan-leg", "walk"],
    vertical: false,
    vexpand: false,
    hexpand: true,
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.START,
    spacing: 4,
    children: [
      Widget.Image({
        iconName: "person-simple-walk-symbolic",
      }),
      Widget.Label({
        label: durationInMinutes(planLeg),
      }),
    ],
  });

const PlanLeg_Transit = (planLeg: PlanLeg_Transit): Gtk.Widget => {
  let icon = "train-symbolic";
  if (Mode.BUS == planLeg.mode) icon = "bus-symbolic";
  if (Mode.SUBWAY == planLeg.mode) icon = "train-symbolic";

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

  const startStop = Astalified.CenterBox({
    cssClasses: ["stop-endpoint"],
    vertical: false,
    startWidget: Widget.Label({
      cssClasses: ["location"],
      label: `${planLeg.from.name}`,
    }),
    endWidget: Widget.Label({
      cssClasses: ["time"],
      label: `${epochToHHMM(planLeg.startTime)}`,
    }),
  });

  const endStop = Astalified.CenterBox({
    cssClasses: ["stop-endpoint"],
    vertical: false,
    startWidget: Widget.Label({
      label: `${planLeg.to.name}`,
    }),
    endWidget: Widget.Label({
      label: `${epochToHHMM(planLeg.endTime)}`,
    }),
  });

  const container = Widget.Box({
    cssClasses: [`route-${planLeg.routeShortName}` || "", "transit-leg"],
    vertical: true,
    hexpand: false,
    children: [routeSummary, startStop, endStop],
    setup: (self) => {
      const cssProvider = new Gtk.CssProvider();
      cssProvider.load_from_string(`
        .route-${planLeg.routeShortName} {
          background-color: #${planLeg.routeColor};
          color: #${planLeg.routeTextColor};
        }
      `);
      const styleContext = self.get_style_context();
      styleContext.add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    },
  });

  if (planLeg.intermediateStops.length > 0) {
    const IntermediateStop = (stop: Stop) => {
      return Widget.Label({
        hexpand: false,
        halign: Gtk.Align.START,
        cssClasses: ["stop-intermediate"],
        label: stop.name,
        wrap: true,
      });
    };

    const stops = ExpansionPanel({
      cssClasses: ["stop-dropdown"],
      label: `${planLeg.intermediateStops.length} stops before...`,
      vertical: true,
      children: planLeg.intermediateStops.map(IntermediateStop),
      maxDropdownHeight: 200,
    });

    container.insert_child_after(stops, startStop);
  }

  return container;
};

const PlanLeg_Default = (_planLeg: PlanLeg): Gtk.Widget =>
  Widget.Label({
    label: "?",
  });

const modeHandlers: Record<Mode, (planLeg: PlanLeg) => Gtk.Widget> = {
  [Mode.WALK]: PlanLeg_Walk,
  [Mode.AIRPLANE]: PlanLeg_Default,
  [Mode.BICYCLE]: PlanLeg_Default,
  [Mode.BUS]: PlanLeg_Transit,
  [Mode.CABLE_CAR]: PlanLeg_Default,
  [Mode.CAR]: PlanLeg_Default,
  [Mode.CARPOOL]: PlanLeg_Default,
  [Mode.COACH]: PlanLeg_Default,
  [Mode.FERRY]: PlanLeg_Default,
  [Mode.FLEX]: PlanLeg_Default,
  [Mode.FLEXIBLE]: PlanLeg_Default,
  [Mode.FUNICULAR]: PlanLeg_Default,
  [Mode.GONDOLA]: PlanLeg_Default,
  [Mode.LEG_SWITCH]: PlanLeg_Default,
  [Mode.MONORAIL]: PlanLeg_Default,
  [Mode.RAIL]: PlanLeg_Default,
  [Mode.SCOOTER]: PlanLeg_Default,
  [Mode.SUBWAY]: PlanLeg_Transit,
  [Mode.TAXI]: PlanLeg_Default,
  [Mode.TRAM]: PlanLeg_Default,
  [Mode.TRANSIT]: PlanLeg_Default,
  [Mode.TROLLEYBUS]: PlanLeg_Default,
};

export const TripResultDetails = (selectedItinerary: TripItinerary) => {
  const childrenWithSeparators: Gtk.Widget[] = [];
  selectedItinerary.legs.forEach((leg, index) => {
    childrenWithSeparators.push(modeHandlers[leg.mode as Mode](leg));
    if (index < selectedItinerary.legs.length - 1) {
      // childrenWithSeparators.push(Separator());
    }
  });

  const legs = Widget.Box({
    vertical: true,
    spacing: 8,
    children: childrenWithSeparators,
  });

  const leaveTime = epochToHHMM(selectedItinerary.startTime);
  const arriveTime = epochToHHMM(selectedItinerary.endTime);
  const now = new Date().getTime();
  const timeUntilDeparture = epochToRelativeTime(
    selectedItinerary.startTime - now,
  );

  const timeSummary = Widget.Box({
    cssClasses: ["time-summary"],
    hexpand: true,
    vertical: true,
    children: [
      Widget.Label({
        hexpand: true,
        justify: Gtk.Justification.LEFT,
        halign: Gtk.Align.START,
        cssClasses: ["leave-at"],
        label: `Leave at ${leaveTime} (in ${timeUntilDeparture})`,
      }),
      Widget.Label({
        hexpand: true,
        justify: Gtk.Justification.LEFT,
        halign: Gtk.Align.START,
        cssClasses: ["arrive-at"],
        label: `Arrive at ${arriveTime}`,
      }),
    ],
  });

  return Widget.Box({
    cssClasses: ["trip-details"],
    hexpand: false,
    vertical: true,
    spacing: 12,
    children: [timeSummary, legs],
  });
};
