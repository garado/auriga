/**
 * ▀█▀ █░█ █▀▀ █▀▄▀█ █▀▀
 * ░█░ █▀█ ██▄ █░▀░█ ██▄
 *
 * Set system theme.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Gio from "gi://Gio";
import { Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";
// import SettingsManager, {
//   Theme as ThemeInterface,
// } from "@/services/SettingsManager";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const Picture = astalify(Gtk.Picture);
const settings = SettingsManager.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Theme = (globalRevealerState: Variable<boolean>) => {
  const ThemeSelectButton = (themeName: string) =>
    Widget.Box({
      cssClasses: ["theme-switch-button"],
      vertical: true,
      halign: Gtk.Align.CENTER,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      valign: Gtk.Align.CENTER,
      children: [
        ThemePreviewImage(
          (settings.availableThemes as Record<string, ThemeInterface>)[
            themeName
          ].preview,
        ),
        ThemeInfoBar(themeName),
      ],
      onButtonPressed: () => {
        settings.currentTheme = themeName;
      },
    });

  const ThemePreviewImage = (file: string) =>
    Picture({
      cssClasses: ["preview-image"],
      hexpand: true,
      vexpand: true,
      setup: (self) => {
        self.set_file(Gio.File.new_for_path(file));
        self.set_content_fit(Gtk.ContentFit.CONTAIN);
        self.set_can_shrink(false);
      },
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
        visible: bind(settings, "currentTheme").as(
          (currentTheme: string) => currentTheme === themeName,
        ),
      }),
    });

  return ExpansionPanel({
    icon: "palette-symbolic",
    label: bind(settings, "currentTheme"),
    children: Object.keys(settings.availableThemes).map(ThemeSelectButton),
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 800,
  });
};
