
// Container for dashboard widgets.

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

export default (args) => {
  if (args.scrollable) {
    return Widget.Box({
      className: 'dash-widget-container',
      children: [
        Widget.Scrollable(args.child)
      ]
    })
  } else {
    return Widget.Box({
      className: 'dash-widget-container',
      children: [
        args
      ]
    })
  }
}
