/**
 * █▄░█ █▀█ ▀█▀ █ █▀▀ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█ █▀
 * █░▀█ █▄█ ░█░ █ █▀░ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█ ▄█
 *
 * On-screen display for notifications.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { bind, timeout } from "astal";
import { App, Astal, Gtk, Widget } from "astal/gtk4";
import { Notification } from "@/views/components/Notification";
import Nd from "gi://AstalNotifd";
import AstalHyprland from "gi://AstalHyprland?version=0.1";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const nd = Nd.get_default();

/** References to notification widgets. Stored for easy widget destruction. */
const references: Record<number, Gtk.Revealer> = {};

/*****************************************************************************
 * Constants
 *****************************************************************************/

const NOTIF_REVEAL_DURATION_MS = 150;

const CSS_CLASSES = {
  NOTIFICATION_WINDOW: "notification-window",
} as const;

/*****************************************************************************
 * Widgets
 *****************************************************************************/

const NotifRevealWrapper = (notif: Nd.Notification) =>
  Widget.Revealer({
    child: Notification(notif),
    transitionDuration: NOTIF_REVEAL_DURATION_MS,
    transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
    revealChild: false,
    vexpand: false,
  });

const Notifications = () =>
  Widget.Box({
    name: "notifications",
    cssClasses: [CSS_CLASSES.NOTIFICATION_WINDOW],
    homogeneous: false,
    vertical: true,
    vexpand: false,
    hexpand: true,
    spacing: 20,
    setup: (self) => {
      // Create
      nd.connect("notified", (_, id: number) => {
        if (!nd.dontDisturb) {
          const n = nd.get_notification(id);
          const widget = NotifRevealWrapper(n);
          references[id] = widget;
          self.append(widget);
          widget.revealChild = true;
        }
      });

      // Destroy
      nd.connect("resolved", (_, id: number) => {
        const widget = references[id];
        if (!widget) return;

        widget.revealChild = false;
        timeout(NOTIF_REVEAL_DURATION_MS, () => {
          if (references[id] === widget) {
            self.remove(widget);
            delete references[id];
          }
        });
      });
    },
  });

/*****************************************************************************
 * Export
 *****************************************************************************/

export default (monitor: AstalHyprland.Monitor) => {
  const { TOP, RIGHT } = Astal.WindowAnchor;

  return Widget.Window({
    application: App,
    name: "notifications",
    cssName: "notifications-window",
    keymode: Astal.Keymode.NONE,
    anchor: TOP | RIGHT,
    visible: bind(nd, "notifications").as((n) => n.length > 0),
    child: Notifications(),
    monitor: monitor.id,
    setup: (self) => {
      // Set to full monitor height to prevent window resizing when new notifs are added,
      // which causes weird UI behavior
      self.set_default_size(1, monitor.height);
    },
  });
};
