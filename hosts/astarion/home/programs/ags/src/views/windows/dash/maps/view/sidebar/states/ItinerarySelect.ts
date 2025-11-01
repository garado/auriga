/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { bind } from "astal";
import { ItineraryPreview } from "../components/ItineraryPreview";
import MapsController, { MapsState } from "../../../controller";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const itinerarySelectView = () => {
  const controller = MapsController.get_default();

  return Widget.Box({
    cssClasses: ["section-content"],
    vertical: true,
    visible: bind(controller, "currentState").as(
      (state) => state === MapsState.ITINERARY_SELECT,
    ),
    children: bind(controller, "currentTripPlan").as(
      (tripPlan) => tripPlan?.plan.itineraries.map(ItineraryPreview) ?? [],
    ),
  });
};
