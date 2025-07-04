
/* █▄░█ █▀█ ▀█▀ █ █▀▀ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█ █▀ */
/* █░▀█ █▄█ ░█░ █ █▀░ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█ ▄█ */

log('program', 'Entering notifications.js')

const notifications = await Service.import("notifications")

/* Notification settings */
notifications.popupTimeout = 5000
notifications.forceTimeout = true
notifications.clearDelay = 100

/* Module-level variables */
const MAX_WIDTH_CHARS = 45

/**
 * Instantiate a notification.
 */
const Notification = (n) => {
  const revealerState = Variable(false)

  const app = Widget.Label({
    className: 'app',
    max_width_chars: MAX_WIDTH_CHARS,
    justification: 'left',
    xalign: 0,
    truncate: 'end',
    wrap: true,
    label: n.app_name,
  })

  const title = Widget.Label({
    className: 'title',
    max_width_chars: MAX_WIDTH_CHARS,
    justification: 'left',
    xalign: 0,
    truncate: 'end',
    wrap: true,
    label: n.summary,
  })

  const body = Widget.Label({
    className: 'body',
    max_width_chars: MAX_WIDTH_CHARS,
    xalign: 0,
    wrap: true,
    label: n.body,
    justification: 'left',
  })

  const actions = Widget.Box({

  })

  const timeoutBar = Widget.LevelBar({
    className: 'timeout',
    widthRequest: 100,
    value: n.timeout,
    maxValue: n.timeout
  })

  const TIMEOUT_INTERVAL = 50
  const source = setInterval(() => {
    timeoutBar.value -= TIMEOUT_INTERVAL
  }, TIMEOUT_INTERVAL)

  const finalLayout = Widget.Box({
    className: 'content',
    vertical: true,
    spacing: 8,
    children: [
      app,
      title,
      body,
      actions,
    ]
  })

  return Widget.EventBox({
    attribute: {
      timer: source,
      notif: n,
    },
    onPrimaryClick: n.dismiss,
    child: Widget.Box({
      className: 'notification',
      vertical: true,
      children: [
        finalLayout,
        timeoutBar,
      ]
    }),
  })
}

/**
 * Set up notifications window.
 */
export function Notifications(monitor = 0) {
  /* Contains all notifications */
  const list = Widget.Box({
    spacing: 10,
    className: 'notification-popups',
    vertical: true,
    children: notifications.popups.map(Notification),
  })

  /* Run when we get a notification */
  function onNotified(_, id) {
    const n = notifications.getNotification(id)

    if (n) {
      list.children = [Notification(n), ...list.children]
    }
  }

  /* Run when we dismiss a notification */
  function onDismissed(_, id) {
    const n = list.children.find(n => n.attribute.notif.id === id)

    if (n) {
      n.attribute.timer.destroy()
      n.destroy()
    }
  }

  list.hook(notifications, onNotified, "notified")
      .hook(notifications, onDismissed, "dismissed")

  return Widget.Window({
    monitor,
    name: `notifications-${monitor}`,
    anchor: ['top', 'right'],
    child: Widget.Box({
      css: 'min-width: 1px; min-height: 1px;',
      vertical: true,
      child: list,
    }),
  })
}
