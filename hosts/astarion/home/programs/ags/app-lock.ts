/**
 * █░░ █▀█ █▀▀ █▄▀ █▀ █▀▀ █▀█ █▀▀ █▀▀ █▄░█
 * █▄▄ █▄█ █▄▄ █░█ ▄█ █▄▄ █▀▄ ██▄ ██▄ █░▀█
 *
 * Lockscreen using gtk3-session-lock (gtk3! not 4!) and Astal.Auth.
 * Note: the lockscreen app is completely separate from the rest of the shell.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Lock from "gi://GtkSessionLock";
import Gdk from "gi://Gdk?version=3.0";
import Gtk from "gi://Gtk?version=3.0";
import AstalAuth from "gi://AstalAuth";
import { bind, exec, execAsync, GLib, Variable } from "astal";
import { App, Widget } from "astal/gtk3";

/*****************************************************************************
 * Interfaces
 *****************************************************************************/

type LockWindowInfo = {
  window: Gtk.Window;
  monitor: Gdk.Monitor;
};

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const prompt = Variable("");
const inputVisible = Variable(false);
const inputNeeded = Variable(false);

const auth = new AstalAuth.Pam();

const windows: LockWindowInfo[] = [];

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Unlock.
 */
const unlockSession = () => {
  lock.unlock_and_destroy();
  windows.forEach((w) => w.window.destroy());
  Gdk.Display.get_default()?.sync();

  // Launch actual config
  const cmd = `ags run ${SRC}/app.ts --gtk4`;
  execAsync(cmd).then(() => {
    App.quit();
  });
};

/**
 * Lock.
 */
const lockSession = () => {
  const display = Gdk.Display.get_default();
  if (display === null) return;

  // Attach a LockWindow to every monitor
  for (let m = 0; m < display.get_n_monitors(); m++) {
    const monitor = display.get_monitor(m);
    if (monitor) createWindow(monitor);
  }

  // Attach a LockWindow to any new monitors that get connected
  display?.connect("monitor-added", (_disp, monitor) => {
    const w = createWindow(monitor);
    lock.new_surface(w.window, w.monitor);
    w.window.show();
  });

  lock.lock_lock();

  windows.map((w) => {
    lock.new_surface(w.window, w.monitor);
    w.window.show();
  });
};

/** Create a LockWindow on a given monitor */
const createWindow = (monitor: Gdk.Monitor) => {
  const window = LockWindow();
  const win = { window, monitor };
  windows.push(win);
  return win;
};

/** After authentication is complete, kill this app. */
const onUnlockFinished = () => {
  console.log("wat");
  lock.destroy();
  windows.forEach((w) => w.window.destroy());
  Gdk.Display.get_default()?.sync();

  // Launch actual config
  try {
    const cmd = `ags run ${SRC}/app.ts --gtk4`;
    console.log(cmd);
    exec(cmd);
  } catch (e) {
    console.log(e);
  }

  App.quit();
};

/*****************************************************************************
 * Signal setup
 *****************************************************************************/

auth.connect("auth-prompt-visible", (_auth, msg) => {
  prompt.set(msg);
  inputVisible.set(true);
  inputNeeded.set(true);
});

auth.connect("auth-prompt-hidden", (_auth, msg) => {
  prompt.set(msg);
  inputVisible.set(false);
  inputNeeded.set(true);
});

auth.connect("success", unlockSession);

auth.connect("fail", (p, msg) => {
  auth.start_authenticate();
});

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const Notif = (msg, type) => {
  const notif = new Widget.Box({
    class_name: `auth-notif ${type}`,
    children: [
      new Widget.Label({
        label: msg,
        max_width_chars: 25,
        wrap: true,
      }),
    ],
  });

  const revealer = new Widget.Revealer({
    child: notif,
    halign: Gtk.Align.END,
    transition: "slide_left",
    transition_duration: 250,
    reveal_child: true,
  });

  // Utils.timeout(20000, () => {
  //   revealer.reveal_child = false;
  //   Utils.timeout(revealer.transition_duration, () => {
  //     revealer.destroy();
  //   });
  // });
  // Utils.idle(() => {
  //   revealer.reveal_child = true;
  // });
  return revealer;
};

const AuthNotifs = () =>
  new Widget.Box({
    halign: Gtk.Align.END,
    valign: Gtk.Align.START,
    vertical: true,
  })
    .hook(
      auth,
      (self, msg) => {
        if (!msg) return;
        self.add(Notif(msg, "error"));
        self.show_all();
        auth.supply_secret(null);
      },
      "auth-error",
    )
    .hook(
      auth,
      (self, msg) => {
        if (!msg) return;
        self.add(Notif(msg, "info"));
        self.show_all();
        auth.supply_secret(null);
      },
      "auth-info",
    )
    .hook(
      auth,
      (self, msg) => {
        if (!msg) return;
        self.add(Notif(msg, "fail"));
        self.show_all();
      },
      "fail",
    );

const lock = Lock.prepare_lock();

// const Right = () =>
//   new Widget.Box({
//     halign: Gtk.Align.END,
//     children: [
//       RoundedAngleEnd("topleft", { class_name: "angle", hexpand: true }),
//       Clock(),
//     ],
//   });
//
// const Left = () =>
//   new Widget.Box({
//     children: [
//       SessionBox(),
//       RoundedAngleEnd("topright", { class_name: "angle" }),
//     ],
//   });
//
// const Bar = () =>
//   new Widget.CenterBox({
//     start_widget: Left(),
//     end_widget: Right(),
//   });

const LoginBox = () =>
  new Widget.Box({
    children: [
      new Widget.Overlay({
        hexpand: true,
        vexpand: true,
        child: new Widget.Box({
          vertical: true,
          halign: Gtk.Align.CENTER,
          valign: Gtk.Align.CENTER,
          spacing: 16,
          children: [
            new Widget.Box({
              halign: Gtk.Align.CENTER,
              class_name: "avatar",
            }),
            new Widget.Box({
              // class_name: inputNeeded
              //   .bind()
              //   .as((n) => `entry-box ${n ? "" : "hidden"}`),
              vertical: true,
              children: [
                new Widget.Label({
                  // label: bind(prompt),
                  label: "prompt?",
                }),
                new Widget.Entry({
                  halign: Gtk.Align.CENTER,
                  xalign: 0.5,
                  visibility: bind(inputVisible),
                  sensitive: bind(inputNeeded),
                  onActivate: (self) => {
                    inputNeeded.set(false);
                    auth.supply_secret(self.text);
                    self.text = "";
                  },
                  setup: (self) => {
                    self.connect("realize", () => {
                      self.grab_focus();
                    });
                  },
                }),
              ],
            }),
          ],
        }),
        overlays: [],
      }),
    ],
  });

const LockWindow = () =>
  new Gtk.Window({
    child: new Widget.Box({
      children: [
        new Widget.Revealer({
          reveal_child: true,
          transition: "crossfade",
          transition_duration: 500,
          child: new Widget.Box({
            class_name: "lock-container",
            vertical: true,
            children: [
              new Widget.Label({
                label: "fucking help me",
              }),
              LoginBox(),
            ],
          }),
        }),
      ],
    }),
  });

/*****************************************************************************
 * Main
 *****************************************************************************/

App.start({
  instanceName: "lock",
  main: () => {
    // lock.connect("finished", onUnlockFinished);
    lockSession();
    auth.start_authenticate();
  },
});
