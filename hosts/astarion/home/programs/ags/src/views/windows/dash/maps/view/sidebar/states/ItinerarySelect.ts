import { Widget } from "astal/gtk4";
import MapsController, { MapsState } from "../../../controller";
import { bind } from "astal";

const controller = MapsController.get_default();

export const itinerarySelectView = () => {
  return Widget.Box({
    visible: bind(controller, "currentState").as(
      (state) => state === MapsState.ITINERARY_SELECT,
    ),
    children: [Widget.Label({ label: "itinerary select" })],
  });
};
