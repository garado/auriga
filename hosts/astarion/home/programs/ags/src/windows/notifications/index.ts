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
import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk4";
import { Notification } from "@/components/Notification";
import Nd from "gi://AstalNotifd";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const nd = Nd.get_default();

/** References to notification widgets. Stored for easy widget destruction. */
const references: Record<number, Gtk.Revealer> = {};

/*****************************************************************************
 * Constants
 *****************************************************************************/

const NOTIF_REVEAL_TIMEOUT = 200;

const CSS_CLASSES = {
  NOTIFICATION_WINDOW: "notification-window",
} as const;

/*****************************************************************************
 * Widgets
 *****************************************************************************/

const NotifRevealWrapper = (notif: Nd.Notification) =>
  Widget.Revealer({
    child: Notification(notif),
    transitionDuration: NOTIF_REVEAL_TIMEOUT,
    transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
    revealChild: false,
  });

const Notifications = () =>
  Widget.Box({
    name: "notifications",
    cssClasses: [CSS_CLASSES.NOTIFICATION_WINDOW],
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
      nd.connect("resolved", (_, id) => {
        references[id].revealChild = false;
        timeout(200, () => {
          self.remove(references[id]);
          delete references[id];
        });
      });
    },
  });

/*****************************************************************************
 * Export
 *****************************************************************************/

export default (monitor: Gdk.Monitor) => {
  const { TOP, RIGHT } = Astal.WindowAnchor;

  return Widget.Window({
    application: App,
    name: "notifications",
    cssName: "notifications-window",
    keymode: Astal.Keymode.NONE,
    anchor: TOP | RIGHT,
    visible: bind(nd, "notifications").as((n) => n.length > 0),
    child: Notifications(),
    gdkmonitor: monitor,
    setup: (self) => {
      /* Workaround for revealer bug.
       * https://github.com/wmww/gtk4-layer-shell/issues/60 */
      self.set_default_size(1, 1);
    },
  });
};
