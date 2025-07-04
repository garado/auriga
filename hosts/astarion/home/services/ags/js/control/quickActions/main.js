
const QuickActionTemplate = ({ icon = 'circle-symbolic', activeIcon = undefined, ...rest }) => {
  const Icon = Widget.Icon(icon)

  const EventBox = Widget.EventBox({
    attribute: {},
    className: 'quick-actions-item-container',
    child: Widget.Box({
      className: 'quick-actions-item',
      children: [
        Icon,
      ],
    }),
    ...rest
  })

  Object.assign(EventBox, {
    'setIcon': icon => {
      Icon.icon = icon
    },
    'active': false,
    'toggleActive': () => {
      EventBox.active = !EventBox.active
      EventBox.toggleClassName('active', EventBox.active)

      if (activeIcon) {
        Icon.icon = EventBox.active ? activeIcon : icon
      }
    }
  })

  return EventBox
}

/**********************************
 * QUICK ACTION DEFINITIONS
 **********************************/

/**
 * `nmcli radio wifi` is DISABLED if airplane mode is on
 */
const AirplaneMode = QuickActionTemplate({
  icon: 'airplane-tilt-symbolic',
  tooltipText: 'Airplane mode',
  onPrimaryClick: self => {
    self.toggleActive()
    Utils.execAsync(`nmcli radio wifi ${self.active ? 'on' : 'off'}`)
  },
  setup: self => {
    self.active = Utils.exec('nmcli radio wifi') == 'disabled'
    self.toggleClassName('active', self.active)
  }
})

/* Redshift for Wayland */
const Gammastep = QuickActionTemplate({
  icon: 'moon-symbolic',
  tooltipText: 'Nightshift',
})

/* Battery charge limiting */
const ChargeLimit = QuickActionTemplate({
  icon: 'battery-charging-symbolic',
  tooltipText: 'Battery charge limit',
})

const DoNotDisturb = QuickActionTemplate({
  icon: 'bell-symbolic',
  activeIcon: 'bell-off',
  tooltipText: 'Battery charge limit',
  onPrimaryClick: self => {
    self.toggleActive()
  }
})

/**********************************
 * EXPORT
 **********************************/

export default () => Widget.Box({
  className: 'quick-actions',
  vpack: 'center',
  hpack: 'center',
  vertical: false,
  spacing: 12,
  children: [
    AirplaneMode,
    Gammastep,
    ChargeLimit,
    DoNotDisturb,
  ]
})
