import { bind, execAsync, Variable } from "astal";
import { App, Gdk, Gtk, Widget } from "astal/gtk4";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import Pango from "gi://Pango?version=1.0";

const hyprland = AstalHyprland.get_default();

const windowKillTarget = Variable<AstalHyprland.Client | null>(null);

const WindowEntry = (window: AstalHyprland.Client) => {
  const displayTitle = window.title || window.class || "Untitled";
  const displayClass = window.class || "Unknown";
  const workspaceInfo = `${window.workspace?.id || 0}`;

  const content = Widget.Box({
    vertical: false,
    spacing: 8,
    children: [
      Widget.Label({
        cssClasses: ["workspace-indicator"],
        label: workspaceInfo,
      }),
      ...(window.floating
        ? [
            Widget.Image({
              iconName: "browsers-symbolic",
              cssClasses: ["window-indicator", "floating"],
            }),
          ]
        : []),
      ...(window.fullscreen
        ? [
            Widget.Image({
              iconName: "corners-out-symbolic",
              cssClasses: ["window-indicator", "fullscreen"],
            }),
          ]
        : []),
      Widget.Box({
        vertical: true,
        hexpand: true,
        halign: Gtk.Align.FILL,
        children: [
          Widget.Label({
            label: `${displayClass} - ${displayTitle}`,
            justify: Gtk.Justification.LEFT,
            halign: Gtk.Align.START,
            hexpand: true,
            ellipsize: Pango.EllipsizeMode.END,
            cssClasses: ["window-title"],
          }),
        ],
      }),
    ],
  });

  const confirmationRevealer = Widget.Revealer({
    transitionType: Gtk.RevealerTransitionType.SLIDE_LEFT,
    revealChild: bind(windowKillTarget).as(
      (target: AstalHyprland.Client) => target === window,
    ),
    child: Widget.Image({
      iconName: "x-symbolic",
      cssClasses: ["close-icon"],
    }),
  });

  return Widget.Button({
    cssClasses: ["result", "window-entry"],
    hexpand: true,
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.CenterBox({
      startWidget: content,
      endWidget: confirmationRevealer,
      setup: (self) => {
        self.orientation = Gtk.Orientation.HORIZONTAL;
      },
    }),
    onClicked: () => focusWindow(window),
    onFocusLeave: () => {
      if (windowKillTarget.get() != null) windowKillTarget.set(null);
    },
    onKeyPressed: (_self, keyval, _keycode, state) => {
      const ctrlPressed = (state & Gdk.ModifierType.CONTROL_MASK) !== 0;

      if (ctrlPressed && keyval === Gdk.KEY_c) {
        // CTRL+C - show close confirmation
        windowKillTarget.set(window);
        return true;
      }

      if (windowKillTarget.get() === window && keyval === Gdk.KEY_Return) {
        // Enter pressed while close confirmation is showing - kill the window
        try {
          execAsync(["kill", "-9", window.pid.toString()]);
          windowKillTarget.set(null);
        } catch (error) {
          console.error("Failed to kill window:", error);
        }
        return true;
      }

      if (keyval === Gdk.KEY_Escape) {
        // Escape - cancel close confirmation
        windowKillTarget.set(null);
        return true;
      }

      if (keyval === Gdk.KEY_Return) {
        focusWindow(window);
      }
    },
  });
};

// Get all visible windows from Hyprland
// Get all visible windows from Hyprland
const getAllWindows = (): AstalHyprland.Client[] => {
  return hyprland.clients
    .filter((window) => window.mapped && !window.hidden)
    .sort((a, b) => {
      // First sort by monitor
      if (a.monitor !== b.monitor) {
        return a.monitor - b.monitor;
      }

      // Then sort by workspace ID
      const aWorkspace = a.workspace?.id || 0;
      const bWorkspace = b.workspace?.id || 0;
      if (aWorkspace !== bWorkspace) {
        return aWorkspace - bWorkspace;
      }

      // Finally sort by class then title (your original sorting)
      if (a.class !== b.class) {
        return a.class.localeCompare(b.class);
      }
      return a.title.localeCompare(b.title);
    });
};

// Initialize with current windows
const allWindows = Variable(getAllWindows());

// Reactive window results
export const windowResults = Variable(getAllWindows());

// Reactive widget list
export const windowResultWidgets = Variable.derive([windowResults], (windows) =>
  windows.map(WindowEntry),
);

// Update search results
export const updateWindowSearch = (query: string) => {
  const filtered = allWindows.get().filter((window) => {
    const searchText = `${window.title} ${window.class}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });
  windowResults.set(filtered);
};

const focusWindow = (window: AstalHyprland.Client) => {
  App.toggle_window("launcher");
  window.focus();
};

export const focusFirstWindow = () => {
  const windows = windowResults.get();
  if (windows.length > 0) {
    focusWindow(windows[0]);
  }
};

const updateWindowList = () => {
  const windows = getAllWindows();
  allWindows.set(windows);
  windowResults.set(windows);
};

// Connect to Hyprland events to keep the list updated
hyprland.connect("client-added", updateWindowList);
hyprland.connect("client-removed", updateWindowList);
hyprland.connect("workspace-added", updateWindowList);
hyprland.connect("workspace-removed", updateWindowList);

// Also listen for window property changes
hyprland.clients.forEach((client) => {
  client.connect("notify::title", updateWindowList);
  client.connect("notify::class", updateWindowList);
  client.connect("notify::workspace", updateWindowList);
  client.connect("notify::mapped", updateWindowList);
  client.connect("notify::hidden", updateWindowList);
  client.connect("notify::floating", updateWindowList);
  client.connect("notify::fullscreen", updateWindowList);
});

// Refresh function (mainly for manual refresh if needed)
export const refreshWindows = () => {
  updateWindowList();
};
