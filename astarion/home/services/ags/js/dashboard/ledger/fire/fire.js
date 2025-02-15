
import Graph from './_graph.js'

const GraphBox = Widget.Box({
  vertical: true,
  hexpand: true,
  children: [
    Widget.Label({
      xalign: 0,
      className: 'header',
      label: 'FIRE progress'
    }),
    Graph(),
  ]
})


export default () => Widget.Box({
  name: 'FIRE',
  className: 'fire',
  vertical: false,
  spacing: 12,
  children: [
    GraphBox,
  ]
})
