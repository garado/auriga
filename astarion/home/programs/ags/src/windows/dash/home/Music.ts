import { Astal, Gtk, Widget, astalify } from "astal/gtk4";
import { bind } from "astal";
import { Visualizer } from "@/components/Visualizer";
import Mpris from "gi://AstalMpris";
import Gio from "gi://Gio?version=2.0";

const mpris = Mpris.get_default();
const Picture = astalify(Gtk.Picture);

/****************************************************
 * HELPERS
 ****************************************************/

/**
 * Convert track length from seconds to "MM:SS".
 *
 * @param {number} length - Track length in seconds
 * @returns {string} The converted track length.
 */
const lengthStr = (length: number): string => {
  const min = Math.floor(length / 60);
  const sec = Math.floor(length % 60).toFixed(2);
  return `${min}:${sec}`;
};

/**
 * @param {Mpris.Player} player - The player to represent.
 */
const MediaPlayer = (player: Mpris.Player) => {
  const Title = Widget.Label({
    cssClasses: ["title"],
    xalign: 0,
    label: player
      ? bind(player, "title").as((t) => t || "Unknown Track")
      : "Nothing playing.",
  });

  const Artist = Widget.Label({
    cssClasses: ["artist"],
    xalign: 0,
    label: player
      ? bind(player, "artist").as((a) => a || "Unknown Artist")
      : "It's quiet in here...",
  });

  const Info = Widget.Box({
    cssClasses: ["info"],
    vertical: true,
    children: [Title, Artist],
  });

  const Background = Picture({
    cssClasses: ["cover-art"],
    vexpand: true,
    hexpand: true,
    contentFit: Gtk.ContentFit.COVER,
    file: player
      ? bind(player, "coverArt").as((c) => Gio.File.new_for_path(`${c}`))
      : Gio.File.new_for_path(
          "/home/alexis/Github/dotfiles/astarion/home/programs/ags/src/assets/default-player-bg.jpg",
        ),
  });

  return Widget.Overlay({
    cssClasses: ["player"],
    child: Background,
    vexpand: true,
    hexpand: true,
    setup: (self) => {
      self.add_overlay(Info);
      self.add_overlay(
        Visualizer({
          bars: 20,
          barHeight: 1.5,
          smooth: true,
        }),
      );
    },
  });
};

/****************************************************
 * WIDGETS
 ****************************************************/

export const Music = () =>
  Widget.Box({
    cssClasses: ["player-container"],
    vertical: true,
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.CENTER,
    children: bind(mpris, "players").as((arr) => {
      return MediaPlayer(arr[0]);
    }),
  });
