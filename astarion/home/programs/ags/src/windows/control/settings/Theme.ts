/* ▀█▀ █░█ █▀▀ █▀▄▀█ █▀▀ */
/* ░█░ █▀█ ██▄ █░▀░█ ██▄ */

import { App, Astal, Gtk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";
import Gio from "gi://Gio";

import UserConfig from "../../../../userconfig.ts";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";
import userconfig from "../../../../userconfig.ts";

const Picture = astalify(Gtk.Picture);

export const Theme = (globalRevealerState: Variable<boolean>) => {
  /**
   * Button to switch theme.
   * Includes theme preview.
   */
  const ThemeButton = (themeName: string) =>
    Widget.Box({
      cssClasses: ["theme-switch-button"],
      vertical: true,
      halign: Gtk.Align.CENTER,
      valign: Gtk.Align.CENTER,
      children: [
        PreviewImage(UserConfig.themes[themeName].preview),
        ThemeInfoBar(themeName),
      ],
    });

  const PreviewImage = (file: string) =>
    Picture({
      cssClasses: ["preview-image"],
      hexpand: true,
      vexpand: true,
      file: Gio.File.new_for_path(file),
      contentFit: Gtk.ContentFit.CONTAIN,
      canShrink: false,
    });

  const ThemeInfoBar = (themeName: string) =>
    Widget.CenterBox({
      cssClasses: ["info-bar"],
      orientation: 0,
      startWidget: Widget.Label({
        label: themeName,
      }),
      endWidget: Widget.Image({
        iconName: "check-symbolic",
        visible: themeName === UserConfig.currentTheme,
      }),
    });

  return ExpansionPanel({
    icon: "palette-symbolic",
    label: "Theme",
    children: Object.keys(UserConfig.themes).map(ThemeButton),
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 800,
  });
};
