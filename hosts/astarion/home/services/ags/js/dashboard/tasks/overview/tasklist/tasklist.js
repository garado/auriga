
import Header from './_header.js'
import List from './_list.js'

export default Widget.Box({
  className: 'taskbox',
  vexpand: true,
  vertical: true,
  homogeneous: false,
  children: [
    Header(),
    Widget.Scrollable({
      hscroll: 'never',
      vscroll: 'automatic',
      child: List(),
    })
  ],
})

