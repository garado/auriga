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
import { bind, exec, execAsync, timeout, Variable } from "astal";
import { App, Widget } from "astal/gtk3";
import SettingsManager from "@/services/settings";

const settings = SettingsManager.get_default();

/*****************************************************************************
 * Constants/interfaces
 *****************************************************************************/

const SASS_PATH = `${SRC}/src/styles/lock.sass`;

const CSS_PATH = `/tmp/ags/lock-style.css`;

const CSS_CLASSES = {
  LOCK_CONTAINER: "lock-container",

  GREETING: "greeting",

  // Login box
  PASSWORD_PROMPT: "password-prompt",
  PROFILE_PICTURE: "profile-picture",
  PROFILE_NAME: "profile-name",

  // Clock
  DATETIME_CONTAINER: "datetime",
  DATE: "date",
  TIME: "time",
} as const;

type LockWindowInfo = {
  window: Gtk.Window;
  monitor: Gdk.Monitor;
};

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const userConfig = require("userconfig.ts").UserConfig;

const promptText = Variable("");

const inputVisible = Variable(false);
const inputNeeded = Variable(false);

let auth = new AstalAuth.Pam();

let sessionLock = Lock.prepare_lock();

let windows: LockWindowInfo[] = [];

// For clock widget
const time = Variable("").poll(1000, "date '+%H:%M'");
const date = Variable("").poll(1000, "date '+%A %d %B %Y'");

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Lock session.
 */
const lockSession = () => {
  sessionLock = Lock.prepare_lock();

  auth = new AstalAuth.Pam();
  initAuth(auth);

  const display = Gdk.Display.get_default();
  if (display === null) return;

  windows = [];

  for (let m = 0; m < display.get_n_monitors(); m++) {
    const monitor = display.get_monitor(m);
    if (monitor) createWindow(monitor);
  }

  display?.connect("monitor-added", (_disp, monitor) => {
    const w = createWindow(monitor);
    sessionLock.new_surface(w.window, w.monitor);
    w.window.show();
  });

  sessionLock.lock_lock();

  windows.forEach((w) => {
    sessionLock.new_surface(w.window, w.monitor);
    w.window.show();
  });
};

/**
 * Unlock session.
 */
const unlockSession = () => {
  sessionLock.unlock_and_destroy();
  windows.forEach((w) => w.window.destroy());
  windows = [];

  Gdk.Display.get_default()?.sync();

  auth = null;
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

const initAuth = (thisAuth: AstalAuth.Pam) => {
  thisAuth.connect("auth-prompt-visible", (_auth, msg) => {
    promptText.set(msg);
    inputVisible.set(true);
    inputNeeded.set(true);
  });

  thisAuth.connect("auth-prompt-hidden", (_auth, msg) => {
    promptText.set(msg);
    inputVisible.set(false);
    inputNeeded.set(true);
  });

  thisAuth.connect("success", unlockSession);

  thisAuth.connect("fail", (p, msg) => {
    auth.start_authenticate();
  });

  thisAuth.start_authenticate();
};

const compileSASS = () => {
  exec(`sass ${SASS_PATH} ${CSS_PATH}`);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

const Background = () => {
  return new Widget.Box({
    className: "background-img",
    css: `
      background-image: url('${SRC}/assets/defaults/theme/lockscreen/mountain.jpg');
      background-size: cover;
      background-position: center;
    `,
    hexpand: true,
    vexpand: true,
    children: [],
  });
};

const DateTime = () =>
  new Widget.Box({
    className: CSS_CLASSES.DATETIME_CONTAINER,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    vexpand: false,
    hexpand: true,
    vertical: true,
    children: [
      new Widget.Label({
        className: CSS_CLASSES.TIME,
        label: bind(time),
      }),
      new Widget.Label({
        className: CSS_CLASSES.DATE,
        label: bind(date),
      }),
    ],
  });

/** Shows password entry, password entry status, and user profile */
const LoginBox = () => {
  const ProfilePicture = new Widget.Box({
    className: CSS_CLASSES.PROFILE_PICTURE,
    vexpand: false,
    hexpand: true,
    css: `background-image: url('${userConfig.dashHome.profile.pfp}');`,
  });

  const ProfileName = new Widget.Label({
    className: CSS_CLASSES.PROFILE_NAME,
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
    vexpand: false,
    spacing: 16,
    children: [ProfilePicture, ProfileName, PasswordEntry],
  });
};

const LockWindow = () => {
  const content = new Widget.Box({
    vertical: true,
    vexpand: true,
    hexpand: true,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    spacing: 50,
    children: [DateTime(), LoginBox()],
  });

  const Overlay = new Widget.Overlay({
    child: Background(),
    overlays: [content],
  });

  const win = new Gtk.Window({
    child: new Widget.Box({
      className: CSS_CLASSES.LOCK_CONTAINER,
      children: [Overlay],
      css: "opacity: 0; background-color: #000000",
      setup: (self) => {
        timeout(5, () => {
          self.css = `transition: opacity 50ms; opacity: 1; background-color: #000000`;
        });
      },
    }),
  });

  win.get_style_context().add_class("fuck");

  return win;
};

/*****************************************************************************
 * Main
 *****************************************************************************/

compileSASS();

App.start({
  instanceName: "lock",
  css: CSS_PATH,
  requestHandler(request: string, res: (response: any) => void) {
    const [command, ..._args] = request.split(" ");

    if (command == "lock") {
      lockSession();
      return;
    }

    res("Unhandled command");
  },
  main: () => {
    lockSession();
  },
});
