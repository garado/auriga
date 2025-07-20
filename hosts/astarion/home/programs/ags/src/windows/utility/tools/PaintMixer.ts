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

import { execAsync } from "astal";
import { App, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";
import { ExpansionPanel } from "@/components/ExpansionPanel";
import Gemini from "@/services/Gemini";
import { convertMarkdownToPangoMarkup } from "@/utils/MarkdownToMarkup";
import { WINDOW_NAMES } from "app";
import { clearChildren, replaceChildAt } from "@/utils/BoxUtils";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const geminiService = Gemini.get_default();

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

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const contentRevealerState = Variable(false);

const colorsMixed: string[] = [];

let allMixInstructions: Gtk.Box;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Pick color with hyprpicker
 */
const pickColor = async (): Promise<void> => {
  try {
    const cmd = `hyprpicker --no-fancy --render-inactive --format=hex`;
    const selectedColor = await execAsync(cmd);
    promptMixingInstructions(selectedColor, []);
  } catch (error) {
    console.log(error);
  }
};

/**
 * @TODO not very efficient
 */
const handleResponseReceived = (id: number, response: string) => {
  const mixInstruction = MixInstruction(colorsMixed[id], response);
  replaceChildAt(allMixInstructions, id, mixInstruction);
};

/**
 * Prompt LLM for mixing instructions.
 */
const promptMixingInstructions = (color: string, existingColors: string[]) => {
  const existingColors_tmp = ["yellow", "cyan", "magenta", "black", "white"];

  const prompt = `
Provide paint mixing instructions for the color ${color} given that the \
following colors available: ${existingColors_tmp}

The instructions should be in the following format:

(color): (description of color)

- Base color: (base color)
- Then include a series of colors, adjustments to make to achieve desired color.

Then include tips for readjusting the color if too much of a component color is mixed. 

Be as concise as possible.
`;

  // Clear placeholder text if there
  if (colorsMixed.length == 0) {
    allMixInstructions.remove(allMixInstructions.get_first_child()!);
  }

  colorsMixed.push(color);

  // Add placeholder widget while waiting for API response
  const placeholder = MixInstruction(color, `Mixing ${color}...`);
  allMixInstructions.append(placeholder);

  const id = colorsMixed.length - 1;
  // geminiService.prompt(id, prompt, handleResponseReceived);
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
          cssClasses: [CSS_CLASSES.CLEAR_BUTTON],
          label: "Clear",
          onButtonPressed: () => {
            colorsMixed.length = 0;
            clearChildren(allMixInstructions);
            allMixInstructions.append(Placeholder());
          },
        }),
        Widget.Button({
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
const MixInstruction = (color: string, instructions: string) => {
  const mixInstruction = Widget.Label({
    useMarkup: true,
    label: convertMarkdownToPangoMarkup(instructions),
    wrap: true,
  });

  return ExpansionPanel({
    expandTabContent: MixInstructionTab(color),
    label: color,
    vertical: true,
    children: [mixInstruction],
    cssClasses: [CSS_CLASSES.MIX_INSTRUCTIONS],
    maxDropdownHeight: 400,
    globalRevealerState: contentRevealerState,
  });
};

/**
 * Container showing all stored colors.
 */
const AllMixInstructions = () => {
  allMixInstructions = Widget.Box({
    cssClasses: [CSS_CLASSES.MIX_INSTRUCTIONS_CONTAINER],
    vertical: true,
    spacing: 8,
    children: [Placeholder()],
  });

  return allMixInstructions;
};

export const PaintMixer = () => {
  return Widget.Box({
    vertical: true,
    cssClasses: [CSS_CLASSES.CONTAINER],
    children: [PaintMixerHeader(), AllMixInstructions()],
  });
};
