/**
 * █▀▄▀█ █▀▀ █▀▄ █ ▄▀█   █▀█ █░░ ▄▀█ █▄█ █▀▀ █▀█
 * █░▀░█ ██▄ █▄▀ █ █▀█   █▀▀ █▄▄ █▀█ ░█░ ██▄ █▀▄
 *
 * Media player with audio visualizer.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gtk, Widget, astalify, hook } from "astal/gtk4";
import { bind, execAsync, Variable } from "astal";
import { Visualizer, VisualizerStyle } from "@/views/components/Visualizer";
import Mpris from "gi://AstalMpris";
import Gio from "gi://Gio?version=2.0";
import Pango from "gi://Pango?version=1.0";
import { CMD } from "@/utils/Commands";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const DEFAULT_COVER_ART_PATH = `${SRC}/assets/defaults/player-idle.jpg`;

const DEFAULT_BAR_HEIGHT = 0.4;
const DEFAULT_BAR_COUNT = 60;

const CSS_CLASSES = {
  PLAYER_CONTAINER: "media-player",
  COLOR_OVERLAY: "cover-art-overlay",
  INFORMATION: "info",
  TITLE: "title",
  ARTIST: "artist",
  COVER_ART: "cover-art",
} as const;

/*****************************************************************************
 * Module-level variables
 *****************************************************************************/

const mpris = Mpris.get_default();
const Picture = astalify(Gtk.Picture);

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/**
 * Get path for cover art to display.
 * @returns Gio.File for the cover art image
 */
const getFileForCoverArt = (coverArt: string | null): Gio.File => {
  const path = coverArt || DEFAULT_COVER_ART_PATH;
  return Gio.File.new_for_path(path);
};

/**
 * Use imagemagick to extract the top 5 primary colors from an image.
 * @returns Promise<string[]> containing hex colors.
 */
const getImageColors = async (file: Gio.File): Promise<string[]> => {
  const imagePath = file.get_path();
  if (!imagePath) {
    throw new Error("Could not get path from Gio.File");
  }

  const cmd = `magick "${imagePath}" -resize 100x100 +dither -colors 5 -unique-colors txt:- | grep -oE '#[0-9A-F]{6}'`;
  const result = await execAsync([CMD.bash, "-c", cmd]);
  return result.trim().split("\n").slice(0, 5);
};

/*****************************************************************************
 * Widget definitions
 *****************************************************************************/

/**
 * @param {Mpris.Player} player The media player to represent.
 */
const MediaPlayer = (player: Mpris.Player) => {
  const Title = Widget.Label({
    cssClasses: [CSS_CLASSES.TITLE],
    xalign: 0,
    ellipsize: Pango.EllipsizeMode.END,
    maxWidthChars: 30,
    label: player
      ? bind(player, "title").as((t) => t || "Unknown Track")
      : "Nothing playing.",
  });

  const Artist = Widget.Label({
    cssClasses: [CSS_CLASSES.ARTIST],
    xalign: 0,
    ellipsize: Pango.EllipsizeMode.END,
    label: player
      ? bind(player, "artist").as((a) => a || "Unknown Artist")
      : "It's quiet in here...",
  });

  const CoverArt = Picture({
    cssClasses: [CSS_CLASSES.COVER_ART],
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

  /** Color palette derived from cover art */
  const ColorPalette = () => {
    const colors = Variable<string[]>([]);

    return astalify(Gtk.DrawingArea)({
      cssClasses: [CSS_CLASSES.COVER_ART],
      heightRequest: 16,
      setup: (self) => {
        if (player != null) {
          // Load initial colors
          getImageColors(getFileForCoverArt(player.coverArt)).then((c) =>
            colors.set(c),
          );

          hook(self, player, "notify::cover-art", () => {
            getImageColors(getFileForCoverArt(player.coverArt)).then((c) =>
              colors.set(c),
            );
          });
        }

        colors.subscribe(() => self.queue_draw());

        const drawFn = (
          _self: Gtk.DrawingArea,
          cr: any,
          width: number,
          height: number,
        ) => {
          const cols = colors.get();
          if (cols.length === 0) return;

          const segmentWidth = width / cols.length;

          cols.forEach((hexColor: string, i: number) => {
            const r = parseInt(hexColor.slice(1, 3), 16) / 255;
            const g = parseInt(hexColor.slice(3, 5), 16) / 255;
            const b = parseInt(hexColor.slice(5, 7), 16) / 255;

            cr.setSourceRGB(r, g, b);
            cr.rectangle(i * segmentWidth, 0, segmentWidth, height);
            cr.fill();
          });
        };

        self.set_draw_func(drawFn);
      },
    });
  };

  const PlayerVisualizer = () => {
    const visualizer = Visualizer({
      bars: DEFAULT_BAR_COUNT,
      barHeight: DEFAULT_BAR_HEIGHT,
      smooth: true,
      style: VisualizerStyle.SYMMETRIC_BARS,
    });

    visualizer.vexpand = false;

    return Widget.Box({
      vertical: false,
      spacing: 12,
      heightRequest: 40,
      children: [
        Widget.Image({
          iconName: "music-notes-simple-symbolic",
        }),
        visualizer,
      ],
      setup: (self) => {
        if (
          !player ||
          player.playback_status !== Mpris.PlaybackStatus.PLAYING
        ) {
          self.set_visible(false);
        }

        if (player) {
          hook(visualizer, player, "notify::playback-status", () => {
            self.set_visible(
              player.playback_status === Mpris.PlaybackStatus.PLAYING,
            );
          });
        }
      },
    });
  };

  const Info = Widget.CenterBox({
    cssClasses: [CSS_CLASSES.INFORMATION],
    orientation: Gtk.Orientation.VERTICAL,
    startWidget: Widget.Box({
      vertical: true,
      children: [Title, Artist],
    }),
    endWidget: PlayerVisualizer(),
  });

  return Widget.Overlay({
    child: Widget.Overlay({
      child: CoverArt,
      setup: (self) => {
        self.add_overlay(
          Widget.Box({
            cssClasses: [CSS_CLASSES.COLOR_OVERLAY],
            hexpand: true,
            vexpand: true,
          }),
        );
      },
    }),
    setup: (self) => {
      self.add_overlay(Info);
    },
  });
};

export const Player = () =>
  Widget.Box({
    cssClasses: [CSS_CLASSES.PLAYER_CONTAINER],
    vertical: true,
    vexpand: true,
    hexpand: true,
    valign: Gtk.Align.FILL,
    halign: Gtk.Align.FILL,
    children: bind(mpris, "players").as((arr) => MediaPlayer(arr[0])),
  });
