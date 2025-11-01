/**
 * █▀ █▀▀ ▄▀█ █▀█ █▀▀ █░█   █▄▄ █▀█ ▀▄▀
 * ▄█ ██▄ █▀█ █▀▄ █▄▄ █▀█   █▄█ █▄█ █░█
 *
 * Where user enters query for location endpoint. (origin/destination)
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Widget } from "astal/gtk4";

import MapsController, { ControllerKey } from "../../../controller";
import LocationAutocomplete, {
  PlacePrediction,
} from "@/services/LocationAutocomplete";
import control from "@/views/windows/control";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const controller = MapsController.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const SearchBox = (
  /** The controller property that this search box is for ("currentOrigin" or "currentDestination") */
  targetProp: ControllerKey,
) => {
  const placeholderText =
    targetProp === "currentOrigin" ? "Select origin" : "Select destination";

  return Widget.Entry({
    placeholderText: placeholderText,
    hexpand: true,
    onKeyPressed(self, _keyval, _keycode, _state) {
      // When the user modifies the search, set currentOrigin/currentDestination to undefined
      if (
        controller[targetProp] !== undefined &&
        self.text !== controller[targetProp].displayPlace
      ) {
        controller[targetProp] = undefined;
      }
    },
    onActivate: async (self) => {
      controller.endpointBeingModified = targetProp;

      // Call locationIQ API to autocomplete location
      try {
        controller.endpointSearchResults =
          await LocationAutocomplete.get_default().searchNear(self.text);
      } catch (error) {
        console.log(error);
      }
    },
    setup: (self) => {
      controller.connect(
        targetProp == "currentOrigin"
          ? "notify::current-origin"
          : "notify::current-destination",
        () => {
          const selectionPrediction = controller[targetProp];
          if (selectionPrediction !== undefined) {
            self.text = selectionPrediction.displayPlace ?? "";
          }
        },
      );
    },
  });
};
