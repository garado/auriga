/**
 * ▀█▀ █ █▀▄▀█ █▀▀ █▀█
 * ░█░ █ █░▀░█ ██▄ █▀▄
 *
 * Simple little timer widget.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { AstalIO, bind, Gio, interval, Variable } from "astal";
import { astalify, Gdk, Gtk, Widget } from "astal/gtk4";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

/** Text of button which starts or stops the timer */
const timerActionText = Variable("Start");

/** Label showing time remaining in timer */
let timerLabel: Gtk.EditableLabel | null = null;

/** AstalIO.Time `interval` which will tick every second */
let timer: AstalIO.Time | null = null;

/** Time remaining in the timer */
let timeRemaining: number = 0;

/** For sending timer expiry notification */
const app = new Gio.Application({
  application_id: "org.auriga.timer",
  flags: Gio.ApplicationFlags.FLAGS_NONE,
});
app.register(null);

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/** Convert 1:00 (1 min) to 60 * 1000 (1 min in milliseconds) */
const timeStrToMs = (timeStr: string) => {
  const [min, sec] = timeStr.split(":");
  return parseInt(min) * 60 * 1000 + parseInt(sec) * 1000;
};

/** Convert milliseconds to MM:SS format */
const msToTimeStr = (time: number) => {
  const min = Math.trunc(time / (60 * 1000));
  const sec = Math.floor((time % (60 * 1000)) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

const startTimer = (timeoutMs: number) => {
  if (timeoutMs <= 0) return;

  timeRemaining = timeoutMs;

  timer = interval(1000, () => {
    timeRemaining -= 1000;
    timerLabel!.text = msToTimeStr(timeRemaining);

    if (timeRemaining <= 0) {
      stopTimer();
      onTimerExpired();
    }
  });

  timerActionText.set("Stop");
};

const stopTimer = () => {
  timer?.cancel();
  timer = null;
  timerActionText.set("Start");
};

const onTimerExpired = () => {
  const notification = new Gio.Notification();
  notification.set_title("Timer expired");
  notification.set_body("Your timer has expired.");
  notification.set_urgent(true);
  notification.set_priority(Gio.NotificationPriority.HIGH);
  app.send_notification(null, notification);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

export const Timer = () => {
  timerLabel = astalify(Gtk.EditableLabel)({
    cssClasses: ["time"],
    halign: Gtk.Align.CENTER,
    sensitive: bind(timerActionText).as((t) => t === "Start"), // disable editing when running
    setup: (self) => {
      self.text = "15:00";

      // Input validation
      self.connect("changed", (self) => {
        const text = self.get_text();
        const filtered = text.replace(/[^0-9:]/g, "");

        if (filtered !== text) {
          self.set_text(filtered);
        }
      });
    },
  });

  const timerStateBtn = Widget.Button({
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    cssClasses: ["state-ctrl"],
    vexpand: true,
    hexpand: true,
    child: Widget.Label({
      label: bind(timerActionText),
    }),
    onButtonPressed: () => {
      if (timer != null) {
        stopTimer();
      } else {
        startTimer(timeStrToMs(timerLabel!.get_text()));
      }
    },
  });

  return Widget.Box({
    cssClasses: ["timer"],
    vertical: true,
    vexpand: false,
    hexpand: true,
    children: [
      Widget.Label({
        cssClasses: ["header"],
        label: "Timer",
      }),
      timerLabel!,
      timerStateBtn,
    ],
  });
};
