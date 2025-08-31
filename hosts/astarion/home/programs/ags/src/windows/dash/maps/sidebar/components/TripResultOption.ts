import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Mode, PlanLeg, TripItinerary } from "@/services/Transit";
import Astalified from "@/components/astalified";
import { epochToDuration, epochToHHMM } from "@/utils/Time";
import { previewedItinerary, selectedItinerary } from "../../StateManagement";

const durationInMinutes = (planLeg: PlanLeg) =>
  `${Math.round(planLeg.duration / 60)}m`;

const PlanLeg_Walk = (planLeg: PlanLeg): Gtk.Widget =>
  Widget.Box({
    cssClasses: ["plan-leg", "walk"],
    vertical: false,
    vexpand: false,
    hexpand: false,
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.CENTER,
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

const PlanLeg_Transit = (planLeg: PlanLeg): Gtk.Widget => {
  const cssProvider = new Gtk.CssProvider();
  cssProvider.load_from_string(`
    .route-${planLeg.routeShortName} {
      background-color: #${planLeg.routeColor};
    }
  `);

  let icon = "train-symbolic";
  if (Mode.BUS == planLeg.mode) icon = "bus-symbolic";
  if (Mode.SUBWAY == planLeg.mode) icon = "train-symbolic";

  return Widget.Box({
    cssClasses: ["plan-leg", "transit"],
    vertical: false,
    vexpand: false,
    hexpand: false,
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.CENTER,
    spacing: 4,
    children: [
      Widget.Image({
        iconName: icon,
      }),
      Widget.Box({
        cssClasses: [`route-${planLeg.routeShortName}` || "", "route-id"],
        children: [
          Widget.Label({
            label: planLeg.routeShortName,
          }),
        ],
        setup: (self) => {
          const styleContext = self.get_style_context();
          styleContext.add_provider(
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER,
          );
        },
      }),
    ],
  });
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

const Separator = () =>
  Widget.Label({
    hexpand: false,
    halign: Gtk.Align.CENTER,
    cssClasses: ["separator"],
    label: ">",
  });

export const TripResult = (itinerary: TripItinerary) => {
  const childrenWithSeparators: Gtk.Widget[] = [];
  itinerary.legs.forEach((leg, index) => {
    childrenWithSeparators.push(modeHandlers[leg.mode as Mode](leg));
    if (index < itinerary.legs.length - 1) {
      childrenWithSeparators.push(Separator());
    }
  });

  const tripDetails = Astalified.FlowBox({
    cssClasses: ["trip-details"],
    hexpand: false,
    vexpand: false,
    valign: Gtk.Align.START,
    homogeneous: false,
    minChildrenPerLine: 1,
    maxChildrenPerLine: 10,
    rowSpacing: 4,
    children: childrenWithSeparators,
  });

  const duration = epochToDuration(itinerary.duration);

  const tripDuration = Widget.Box({
    cssClasses: ["trip-duration"],
    vertical: true,
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
    hexpand: true,
    halign: Gtk.Align.START,
    justify: Gtk.Justification.LEFT,
    setup: (self) => {
      const start = epochToHHMM(itinerary.startTime);
      const end = epochToHHMM(itinerary.endTime);
      self.set_text(`${start} - ${end}`);
    },
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
          children: [tripTimes, tripDetails],
        }),
      ],
    }),
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: true,
    onHoverEnter: () => {
      if (previewedItinerary.get() !== itinerary) {
        previewedItinerary.set(itinerary);
      }
    },
    onButtonPressed: () => {
      if (selectedItinerary.get() !== itinerary) {
        selectedItinerary.set(itinerary);
      }
    },
  });
};
