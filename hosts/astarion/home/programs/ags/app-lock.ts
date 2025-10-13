/**
 * █░░ █▀█ █▀▀ █▄▀ █▀ █▀▀ █▀█ █▀▀ █▀▀ █▄░█
 * █▄▄ █▄█ █▄▄ █░█ ▄█ █▄▄ █▀▄ ██▄ ██▄ █░▀█
 *
 * Lockscreen using gtk3-session-lock (gtk3! not 4!) and Astal.Auth.
 * Note: the lockscreen app is completely separate from the rest of the shell.
 * Could not get this to work with Gtk4 unfortunately.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import Lock from "gi://GtkSessionLock";
import Gdk from "gi://Gdk?version=3.0";
import Gtk from "gi://Gtk?version=3.0";
import AstalAuth from "gi://AstalAuth";
import { bind, exec, execAsync, Gio, Variable } from "astal";
import { App, Widget } from "astal/gtk3";
import SettingsManager from "@/services/settings";

/*****************************************************************************
 * Constants/interfaces
 *****************************************************************************/

const SASS_PATH = `${SRC}/src/styles/lock.sass`;

const CSS_PATH = `/tmp/ags/lock-style.css`;

const userConfig = require("userconfig.ts").UserConfig;

const CSS_CLASSES = {
  LOCK_CONTAINER: "lock-container",
  GREETING: "greeting",
  PASSWORD_PROMPT: "password-prompt",
  PROFILE_PICTURE: "profile-picture",
} as const;

type LockWindowInfo = {
  window: Gtk.Window;
  monitor: Gdk.Monitor;
};

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const promptText = Variable("");

const inputVisible = Variable(false);
const inputNeeded = Variable(false);

const auth = new AstalAuth.Pam();

const lock = Lock.prepare_lock();

const windows: LockWindowInfo[] = [];

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Unlock session.
 */
const unlockSession = () => {
  lock.unlock_and_destroy();
  windows.forEach((w) => w.window.destroy());

  Gdk.Display.get_default()?.sync();

  // Launch actual config
  execAsync(`ags run ${SRC}/app.ts --gtk4`);
  App.quit();
};

/**
 * Lock session.
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

/**
 * Create a LockWindow on a given monitor and store the window:monitor pairing information
 */
const createWindow = (monitor: Gdk.Monitor) => {
  const window = LockWindow();
  const win = { window, monitor };
  windows.push(win);
  return win;
};

const compileSASS = () => {
  exec(`sass ${SASS_PATH} ${CSS_PATH}`);
};

/*****************************************************************************
 * Signal setup
 *****************************************************************************/

auth.connect("auth-prompt-visible", (_auth, msg) => {
  promptText.set(msg);
  inputVisible.set(true);
  inputNeeded.set(true);
});

auth.connect("auth-prompt-hidden", (_auth, msg) => {
  promptText.set(msg);
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

/** Shows password entry, password entry status, and user profile */
const LoginBox = () => {
  const ProfilePicture = new Widget.Box({
    className: CSS_CLASSES.PROFILE_PICTURE,
    vexpand: true,
    hexpand: true,
    css: `background-image: url('${userConfig.dashHome.profile.pfp}');`,
  });

  const ProfileName = new Widget.Label({
    label: userConfig.dashHome.profile.name,
  });

  const PasswordEntry = new Widget.Entry({
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
  });

  return new Widget.Box({
    vertical: true,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    hexpand: true,
    vexpand: true,
    spacing: 16,
    children: [ProfilePicture, ProfileName, PasswordEntry],
  });
};

const LockWindow = () => {
  return new Gtk.Window({
    child: new Widget.Box({
      children: [
        new Widget.Revealer({
          reveal_child: true,
          transitionType: Gtk.RevealerTransitionType.CROSSFADE,
          transition_duration: 500,
          child: new Widget.Box({
            className: CSS_CLASSES.LOCK_CONTAINER,
            vertical: true,
            children: [LoginBox()],
          }),
        }),
      ],
    }),
  });
};

/*****************************************************************************
 * Main
 *****************************************************************************/

compileSASS();

App.start({
  instanceName: "lock",
  css: CSS_PATH,
  main: () => {
    lockSession();
    auth.start_authenticate();
  },
});
