// Reusable hover-to-reveal-child component

import { bind, timeout, Variable } from "astal";
import { Gtk, Widget } from "astal/gtk4";

export const HoverRevealWrapper = (props: {
  mainContent: any;
  childToReveal: any;
  revealDelay?: number;
  transitionType?: Gtk.RevealerTransitionType;
}) => {
  const {
    mainContent,
    childToReveal,
    revealDelay = 750,
    transitionType = Gtk.RevealerTransitionType.SLIDE_DOWN,
  } = props;

  const revealerState = Variable(false);
  let revealerTimer: any = null;

  return Widget.Box({
    vertical: true,
    children: [
      Widget.Box({
        child: mainContent,
        onHoverEnter: () => {
          revealerTimer = timeout(revealDelay, () => {
            revealerState.set(true);
          });
        },
        onHoverLeave: () => {
          revealerTimer?.cancel();
        },
      }),
      Widget.Revealer({
        child: childToReveal,
        transitionType,
        revealChild: bind(revealerState),
      }),
    ],
    onHoverLeave: () => {
      revealerState.set(false);
    },
  });
};
