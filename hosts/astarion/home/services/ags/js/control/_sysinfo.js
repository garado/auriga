
/* █▀ █▄█ █▀ █ █▄░█ █▀▀ █▀█ */
/* ▄█ ░█░ ▄█ █ █░▀█ █▀░ █▄█ */

/* Small widget for showing basic system info -
 * user, host, uptime, battery life remaining */

const battery = await Service.import('battery')
import UserConfig from '../../userconfig.js'

/******************************
 * HELPERS
 ******************************/

/**
 * @function calcUptime 
 * @brief Get uptime in "<x>d <y>h <z>m" format
 */
const calcUptime = () => {
  /* uptime in seconds */
  const raw = Utils.exec('cut -d. -f1 /proc/uptime')

  const d = Math.floor(raw / 86400)
  const h = Math.floor((raw % 86400) / 3600)
  const m = Math.floor((raw % 3600) / 60)

  return `${d}d ${h}h ${m}m`
}

/******************************
 * WIDGETS
 ******************************/

const FetchTemplate = (key, value) => {
  const labelValue = typeof(value) === 'object' ? value : ` ~ ${value}`

  return Widget.Box({
    vertical: false,
    children: [
      Widget.Label({
        className: 'text-highlight',
        label: key,
      }),
      Widget.Label({
        label: labelValue
      }),
    ]
  })
}

const Fetch = () => Widget.Box({
  className: 'fetch',
  vertical: true,
  vpack: 'center',
  hpack: 'center',
  children: [
    FetchTemplate('os', 'nix'),
    FetchTemplate('machine', 'fw13'),
    FetchTemplate('rem', battery.bind('time-remaining').as(seconds => {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      return ` ~ ${h}h ${m}m`
    })),
    FetchTemplate('up', calcUptime()),
  ]
})

const Profile = () => Widget.Box({
  className: 'pfp',
  vpack: 'center',
  hpack: 'center',
  css: `background-image: url("${UserConfig.profile.pfp}")`
})

export default () => Widget.Box({
  name: 'sysinfo',
  className: 'sysinfo',
  vertical: false,
  vexpand: false,
  hexpand: true,
  vpack: 'center',
  hpack: 'center',
  spacing: 20,
  children: [
    Profile(),
    Fetch(),
  ],
})
