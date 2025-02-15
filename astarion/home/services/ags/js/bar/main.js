
/* █▄▄ ▄▀█ █▀█ */
/* █▄█ █▀█ █▀▄ */

/* Nice minimal bar. */

import GLib from 'gi://GLib'
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js'

const battery = await Service.import('battery')
const audio = await Service.import('audio')

log('program', 'Entering bar.js')

/*************************************
 * WORKSPACE
 *************************************/

const Workspaces = () => {
  const activeId = Hyprland.active.workspace.bind('id');
  const array = Array.from({length: 9}, (_, i) => i + 1)

  return Widget.Box({
    vertical: true,
    spacing: 8,
    hpack: 'center',
    className: 'workspaces',
    children: array.map(i => Widget.EventBox({
      onClicked: () => Hyprland.messageAsync(`dispatch workspaces ${i}`),
      child: Widget.Label(`${i}`),
      attribute: i,

      /* classNames doesn't seem to play well with reactive elements, 
       * so I have to chain binds */
      setup: self => self
        /* Apply 'not-empty' class if this workspace has clients */
        .bind('prop', Hyprland, 'workspaces', ws => {
          const notEmpty = ws.find(x => x.name == self.attribute)
          self.toggleClassName('not-empty', notEmpty != undefined)
        })

        /* Apply 'focused' class if this is the active workspace */
        .bind('prop', Hyprland.active.workspace, 'id', id => {
          self.toggleClassName('focused', id === self.attribute)
        })
    }))
  });
}

/*************************************
 * CLOCK
 *************************************/

const Time = () => {
  const hour = Variable('', {
    poll: [1000, "date '+%H'"],
  })

  const min = Variable('', {
    poll: [1000, "date '+%M'"],
  })

  return Widget.Box({
    vertical: true,
    className: 'time',
    children: [
      Widget.Label({ label: hour.bind() }),
      Widget.Label({ label: min.bind() }),
    ]
  })
}

/*************************************
 * BATTERY
 *************************************/

const Battery = () => Widget.Label({
  classNames: ['battery'],
  label: battery.bind('percent').as(x => `${x}`),
  setup: self => self
    .bind('prop', battery, 'percent', per => {
      self.toggleClassName('dying', per < 25)
    })
    .bind('prop', battery, 'charging', chg => {
      self.toggleClassName('charging', chg)
    })
})

/*************************************
 * CAPS LOCK
 *************************************/

// @TODO Find a way to do this without polling
const capsLockListen = Variable('1', {
  /* To check caps lock status, this checks the status of the Caps Lock key backlight */
  poll: [300, 'bash -c "brightnessctl -d input0::capslock g"'],
})

const CapsLock = () => Widget.Icon({
  visible: capsLockListen.bind().as(value => (value.trim() == '1') ? true : false),
  icon: 'arrow-fat-lines-up-symbolic',
  halign: 'center',
  valign: 'center',
})


/************************************************
 * VOLUME INDICATOR
 * Reveals only when volume is adjusted, then
 * hides 3 seconds later.
 ************************************************/

const VolumeIndicator = () => {
  const volumeIndicatorRevealerState = Variable(false)

  let timerID = undefined

  const startVolumeRevealTimer = () => {
    volumeIndicatorRevealerState.setValue(true)

    /* If a timer is already running, reset the timer. 
     * GDK does not allow resetting timers so destroy and create a new one. */
    if (timerID != undefined) {
      GLib.source_remove(timerID)
    }

    timerID = Utils.timeout(3000, () => {
      volumeIndicatorRevealerState.value = false
      timerID = undefined
    })
  }

  audio.connect('speaker-changed', startVolumeRevealTimer)

  return Widget.Box({
    child: Widget.Revealer({
      css: 'padding: 1px',
      revealChild: volumeIndicatorRevealerState.bind(),
      transitionDuration: 200,
      transition: 'slide_down',

      child: Widget.LevelBar({
        className: 'volume-indicator',
        visible: true,
        vexpand: true,
        hexpand: true,
        heightRequest: 100,
        barMode: 'continuous'
        maxValue: 65535, /* no idea why it's not 0->1 like the docs say */
        vertical: true,
        setup: self => self.hook(audio.speaker, self => {
          self.value = 65536 - audio.speaker?.stream?.volume
        })
      })
    })
  })
}

/*************************************
 * MUTE
 *************************************/

const MuteIcon = () => Widget.Icon({
  icon: 'speaker-simple-x-symbolic',
  setup: self => self.hook(audio.speaker, self => {
    self.visible = audio.speaker?.stream?.is_muted
  })
})

/*************************************
 * FINAL ASSEMBLY
 *************************************/

const Top = Widget.Box({
  vpack: 'start',
  hpack: 'center',
  className: 'top',
  children: [
    Widget.Icon({icon: 'nix'})
  ]
})

const Center = Widget.Box({
  vpack: 'center',
  hpack: 'center',
  className: 'center',
  children: [Workspaces()]
})

const Bottom = Widget.Box({
  vpack: 'end',
  hpack: 'center',
  spacing: 10,
  className: 'right',
  vertical: true,
  children: [
    VolumeIndicator(),
    MuteIcon(),
    CapsLock(),
    Battery(),
    Time(),
  ]
})

export default (monitor = 0) => Widget.Window({
  name: `bar-${monitor}`,
  monitor,
  anchor: ['left', 'top', 'bottom'],
  hexpand: true,
  exclusivity: 'exclusive',
  child: Widget.CenterBox({
    vertical: true,
    hpack: 'center',
    className: 'bar',
    startWidget: Top,
    centerWidget: Center,
    endWidget: Bottom,
  }),
});
