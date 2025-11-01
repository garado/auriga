/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";
import { bind } from "astal";
import MapsController, { MapsState } from "../../../controller";
import { Prediction } from "../components/Prediction";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const controller = MapsController.get_default();

/*****************************************************************************
 * Widget
 *****************************************************************************/

const EndpointSearchResults = () => {
  return Widget.Box({
    vexpand: true,
    hexpand: true,
    vertical: true,
    children: bind(controller, "endpointSearchResults").as((results) =>
      results.map(Prediction),
    ),
  });
};

export const endpointSelectView = () => {
  return Widget.Box({
    cssClasses: ["section-content"],
    hexpand: true,
    vertical: true,
    visible: bind(controller, "currentState").as(
      (state) => state === MapsState.ENDPOINTS_SELECT,
    ),
    children: [EndpointSearchResults()],
  });
};
