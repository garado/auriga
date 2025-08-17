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
import { Dropdown } from "@/components/Dropdown";
import { ExpansionPanel } from "@/components/ExpansionPanel";
import { WINDOW_NAMES } from "app";
import { convertMarkdownToPangoMarkup } from "@/utils/MarkdownToMarkup";
import { clearChildren } from "@/utils/BoxUtils";
import {
  deleteAllFilesFromDir,
  fileWrite,
  readAllFilesFromDir,
  mkdir,
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
  PALETTE_SELECTOR: "paint-mixer-palette-selector",
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

/** Currently selected palette */
const currentPalette = Variable(
  Object.keys(utilityConfig.palettes || {})[0] || "",
);

/** List of colors currently present in mix instruction widget for current palette */
const colorsMixed: Record<string, string[]> = {};

/**
 * Reference to the content of mix instruction widgets per palette
 * Reference is needed so that when API call is finished, it can find the widget to update
 */
let instructionContentReference: Record<string, Record<string, Gtk.Label>> = {};

/** Container for all mix instructions */
let allMixInstructions: Gtk.Box;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/** Check if input is valid hex color. */
const isValidHexColor = (input: string) => /^#[0-9A-F]{6}$/i.test(input);

/** Get the directory path for a specific palette */
const getPaletteDir = (palette: string) =>
  `${RESULTS_CACHE_DIR}${palette.replaceAll(" ", "_")}/`;

/** Initialize palette data structures */
const initializePalette = (palette: string) => {
  if (!colorsMixed[palette]) {
    colorsMixed[palette] = [];
  }
  if (!instructionContentReference[palette]) {
    instructionContentReference[palette] = {};
  }
  mkdir(getPaletteDir(palette));
};

/**
 * Pick color with hyprpicker
 */
const pickColor = async (): Promise<void> => {
  try {
    const palette = currentPalette.get();
    if (!palette) return;

    App.get_window(WINDOW_NAMES.UTILITY)?.set_visible(false);

    // Small delay to ensure window fully hides before hyprpicker launches
    await new Promise((resolve) => setTimeout(resolve, 100));

    const cmd = `hyprpicker --no-fancy --render-inactive --format=hex`;
    const output = await execAsync(cmd);

    if (isValidHexColor(output)) {
      const availableColors = utilityConfig.palettes[palette] || [];
      promptMixingInstructions(output, availableColors, palette);
    }

    App.get_window(WINDOW_NAMES.UTILITY)?.set_visible(true);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Handle response received from LLM
 */
const handleResponseReceived = (id: number, response: string) => {
  const palette = currentPalette.get();
  if (!palette) return;

  const color = colorsMixed[palette][id];
  const mixInstruction = instructionContentReference[palette][color];

  if (mixInstruction) {
    mixInstruction.set_markup(convertMarkdownToPangoMarkup(response));
    fileWrite(`${getPaletteDir(palette)}${color}`, response);
  }
};

/**
 * Prompt LLM for mixing instructions.
 */
const promptMixingInstructions = (
  color: string,
  existingColors: string[],
  palette: string,
) => {
  initializePalette(palette);

  // Clear placeholder widget if necessary
  if (colorsMixed[palette].length == 0) {
    const firstChild = allMixInstructions.get_first_child();
    if (firstChild) {
      allMixInstructions.remove(firstChild);
    }
  }

  // Add mix instruction with placeholder content while waiting for API response
  const placeholder = MixInstruction(color, `Mixing ${color}...`, palette);
  allMixInstructions.append(placeholder);

  colorsMixed[palette].push(color);
  const id = colorsMixed[palette].length - 1; // Prompt ID is index of color in palette's colorsMixed

  if (ENABLE_PROMPT) {
    geminiService.prompt(
      id,
      PROMPT_TEMPLATE(color, existingColors),
      handleResponseReceived,
    );
  }
};

/**
 * Clear all widget data for current palette.
 */
const clearCurrentPaletteData = (): void => {
  const palette = currentPalette.get();
  if (!palette) return;

  colorsMixed[palette] = [];
  instructionContentReference[palette] = {};
  clearChildren(allMixInstructions);
  deleteAllFilesFromDir(getPaletteDir(palette));
  allMixInstructions.append(Placeholder());
};

/**
 * Switch to a different palette
 */
const switchPalette = (newPalette: string): void => {
  currentPalette.set(newPalette);
  refreshMixInstructions();
};

/**
 * Refresh the mix instructions display for current palette
 */
const refreshMixInstructions = (): void => {
  const palette = currentPalette.get();
  if (!palette) return;

  initializePalette(palette);
  clearChildren(allMixInstructions);

  // Populate with either cached instructions or placeholder
  const cachedInstructions = Object.entries(
    readAllFilesFromDir(getPaletteDir(palette)),
  );

  if (cachedInstructions.length > 0) {
    cachedInstructions.forEach(([color, instructions]) => {
      const mixInstruction = MixInstruction(color, instructions, palette);
      allMixInstructions.append(mixInstruction);
      colorsMixed[palette].push(color);
    });
  } else {
    allMixInstructions.append(Placeholder());
  }
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
 * Palette selector dropdown
 */
const PaletteSelector = () => {
  const palettes = utilityConfig.palettes || {};
  const paletteNames = Object.keys(palettes);

  if (paletteNames.length === 0) {
    return Widget.Label({
      label: "No palettes configured",
      cssClasses: [CSS_CLASSES.PALETTE_SELECTOR],
    });
  }

  return Dropdown({
    cssClasses: [CSS_CLASSES.PALETTE_SELECTOR],
    model: Gtk.StringList.new(paletteNames),
    selected: Math.max(0, paletteNames.indexOf(currentPalette.get())),
    onSelectionChanged: (self) => {
      const selectedIndex = self.get_selected();
      const selectedPalette = paletteNames[selectedIndex];
      if (selectedPalette && selectedPalette !== currentPalette.get()) {
        switchPalette(selectedPalette);
      }
    },
  });
};

/**
 * Header bar
 */
const PaintMixerHeader = () => {
  const header = Widget.Label({
    label: "Paint mixer",
    cssClasses: [CSS_CLASSES.TITLE_TEXT],
  });

  const selections = Widget.CenterBox({
    orientation: Gtk.Orientation.HORIZONTAL,
    startWidget: Widget.Box({
      spacing: 12,
      children: [PaletteSelector()],
    }),
    endWidget: Widget.Box({
      spacing: 8,
      children: [
        Widget.Button({
          cursor: Gdk.Cursor.new_from_name("pointer", null),
          cssClasses: [CSS_CLASSES.CLEAR_BUTTON],
          label: "Clear",
          onButtonPressed: clearCurrentPaletteData,
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

  return Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.HEADER_CONTAINER],
    children: [header, selections],
  });
};

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
const MixInstruction = (
  color: string,
  instructions: string,
  palette: string,
): Gtk.Box => {
  const mixInstructionContent = Widget.Label({
    useMarkup: true,
    label: convertMarkdownToPangoMarkup(instructions),
    wrap: true,
  });

  initializePalette(palette);
  instructionContentReference[palette][color] = mixInstructionContent;

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

  // Initialize with current palette
  refreshMixInstructions();

  return allMixInstructions;
};

export const PaintMixer = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.CONTAINER],
    children: [PaintMixerHeader(), AllMixInstructions()],
  });
};
