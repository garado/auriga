/**
 * █▀ █▀▀ ▄▀█ █▀█ █▀▀ █░█   █▄▄ █▀█ ▀▄▀
 * ▄█ ██▄ █▀█ █▀▄ █▄▄ █▀█   █▄█ █▄█ █░█
 *
 * Where user enters query for location endpoint (origin/destination)
 */

import { Gdk, Widget } from "astal/gtk4";
import { Variable } from "astal";

import { Prediction } from "./Prediction";
import LocationAutocomplete, {
  PlacePrediction,
} from "@/services/LocationAutocomplete";
import { sidebarContent } from "../../StateManagement";

const autocomplete = LocationAutocomplete.get_default();

export const SearchBox = (props: {
  /** Placeholder text for the search box */
  placeholder: string;

  /** The PlacePrediction that this search box is for (either Origin or Destination) */
  selectionTarget: Variable<PlacePrediction | undefined>;
}) => {
  return Widget.Entry({
    placeholderText: props.placeholder,
    onKeyPressed: (_self, keyval, _keycode, state) => {
      // Prevent keyboard shortcuts (Esc, Shift+L) from resetting the selection target
      if (
        state === Gdk.ModifierType.NO_MODIFIER_MASK &&
        keyval !== Gdk.KEY_Escape
      ) {
        props.selectionTarget.set(undefined);
      }
    },
    onActivate: async (self) => {
      // Call locationIQ API to autocomplete location
      try {
        const responses = await autocomplete.searchNear(self.text);
        sidebarContent.children = responses.map((resp) => {
          return Prediction(resp, props.selectionTarget);
        });
      } catch (error) {
        console.log(error);
      }
    },
    setup: (self) => {
      props.selectionTarget.subscribe(
        (selectionPrediction: PlacePrediction | undefined) => {
          if (selectionPrediction !== undefined) {
            self.text = selectionPrediction.displayPlace ?? "";
          }
        },
      );
    },
  });
};
