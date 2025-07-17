/**
 * █▄░█ █▀█ ▀█▀ █ █▀▀ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█ █▀
 * █░▀█ █▄█ ░█░ █ █▀░ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█ ▄█
 *
 * Widget showing recent notifications.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { bind } from "astal";
import { Widget } from "astal/gtk4";
import { Notification } from "@/components/Notification";
import Nd from "gi://AstalNotifd";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const nd = Nd.get_default();

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export const Notifications = () =>
  Widget.Box({
    name: "notifications",
    cssClasses: ["notifications"],
    vertical: true,
    vexpand: false,
    hexpand: true,
    spacing: 20,
    children: [
      Widget.Label({
        cssClasses: ["section-header"],
        xalign: 0,
        label: "Notifications",
      }),
      Widget.Box({
        vertical: true,
        spacing: 10,
        children: bind(nd, "notifications").as((notifs) => {
          if (notifs.length > 0) {
            return notifs.map(Notification);
          } else {
            return [
              Widget.Label({
                xalign: 0,
                cssClasses: ["placeholder"],
                label: "No notifications.",
              }),
            ];
          }
        }),
      }),
    ],
  });
