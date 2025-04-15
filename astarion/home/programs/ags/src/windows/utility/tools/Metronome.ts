import { subprocess } from "astal";
import { Gtk, Widget } from "astal/gtk4";

export const Metronome = () => {
  let bpm = 60;

  let proc = null;

  const Bpm = Widget.Entry({
    cssClasses: ["bpm"],
    text: `${bpm}`,
    hexpand: true,
    xalign: 0.5,
    inputPurpose: Gtk.InputPurpose.NUMBER,
    maxLength: 3,
    onNotifyText: (self) => {
      const filtered = self.text.replace(/[^\d]/g, "");
      if (filtered !== self.text) {
        self.set_text(filtered);
      }

      if (proc) {
        proc.kill();
      }
    },
    onActivate: (self) => {
      if (proc) {
        proc.kill();
      }

      proc = subprocess(
        `bash -c "play -n -c1 synth 0.05 sine 440 pad ${60 / Number(self.text) - 0.004} repeat -" > /dev/null 2>&1`,
        (out) => console.log(out),
        (err) => console.error(err),
      );
    },
  });

  const PlayPause = Widget.Image({});

  const Increase = Widget.Label({
    cssClasses: ["bpm-control"],
    label: "+",
  });

  const Decrease = Widget.Label({
    cssClasses: ["bpm-control"],
    label: "-",
  });

  return Widget.Box({
    cssClasses: ["metronome", "widget-container"],
    vertical: true,
    children: [
      Bpm,
      Widget.Box({
        vertical: false,
        children: [Decrease, Increase],
      }),
    ],
  });
};
