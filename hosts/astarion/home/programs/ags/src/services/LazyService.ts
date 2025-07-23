import Wp from "gi://AstalWp";
import Battery from "gi://AstalBattery";
import Hyprland from "gi://AstalHyprland";

import Calendar from "./Calendar";
import Gemini from "./Gemini";
import Goals from "./Goals";
import Ledger from "./Ledger";
import SettingsManager from "./settings";
import Tasks from "./Tasks";

// services.ts - Just lazy getters
export const Services = {
  // Custom
  get calendar() {
    print("Calendar");
    return Calendar.get_default();
  },
  get gemini() {
    print("Gemini");
    return Gemini.get_default();
  },
  get goals() {
    print("Goals");
    return Goals.get_default();
  },
  get ledger() {
    print("Ledger");
    return Ledger.get_default();
  },
  get tasks() {
    print("Tasks");
    return Tasks.get_default();
  },
  get settings() {
    print("Settings");
    return SettingsManager.get_default();
  },

  // Astal
  get wp() {
    return Wp.get_default();
  },
  get hypr() {
    return Hyprland.get_default();
  },
  get bat() {
    return Battery.get_default();
  },
};
