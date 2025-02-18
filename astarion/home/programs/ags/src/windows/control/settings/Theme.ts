/* ▀█▀ █░█ █▀▀ █▀▄▀█ █▀▀ */
/* ░█░ █▀█ ██▄ █░▀░█ ██▄ */

import { Gtk, Gdk, Widget, astalify } from "astal/gtk4";
import { Variable, bind } from "astal";
import Gio from "gi://Gio";

import Settings from "@/services/Settings.ts";
import { ExpansionPanel } from "@/components/ExpansionPanel.js";

const Picture = astalify(Gtk.Picture);
const settings = Settings.get_default();

export const Theme = (globalRevealerState: Variable<boolean>) => {
  /**
   * Button to switch theme. Includes theme preview.
   */
  const ThemeButton = (themeName: string) =>
    Widget.Box({
      cssClasses: ["theme-switch-button"],
      vertical: true,
      halign: Gtk.Align.CENTER,
      cursor: Gdk.Cursor.new_from_name("pointer", null),
      valign: Gtk.Align.CENTER,
      children: [
        PreviewImage(settings.availableThemes[themeName].preview),
        ThemeInfoBar(themeName),
      ],
      onButtonPressed: () => {
        settings.currentTheme = themeName;
      },
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
        visible: bind(settings, "current-theme").as(
          (currentTheme: string) => currentTheme === themeName,
        ),
      }),
    });

  return ExpansionPanel({
    icon: "palette-symbolic",
    label: bind(settings, "current-theme"),
    children: Object.keys(settings.availableThemes).map(ThemeButton),
    vertical: true,
    globalRevealerState: globalRevealerState,
    maxDropdownHeight: 800,
  });
};
