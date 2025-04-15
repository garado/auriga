/* █▀▄▀█ █▀▀ ▀█▀ █▀█ █▀█ █▄░█ █▀█ █▀▄▀█ █▀▀ */
/* █░▀░█ ██▄ ░█░ █▀▄ █▄█ █░▀█ █▄█ █░▀░█ ██▄ */

import { subprocess } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk4";

const BPM_ADJUST_STEP = 5;

export const Metronome = () => {
  let proc: any = null; /* @TODO what type is this? */

  const startMetronome = (bpm: number) => {
    stopMetronome();

    proc = subprocess(
      `bash -c "play -n -c1 synth 0.05 sine 440 pad ${60 / bpm - 0.004} repeat -" > /dev/null 2>&1`,
      (out) => console.log(out),
      (err) => console.error(err),
    );

    PlayPause.set_from_icon_name("pause-symbolic");
  };

  const stopMetronome = () => {
    if (proc) {
      proc.kill();
    }

    proc = null;

    PlayPause.set_from_icon_name("play-symbolic");
  };

  const Bpm = Widget.Entry({
    cssClasses: ["bpm"],
    text: "60",
    hexpand: true,
    xalign: 0.5,
    inputPurpose: Gtk.InputPurpose.NUMBER,
    maxLength: 3,
    onNotifyText: (self) => {
      const filtered = self.text.replace(/[^\d]/g, "");
      if (filtered !== self.text) {
        self.set_text(filtered);
      }
      stopMetronome();
    },
  });

  const PlayPause = Widget.Image({
    cssClasses: ["bpm-control"],
    iconName: "play-symbolic",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: (self) => {
      if (proc) {
        stopMetronome();
      } else {
        startMetronome(Number(Bpm.text));
      }
    },
  });

  const Increase = Widget.Image({
    cssClasses: ["bpm-control"],
    iconName: "plus-symbolic",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      const newBpm = Number(Bpm.text) + BPM_ADJUST_STEP;
      Bpm.set_text(String(newBpm));
      startMetronome(newBpm);
    },
  });

  const Decrease = Widget.Image({
    cssClasses: ["bpm-control"],
    iconName: "minus-symbolic",
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    onButtonPressed: () => {
      const newBpm = Number(Bpm.text) - BPM_ADJUST_STEP;
      Bpm.set_text(String(newBpm));
      startMetronome(newBpm);
    },
  });

  return Widget.Box({
    cssClasses: ["metronome", "widget-container"],
    vertical: true,
    hexpand: true,
    children: [
      Widget.Label({
        label: "Metronome",
      }),
      Bpm,
      Widget.Box({
        vertical: false,
        hexpand: true,
        children: [Decrease, PlayPause, Increase],
        halign: Gtk.Align.CENTER,
      }),
    ],
  });
};
