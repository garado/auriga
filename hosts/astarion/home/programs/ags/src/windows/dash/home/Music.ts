/**
 * █▀▄▀█ █░█ █▀ █ █▀▀
 * █░▀░█ █▄█ ▄█ █ █▄▄
 *
 * playerctl
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { bind } from "astal";
import { Visualizer, VisualizerStyle } from "@/components/Visualizer";
import Mpris from "gi://AstalMpris";
import Gio from "gi://Gio?version=2.0";
import Pango from "gi://Pango?version=1.0";

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const mpris = Mpris.get_default();
const Picture = astalify(Gtk.Picture);

const DEFAULT_COVER_ART_PATH = `${SRC}/assets/defaults/player-idle.jpg`;

const DEFAULT_BAR_HEIGHT = 1.5;
const DEFAULT_BAR_COUNT = 60;

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Convert track length from seconds to "MM:SS".
 *
 * @param {number} length - Track length in seconds
 * @returns {string} The converted track length.
 */
const lengthStr = (length: number): string => {
  const min = Math.floor(length / 60);
  const sec = Math.floor(length % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
};

/**
 * Get path for cover art to display.
 * @returns Gio.File for the cover art image
 */
const getFileForCoverArt = (coverArt: string | null): Gio.File => {
  const path = coverArt || DEFAULT_COVER_ART_PATH;
  return Gio.File.new_for_path(path);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * @param {Mpris.Player} player The media player to represent.
 */
const MediaPlayer = (player: Mpris.Player) => {
  const Title = Widget.Label({
    cssClasses: ["title"],
    xalign: 0,
    ellipsize: Pango.EllipsizeMode.END,
    maxWidthChars: 30,
    label: player
      ? bind(player, "title").as((t) => t || "Unknown Track")
      : "Nothing playing.",
  });

  const Artist = Widget.Label({
    cssClasses: ["artist"],
    xalign: 0,
    ellipsize: Pango.EllipsizeMode.END,
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
    setup: (self) => {
      self.set_content_fit(Gtk.ContentFit.COVER);

      // Set cover art
      if (player != null) {
        // Set initial file
        self.set_file(getFileForCoverArt(player.coverArt));

        // Update reactively
        hook(self, player, "notify::cover-art", () => {
          self.set_file(getFileForCoverArt(player.coverArt));
        });
      } else {
        self.set_file(getFileForCoverArt(null));
      }
    },
  });

  return Widget.Overlay({
    cssClasses: ["player"],
    child: Background,
    vexpand: true,
    hexpand: true,
    setup: (self) => {
      const visualizer = Visualizer({
        bars: DEFAULT_BAR_COUNT,
        barHeight: DEFAULT_BAR_HEIGHT,
        smooth: true,
        style: VisualizerStyle.SYMMETRIC_BARS,
      });

      if (!player || player.playback_status !== Mpris.PlaybackStatus.PLAYING) {
        visualizer.set_visible(false);
      }

      if (player) {
        hook(visualizer, player, "notify::playback-status", () => {
          visualizer.set_visible(
            player.playback_status === Mpris.PlaybackStatus.PLAYING,
          );
        });
      }

      self.add_overlay(Info);
      self.add_overlay(visualizer);
    },
  });
};

export const Music = () =>
  Widget.Box({
    cssClasses: ["player-container"],
    vertical: true,
    vexpand: true,
    hexpand: true,
    heightRequest: 600,
    widthRequest: 600,
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.CENTER,
    children: bind(mpris, "players").as((arr) => {
      return MediaPlayer(arr[0]);
    }),
  });
