
// █▀█ █░█ █▀█ ▀█▀ █▀▀
// ▀▀█ █▄█ █▄█ ░█░ ██▄

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

const Quote = Widget.Label({
  className: 'quote-text',
  wrap: true,
  justification: 'center',
  label: 'Do not act as if you were going to live ten thousand years. Death hangs over you. While you live, while it is in your power, be good.'
})

const Attribute = Widget.Label({
  className: 'quote-attribute',
  label: 'Marcus Aurelius',
  justification: 'center',
})

export default () => Widget.Box({
  className: 'quote',
  vertical: true,
  vexpand: false,
  spacing: 8,
  children: [
    Quote,
    Attribute,
  ],
})

