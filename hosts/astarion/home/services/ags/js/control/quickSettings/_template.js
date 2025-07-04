
/* ▀█▀ █▀▀ █▀▄▀█ █▀█ █░░ ▄▀█ ▀█▀ █▀▀   █▀█ █░█ █ █▀▀ █▄▀   █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ */
/* ░█░ ██▄ █░▀░█ █▀▀ █▄▄ █▀█ ░█░ ██▄   ▀▀█ █▄█ █ █▄▄ █░█   ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ */

/* Provides consistent implementation for quick settings widgets. */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'

export default ({
  icon = '',
  children = [],
  label = undefined,
  maxDropdownHeight = 200,
  globalRevealerState = undefined,
  ...rest
}) => {
  const revealerState = Variable(false)

  /**
   * Button showing setting status.
   * Clicking reveals the rest of the content.
   */
  const Overview = Widget.EventBox({
    className: 'overview-wrapper',
    child: Widget.CenterBox({
      classNames: ['overview-content'],
      hexpand: true,
      startWidget: Widget.Box({
        spacing: 10,
        children: [
          Widget.Icon(icon),
          Widget.Label({
            label: label,
            hexpand: false,
            truncate: 'end',
            maxWidthChars: 30,
            wrap: false,
          }),
        ],
      }),
      endWidget: Widget.Icon({
        hpack: 'end',
        icon: revealerState.bind().as(state => state ? 'caret-up-symbolic' : 'caret-down-symbolic'),
      })
    }),
    onPrimaryClick: self => {
      globalRevealerState.setValue(!revealerState.value)
      revealerState.setValue(!revealerState.value)
      self.toggleClassName('revealed', revealerState.value)
    },
  })
  
  /**
   * Scrollable content container.
   */
  const ContentScrollable = Widget.Scrollable({
    className: 'dropdown-scrollable',
    hscroll: 'never',
    vscroll: 'automatic',
    hexpand: true,
    vexpand: false,
    overlayScrolling: true,
    child: Widget.Box({
      className: 'dropdown-content',
      vertical: true,
      children: children,
    }),
    setup: self => self.connect('size-allocate', self => {
      self.heightRequest = Math.min(self.vadjustment.upper, maxDropdownHeight)
    })
  })

  /**
   * Content to be revealed after button is pressed.
   */
  const ContentReveal = Widget.Box({
    className: 'dropdown-revealer',
    heightRequest: 1,
    child: Widget.Revealer({
      revealChild: revealerState.bind(),
      transitionDuration: 250,
      transition: 'slide_down',
      child: Widget.Box({
        className: 'dropdown-scrollable-wrapper',
        children: [ContentScrollable],
      })
    })
  })

  /**
   * All together now
   */
  const Final = Widget.Box({
    className: 'quick-settings-item',
    child: Widget.Box({
      vertical: true,
      children: [
        Overview,
        ContentReveal,
      ]
    }),
  })

  Object.assign(Final, {
    'revealerState': revealerState
  })

  return Final
}
