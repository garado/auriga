/**
 * █▀▀ █▄░█ █▀▄ █▀█ █▀█ █ █▄░█ ▀█▀ █▀   █▀ █▀▀ █░░ █▀▀ █▀▀ ▀█▀
 * ██▄ █░▀█ █▄▀ █▀▀ █▄█ █ █░▀█ ░█░ ▄█   ▄█ ██▄ █▄▄ ██▄ █▄▄ ░█░
 *
 * Contents of sidebar during the ENDPOINTS_SELECT state
 */

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

const PinnedLocations = () => {
  return Widget.Box({
    vexpand: true,
    hexpand: true,
    vertical: true,
    visible: bind(controller, "endpointSearchResults").as(
      (results) => results.length == 0,
    ),
    children: [
      Widget.Label({
        cssClasses: ["pinned-locations-header"],
        label: "Pinned Locations",
      }),
      Widget.Box({
        vertical: true,
        children: bind(controller, "pinnedLocations").as((pinned_hashmap) => {
          const pinned = Object.values(pinned_hashmap);
          if (pinned.length == 0) {
            return [
              Widget.Label({
                cssClasses: ["pinned-placeholder"],
                label: "Ctrl+Click a location to pin/unpin",
              }),
            ];
          } else {
            return Object.values(pinned).map(Prediction);
          }
        }),
      }),
    ],
  });
};

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
    children: [PinnedLocations(), EndpointSearchResults()],
  });
};
