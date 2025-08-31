import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Mode, PlanLeg, TripItinerary } from "@/services/Transit";
import Astalified from "@/components/astalified";

const durationInMinutes = (planLeg: PlanLeg) =>
  `${Math.round(planLeg.duration / 60)}`;

const PlanLeg_Walk = (planLeg: PlanLeg): Gtk.Widget =>
  Widget.Box({
    vertical: false,
    cssClasses: ["plan-leg", "walk"],
    children: [
      Widget.Image({
        iconName: "person-simple-walk-symbolic",
      }),
      Widget.Label({
        label: durationInMinutes(planLeg),
      }),
    ],
  });

const PlanLeg_Subway = (planLeg: PlanLeg): Gtk.Widget =>
  Widget.Box({
    vertical: false,
    cssClasses: ["plan-leg", "subway"],
    children: [
      Widget.Image({
        iconName: "train-symbolic",
      }),
      Widget.Label({
        label: durationInMinutes(planLeg),
      }),
    ],
  });

const PlanLeg_Default = (_planLeg: PlanLeg): Gtk.Widget =>
  Widget.Label({
    label: "?",
  });

const modeHandlers: Record<Mode, (planLeg: PlanLeg) => Gtk.Widget> = {
  [Mode.WALK]: PlanLeg_Walk,
  [Mode.AIRPLANE]: PlanLeg_Default,
  [Mode.BICYCLE]: PlanLeg_Default,
  [Mode.BUS]: PlanLeg_Default,
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
  [Mode.SUBWAY]: PlanLeg_Subway,
  [Mode.TAXI]: PlanLeg_Default,
  [Mode.TRAM]: PlanLeg_Default,
  [Mode.TRANSIT]: PlanLeg_Default,
  [Mode.TROLLEYBUS]: PlanLeg_Default,
};

const Separator = () =>
  Widget.Image({
    cssClasses: ["separator"],
    iconName: "caret-right-symbolic",
  });

export const ItineraryWidget = (itinerary: TripItinerary) => {
  const tripDetails = Astalified.FlowBox({
    rowSpacing: 4,
    columnSpacing: 4,
    hexpand: true,
    vexpand: false,
    homogeneous: false,
    minChildrenPerLine: 1,
    children: itinerary.legs.map((leg) => modeHandlers[leg.mode as Mode](leg)),
  });

  // Insert separators between legs of the trip
  // let child = tripDetails.get_first_child();
  //
  // while (child) {
  //   const next = child.get_next_sibling();
  //   if (next) {
  //     tripDetails.insert_after(Separator(), child);
  //   }
  //   child = next;
  // }

  const tripDuration = Widget.Box({
    vertical: true,
    children: [
      Widget.Label({
        label: `${Math.round(itinerary.duration / 60)}`,
      }),
      Widget.Label({ label: "min" }),
    ],
  });

  return Widget.Button({
    child: Widget.Box({
      vertical: true,
      children: [
        Widget.Box({
          vertical: false,
          children: [tripDuration, tripDetails],
        }),
      ],
    }),
    cssClasses: ["trip-itinerary"],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    hexpand: true,
    onButtonPressed: () => {},
  });
};
