/* ▀█▀ █░█ █▀▀ █▀▄▀█ █▀▀ */
/* ░█░ █▀█ ██▄ █░▀░█ ██▄ */

import { App, Astal, Gtk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";

import UserConfig from "../../../userconfig.js";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";

export const Theme = (globalRevealerState: Variable<boolean>) => {
  return ExpansionPanel({
    icon: "palette-symbolic",
    label: "Theme",
    children: [Widget.Label({ label: "test" })],
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 200,
  });
};
