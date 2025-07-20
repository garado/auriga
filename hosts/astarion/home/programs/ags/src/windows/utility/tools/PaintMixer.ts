/**
 * █▀█ ▄▀█ █ █▄░█ ▀█▀   █▀▄▀█ █ ▀▄▀ █▀▀ █▀█
 * █▀▀ █▀█ █ █░▀█ ░█░   █░▀░█ █ █░█ ██▄ █▀▄
 *
 * Use hyprpicker to pick a color and get instructions for how to mix it with
 * colors that you already have. Existing colors are defined in user config file.
 *
 * Just another ChatGPT wrapper.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App, Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, execAsync } from "astal";

import Gemini from "@/services/Gemini";
import SettingsManager from "@/services/settings";
import { ExpansionPanel } from "@/components/ExpansionPanel";
import { WINDOW_NAMES } from "app";
import { convertMarkdownToPangoMarkup } from "@/utils/MarkdownToMarkup";
import { clearChildren } from "@/utils/BoxUtils";
import {
  deleteAllFilesFromDir,
  fileWrite,
  readAllFilesFromDir,
} from "@/utils/File";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const geminiService = Gemini.get_default();
const utilityConfig = SettingsManager.get_default().config.utility;

const RESULTS_CACHE_DIR = "/tmp/ags/colors/";

const CSS_CLASSES = {
  CONTAINER: "paint-mixer",
  HEADER_CONTAINER: "paint-mixer-header",
  TITLE_TEXT: "paint-mixer-title",
  CLEAR_BUTTON: "paint-mixer-clear-button",
  COLOR_PICKER_LAUNCHER: "paint-mixer-picker-launcher",
  MIX_INSTRUCTIONS: "paint-mixer-instructions",
  MIX_INSTRUCTIONS_TAB: "tab",
  MIX_INSTRUCTIONS_CONTAINER: "paint-mixer-instructions-container",
  PLACEHOLDER_TEXT: "paint-mixer-placeholder",
} as const;

/** Enables/disables Gemini API call (for development) */
const ENABLE_PROMPT = true;

const PROMPT_TEMPLATE = (color: string, existingColors: string[]) => `
Provide paint mixing instructions for the color ${color} given that the \
following colors available: ${existingColors}

The instructions should be in the following format:

(color): (description of color)

- Base color: (base color)
- Then include a series of colors, adjustments to make to achieve desired color.

Then include tips for readjusting the color if too much of a component color is mixed. 

Be as concise as possible.
`;

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

/** Controls state of all mix instructions (acts like a selective button group) */
const expansionGroupState = Variable(false);

/** List of colors currently present in mix instruction widget */
const colorsMixed: string[] = [];

/**
 * Reference to the content of mix instruction widgets
 * Reference is needed so that when API call is finished, it can find the widget to update
 */
let instructionContentReference: Record<string, Gtk.Label> = {};

/** Container for all mix instructions */
let allMixInstructions: Gtk.Box;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Pick color with hyprpicker
 */
const pickColor = async (): Promise<void> => {
  try {
    App.get_window(WINDOW_NAMES.UTILITY)?.set_visible(false);

    // Small delay to ensure window fully hides before hyprpicker launches
    await new Promise((resolve) => setTimeout(resolve, 100));

    const cmd = `hyprpicker --no-fancy --render-inactive --format=hex`;
    const selectedColor = await execAsync(cmd);
    promptMixingInstructions(selectedColor, utilityConfig.availablePaintColors);

    App.get_window(WINDOW_NAMES.UTILITY)?.set_visible(true);
  } catch (error) {
    console.log(error);
  }
};

/**
 *
 */
const handleResponseReceived = (id: number, response: string) => {
  const color = colorsMixed[id];
  const mixInstruction = instructionContentReference[color];
  mixInstruction.set_markup(convertMarkdownToPangoMarkup(response));
  fileWrite(`${RESULTS_CACHE_DIR}/${color}`, response);
};

/**
 * Prompt LLM for mixing instructions.
 */
const promptMixingInstructions = (color: string, existingColors: string[]) => {
  // Clear placeholder widget if necessary
  if (colorsMixed.length == 0) {
    allMixInstructions.remove(allMixInstructions.get_first_child()!);
  }

  // Add mix instruction with placeholder content while waiting for API response
  const placeholder = MixInstruction(color, `Mixing ${color}...`);
  allMixInstructions.append(placeholder);

  colorsMixed.push(color);
  const id = colorsMixed.length - 1; // Prompt ID is index of color in `colorsMixed`

  if (ENABLE_PROMPT) {
    geminiService.prompt(
      id,
      PROMPT_TEMPLATE(color, existingColors),
      handleResponseReceived,
    );
  }
};

/**
 * Clear all widget data.
 */
const clearAllData = (): void => {
  colorsMixed.length = 0;
  instructionContentReference = {};
  clearChildren(allMixInstructions);
  deleteAllFilesFromDir(RESULTS_CACHE_DIR);
  allMixInstructions.append(Placeholder());
};

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

const Placeholder = () =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.PLACEHOLDER_TEXT],
    label: "Nothing here yet.",
  });

/**
 * Header bar
 */
const PaintMixerHeader = () =>
  Widget.CenterBox({
    cssClasses: [CSS_CLASSES.HEADER_CONTAINER],
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Box({
      children: [
        Widget.Label({
          label: "Paint mixer",
          cssClasses: [CSS_CLASSES.TITLE_TEXT],
        }),
      ],
    }),
    endWidget: Widget.Box({
      spacing: 8,
      children: [
        Widget.Button({
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          cssClasses: [CSS_CLASSES.CLEAR_BUTTON],
          label: "Clear",
          onButtonPressed: clearAllData,
        }),
        Widget.Button({
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          cssClasses: [CSS_CLASSES.COLOR_PICKER_LAUNCHER],
          child: Widget.Image({
            hexpand: false,
            iconName: "eyedropper-symbolic",
          }),
          onButtonPressed: pickColor,
        }),
      ],
    }),
  });

const MixInstructionTab = (color: string) =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.MIX_INSTRUCTIONS_TAB],
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    children: [
      Widget.Label({
        label: color,
      }),
    ],
    setup: (self) => {
      // Change box background color to match the given color
      self.add_css_class("color-display-box");

      const cssProvider = new Gtk.CssProvider();
      cssProvider.load_from_data(
        `
        .color-display-box { 
          background-color: ${color}; 
        }
      `,
        -1,
      );

      const styleContext = self.get_style_context();
      styleContext.add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    },
  });

/**
 * Show mixing instructions for a particular color
 */
const MixInstruction = (color: string, instructions: string): Gtk.Box => {
  const mixInstructionContent = Widget.Label({
    useMarkup: true,
    label: convertMarkdownToPangoMarkup(instructions),
    wrap: true,
  });

  instructionContentReference[color] = mixInstructionContent;

  return ExpansionPanel({
    expandTabContent: MixInstructionTab(color),
    label: color,
    vertical: true,
    children: [mixInstructionContent],
    cssClasses: [CSS_CLASSES.MIX_INSTRUCTIONS],
    maxDropdownHeight: 400,
    globalRevealerState: expansionGroupState,
  });
};

/**
 * Container showing all stored colors.
 */
const AllMixInstructions = (): Gtk.Box => {
  allMixInstructions = Widget.Box({
    cssClasses: [CSS_CLASSES.MIX_INSTRUCTIONS_CONTAINER],
    vertical: true,
    spacing: 12,
    children: [],
  });

  // Populate with either cached instructions or placeholder
  const cachedInstructions = Object.entries(
    readAllFilesFromDir(RESULTS_CACHE_DIR),
  );

  if (cachedInstructions.length > 0) {
    cachedInstructions.forEach(([color, instructions]) => {
      const mixInstruction = MixInstruction(color, instructions);
      allMixInstructions.append(mixInstruction);
      colorsMixed.push(color);
    });
  } else {
    allMixInstructions.append(Placeholder());
  }

  return allMixInstructions;
};

export const PaintMixer = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.CONTAINER],
    children: [PaintMixerHeader(), AllMixInstructions()],
  });
};
