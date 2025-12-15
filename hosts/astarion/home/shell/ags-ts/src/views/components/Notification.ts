/**
 * █▄░█ █▀█ ▀█▀ █ █▀▀ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█
 * █░▀█ █▄█ ░█░ █ █▀░ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█
 *
 * Renders a single notification.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GLib } from "astal";
import { astalify, Gdk, Gtk, hook, Widget } from "astal/gtk4";
import Nd from "gi://AstalNotifd";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  CONTAINER: "notification", // Applied to entire widget

  NOTIFICATION_TITLE_CONTAINER: "top-bar",
  NOTIFICATION_CONTENT_CONTAINER: "content",

  NOTIFICATION_CLOSE_BTN: "close-btn",
  NOTIFICATION_SUMMARY: "summary",
  NOTIFICATION_BODY: "body",
  NOTIFICATION_TIMEOUT_BAR: "timeout-bar",
} as const;

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Notification = (notif: Nd.Notification) => {
  // Top bar ---------------------------------------------
  const DismissBtn = Widget.Image({
    cssClasses: [CSS_CLASSES.NOTIFICATION_CLOSE_BTN],
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
    cssClasses: [CSS_CLASSES.NOTIFICATION_TITLE_CONTAINER],
    startWidget: AppName,
    endWidget: DismissBtn,
  });

  // Content ---------------------------------------------
  const Summary = Widget.Label({
    cssClasses: [CSS_CLASSES.NOTIFICATION_SUMMARY],
    visible: notif.summary != "",
    xalign: 0,
    label: notif.summary,
  });

  const Body = Widget.Label({
    cssClasses: [CSS_CLASSES.NOTIFICATION_BODY],
    visible: notif.body != "",
    xalign: 0,
    label: notif.body,
    wrap: true,
    lines: 4,
  });

  const Content = Widget.Box({
    hexpand: true,
    vexpand: true,
    cssClasses: [CSS_CLASSES.NOTIFICATION_CONTENT_CONTAINER],
    vertical: true,
    children: [Summary, Body],
  });

  // Timeout bar -----------------------------------------
  const randomTimeoutBarColor = `accent-${Math.floor(Math.random() * 9) + 1}`;
  const TimeoutBar = astalify(Gtk.ProgressBar)({
    cssClasses: [CSS_CLASSES.NOTIFICATION_TIMEOUT_BAR, randomTimeoutBarColor],
    visible: notif.expireTimeout != -1,
    setup: (self) => {
      if (notif.expireTimeout == -1) return;

      // Periodically update the timeout progress bar
      self.set_fraction(1);
      const startTime = Date.now();
      const timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30, () => {
        const timeoutProgress = (Date.now() - startTime) / notif.expireTimeout;
        self.set_fraction(1 - timeoutProgress);
        return timeoutProgress >= 1 ? GLib.SOURCE_REMOVE : GLib.SOURCE_CONTINUE;
      });

      // Delete timer when notif is resolved
      hook(self, notif, "resolved", () => {
        GLib.source_remove(timerId);
      });
    },
  });

  // Final -----------------------------------------------
  return Widget.Box({
    cssClasses: [CSS_CLASSES.CONTAINER],
    vertical: true,
    hexpand: true,
    vexpand: true,
    children: [TopBar, Content, TimeoutBar],
  });
};
