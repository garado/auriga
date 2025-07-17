/**
 * █▀▄▀█ █▀▀ ▀█▀ █▀█ █▀█ █▄░█ █▀█ █▄░█ █▀▀
 * █░▀░█ ██▄ ░█░ █▀▄ █▄█ █░▀█ █▄█ █░▀█ ██▄
 *
 * Metronome widget for whenever I want to play guitar.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Process, subprocess } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable } from "astal";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  metronome: "metronome",
  widgetHeader: "metronome-header",
  bpmEntry: "bpm-entry",
  bpmControl: "bpm-control",
  controlsContainer: "controls-container",
  playingState: "playing",
  stoppedState: "stopped",
} as const;

const METR_CFG = {
  defaultBpm: 60,
  minBpm: 30,
  maxBpm: 300,
  bpmAdjustStep: 5,
  maxBpmDigits: 3,
  clickFrequency: 440, // Hz for the click sound
  clickDuration: 0.05, // seconds
} as const;

const ICONS = {
  play: "media-playback-start-symbolic",
  pause: "media-playback-pause-symbolic",
  increase: "list-add-symbolic",
  decrease: "list-remove-symbolic",
} as const;

/*****************************************************************************
 * State management
 *****************************************************************************/

const metronomeState = {
  isPlaying: Variable(false),
  currentBpm: Variable(METR_CFG.defaultBpm),
} as const;

/*****************************************************************************
 * Utility functions
 *****************************************************************************/

/**
 * Validates and clamps BPM value to acceptable range.
 * @param bpm - BPM value to validate
 * @returns Clamped BPM value within valid range
 */
const validateBpm = (bpm: number): number => {
  const numericBpm = isNaN(bpm) ? METR_CFG.defaultBpm : bpm;
  return Math.max(
    METR_CFG.minBpm,
    Math.min(METR_CFG.maxBpm, Math.floor(numericBpm)),
  );
};

/**
 * Parses and validates BPM from string input.
 * @param bpmText - String representation of BPM
 * @returns Valid BPM number
 */
const parseBpmFromText = (bpmText: string): number => {
  const numericValue = parseInt(bpmText) || METR_CFG.defaultBpm;
  return validateBpm(numericValue);
};

/**
 * Formats BPM for display, ensuring it's within valid range.
 * @param bpm - BPM value to format
 * @returns Formatted BPM string
 */
const formatBpmForDisplay = (bpm: number): string => {
  return validateBpm(bpm).toString();
};

/**
 * Calculates the interval between metronome clicks.
 * @param bpm - Beats per minute
 * @returns Interval in seconds between clicks
 */
const calculateClickInterval = (bpm: number): number => {
  return 60 / bpm - METR_CFG.clickDuration;
};

/*****************************************************************************
 * Metronome control functions
 *****************************************************************************/

// Store the subprocess reference
let metronomeProcess: Process | null = null;

/**
 * Starts the metronome with the specified BPM.
 * @param bpm - Beats per minute for the metronome
 */
const startMetronome = (bpm: number): void => {
  stopMetronome();

  const validatedBpm = validateBpm(bpm);
  const clickInterval = calculateClickInterval(validatedBpm);

  // Construct command for generating metronome clicks
  const command = `bash -c "play -q -n -c1 synth ${METR_CFG.clickDuration} sine ${METR_CFG.clickFrequency} pad ${clickInterval} repeat -" > /dev/null 2>&1`;

  try {
    metronomeProcess = subprocess(
      command,
      () => {},
      (error) => {
        console.error("Metronome error:", error);
        handleMetronomeError();
      },
    );

    // Update state
    metronomeState.isPlaying.set(true);
    metronomeState.currentBpm.set(validatedBpm);
  } catch (error) {
    console.error("Failed to start metronome:", error);
    handleMetronomeError();
  }
};

/**
 * Stops the currently running metronome.
 */
const stopMetronome = (): void => {
  if (metronomeProcess) {
    try {
      metronomeProcess.kill();
    } catch (error) {
      console.error("Error stopping metronome:", error);
    }
    metronomeProcess = null;
  }

  metronomeState.isPlaying.set(false);
};

/**
 * Handles metronome errors by stopping playback and updating state.
 */
const handleMetronomeError = (): void => {
  stopMetronome();
  // Could show user notification here in the future
};

/**
 * Toggles metronome playback state.
 * @param bpm - BPM to use when starting (if currently stopped)
 */
const toggleMetronome = (bpm: number): void => {
  if (metronomeState.isPlaying.get()) {
    stopMetronome();
  } else {
    startMetronome(bpm);
  }
};

/**
 * Adjusts BPM by the specified amount and updates the metronome.
 * @param bpmEntry - BPM entry widget to update
 * @param adjustment - Amount to adjust BPM (positive or negative)
 */
const adjustBpm = (bpmEntry: any, adjustment: number): void => {
  const currentBpm = parseBpmFromText(bpmEntry.text);
  const newBpm = validateBpm(currentBpm + adjustment);

  bpmEntry.set_text(formatBpmForDisplay(newBpm));

  // If metronome is playing, restart with new BPM
  if (metronomeState.isPlaying.get()) {
    startMetronome(newBpm);
  }
};

/*****************************************************************************
 * Widget creation functions
 *****************************************************************************/

/**
 * Creates the BPM input entry widget.
 * @returns Widget for BPM input
 */
const createBpmEntry = () => {
  const bpmEntry = Widget.Entry({
    cssClasses: [CSS_CLASSES.bpmEntry],
    text: METR_CFG.defaultBpm.toString(),
    hexpand: true,
    xalign: 0.5,
    inputPurpose: Gtk.InputPurpose.NUMBER,
    maxLength: METR_CFG.maxBpmDigits,

    onNotifyText: (self) => {
      // Filter out non-numeric characters
      const filteredText = self.text.replace(/[^\d]/g, "");
      if (filteredText !== self.text) {
        self.set_text(filteredText);
        return;
      }

      // Stop metronome when user is typing
      if (metronomeState.isPlaying.get()) {
        stopMetronome();
      }
    },

    onActivate: (self) => {
      // Start metronome when user presses Enter
      const bpm = parseBpmFromText(self.text);
      self.set_text(formatBpmForDisplay(bpm));
      startMetronome(bpm);
    },
  });

  return bpmEntry;
};

/**
 * Creates the play/pause button widget.
 * @param bpmEntry - Reference to BPM entry for getting current value
 * @returns Widget for play/pause control
 */
const createPlayPauseButton = (bpmEntry: any) => {
  const playPauseButton = Widget.Image({
    cssClasses: [CSS_CLASSES.bpmControl],
    iconName: ICONS.play,
    cursor: Gdk.Cursor.new_from_name("pointer", null),

    onButtonPressed: () => {
      const bpm = parseBpmFromText(bpmEntry.text);
      toggleMetronome(bpm);
    },

    setup: (self) => {
      metronomeState.isPlaying.subscribe((isPlaying) => {
        if (isPlaying) {
          self.set_from_icon_name(ICONS.pause);
          self.add_css_class(CSS_CLASSES.playingState);
          self.remove_css_class(CSS_CLASSES.stoppedState);
        } else {
          self.set_from_icon_name(ICONS.play);
          self.add_css_class(CSS_CLASSES.stoppedState);
          self.remove_css_class(CSS_CLASSES.playingState);
        }
      });
    },
  });

  return playPauseButton;
};

/**
 * Creates the BPM increase button widget.
 * @param bpmEntry - Reference to BPM entry to update
 * @returns Widget for increasing BPM
 */
const createIncreaseButton = (bpmEntry: any) =>
  Widget.Image({
    cssClasses: [CSS_CLASSES.bpmControl],
    iconName: ICONS.increase,
    cursor: Gdk.Cursor.new_from_name("pointer", null),

    onButtonPressed: () => {
      adjustBpm(bpmEntry, METR_CFG.bpmAdjustStep);
    },
  });

/**
 * Creates the BPM decrease button widget.
 * @param bpmEntry - Reference to BPM entry to update
 * @returns Widget for decreasing BPM
 */
const createDecreaseButton = (bpmEntry: any) =>
  Widget.Image({
    cssClasses: [CSS_CLASSES.bpmControl],
    iconName: ICONS.decrease,
    cursor: Gdk.Cursor.new_from_name("pointer", null),

    onButtonPressed: () => {
      adjustBpm(bpmEntry, -METR_CFG.bpmAdjustStep);
    },
  });

/**
 * Creates the header widget for the metronome.
 * @returns Widget containing the metronome title
 */
const createMetronomeHeader = () =>
  Widget.Label({
    cssClasses: [CSS_CLASSES.widgetHeader],
    label: "Metronome",
  });

/**
 * Creates the controls container with all buttons.
 * @param bpmEntry - Reference to BPM entry
 * @returns Widget containing all control buttons
 */
const createControlsContainer = (bpmEntry: any) => {
  const decreaseButton = createDecreaseButton(bpmEntry);
  const playPauseButton = createPlayPauseButton(bpmEntry);
  const increaseButton = createIncreaseButton(bpmEntry);

  return Widget.Box({
    cssClasses: [CSS_CLASSES.controlsContainer],
    vertical: false,
    hexpand: true,
    halign: Gtk.Align.CENTER,
    spacing: 8,
    children: [decreaseButton, playPauseButton, increaseButton],
  });
};

/*****************************************************************************
 * Main component
 *****************************************************************************/

/**
 * Main metronome widget with enhanced functionality and proper state management.
 * Features input validation, keyboard support, and visual feedback.
 * @returns Widget containing the complete metronome interface
 */
export const Metronome = () => {
  const bpmEntry = createBpmEntry();
  const header = createMetronomeHeader();
  const controlsContainer = createControlsContainer(bpmEntry);

  return Widget.Box({
    cssClasses: [CSS_CLASSES.metronome],
    vertical: true,
    hexpand: true,
    spacing: 12,
    children: [header, bpmEntry, controlsContainer],

    setup: (self) => {
      self.connect("destroy", () => {
        stopMetronome();
      });
    },
  });
};
