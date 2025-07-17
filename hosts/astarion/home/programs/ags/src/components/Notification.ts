/**
 * █▄░█ █▀█ ▀█▀ █ █▀▀ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█
 * █░▀█ █▄█ ░█░ █ █▀░ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█
 *
 * Renders a single notification.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk, Widget } from "astal/gtk4";
import Nd from "gi://AstalNotifd";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Notification = (notif: Nd.Notification) => {
  // Top bar ---------------------------------------------
  const DismissBtn = Widget.Image({
    cssClasses: ["close-btn"],
    halign: Gtk.Align.START,
    iconName: "x-symbolic",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      notif.dismiss();
    },
  });

  const AppName = Widget.Label({
    xalign: 0,
    label: notif.appName,
  });

  const TopBar = Widget.CenterBox({
    hexpand: true,
    vexpand: true,
    cssClasses: ["top-bar"],
    startWidget: AppName,
    endWidget: DismissBtn,
  });

  // Content ---------------------------------------------
  const Summary = Widget.Label({
    xalign: 0,
    cssClasses: ["summary"],
    label: notif.summary,
  });

  const Body = Widget.Label({
    xalign: 0,
    label: notif.body,
  });

  const Content = Widget.Box({
    hexpand: true,
    vexpand: true,
    cssClasses: ["content"],
    vertical: true,
    children: [Summary, Body],
  });

  // Final -----------------------------------------------
  return Widget.Box({
    cssClasses: ["notification"],
    vertical: true,
    hexpand: true,
    vexpand: true,
    children: [TopBar, Content],
  });
};
