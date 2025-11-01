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
import LocationAutocomplete from "@/services/LocationAutocomplete";

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
    setup: (self) => {
      // When the search text is modified, set currentOrigin/currentDestination to undefined
      const changedSignalHandler = self.connect("changed", () => {
        if (
          controller[targetProp] !== undefined &&
          self.text !== controller[targetProp].displayPlace
        ) {
          controller[targetProp] = undefined;
        }
      });

      // Call locationIQ API to autocomplete location
      self.connect("activate", async () => {
        controller.endpointBeingModified = targetProp;

        try {
          controller.endpointSearchResults =
            await LocationAutocomplete.get_default().searchNear(self.text);
        } catch (error) {
          console.log(error);
        }
      });

      controller.connect(
        targetProp == "currentOrigin"
          ? "notify::current-origin"
          : "notify::current-destination",
        () => {
          // Block so that self.text = ...displayPlace doesn't set currentOrigin/Dest to undefined
          self.block_signal_handler(changedSignalHandler);

          const selectionPrediction = controller[targetProp];
          if (selectionPrediction !== undefined) {
            self.text = selectionPrediction.displayPlace ?? "";
          }

          self.unblock_signal_handler(changedSignalHandler);
        },
      );
    },
  });
};
