
// █▀█ █▀ █▀
// █▀▄ ▄█ ▄█

import Widget from 'resource:///com/github/Aylur/ags/widget.js'

const createSeparator = () => {
  return Widget.Separator({
    className: 'rss-separator',
    vertical: false
  })
}

const createEntry = (data) => {
  const title = Widget.Label({
    wrap: true,
    xalign: 0,
    hpack: 'start',
    className: 'title',
    label: data.title,
  })

  let desc
  if (data.description) {
    desc = Widget.Label({
      wrap: true,
      hpack: 'start',
      className: 'description',
      label: data.description,
    })
  }
  
  const source = Widget.Box({
    hpack: 'start',
    className: 'source',
    vertical: false,
    children: [
      Widget.Icon({ className: 'icon', icon: 'rss-symbolic'}),
      Widget.Label(data.source),
    ]
  })

  const time = Widget.Box({
    hpack: 'start',
    className: 'source',
    vertical: false,
    children: [
      Widget.Icon({ className: 'icon', icon: 'clock-symbolic'}),
      Widget.Label(data.time),
    ]
  })

  const bottom = Widget.Box({
    className: 'entry-bottom',
    vertical: false,
    children: [
      source,
      time,
    ]
  })

  return Widget.Box({
    className: 'rss-entry',
    vertical: true,
    children: [
      title,
      desc ? desc : undefined,
      bottom,
    ]
  })
}

const top = Widget.Box({
  children: [
    Widget.Label({
      className: 'rss-header',
      label: 'RSS Feed',
    })
  ]
})

const rss = Widget.Box({
  className: 'inside',
  vertical: true,
  children: [
    top,
  ],
  setup: self => {
    const fakeData = {
      title: 'Insert interesting headline here',
      source: 'CNN',
      time: '22 minutes ago',
    }
    
    const fakeData1 = {
      title: 'An incredibly long title to test out text-wrapping for my custom RSS feed widget',
      description: 'Description',
      source: 'Reuters',
      time: '1 hour ago',
    }

    self.add(createEntry(fakeData))
    self.add(createSeparator())
    self.add(createEntry(fakeData1))
    self.add(createSeparator())
    self.add(createEntry(fakeData))
  }
})


export default () => Widget.Box({
  className: 'rss',
  spacing: 6,
  vertical: true,
  children: [
    Widget.Scrollable({
      css: 'min-height: 20rem',
      hscroll: 'never',
      child: rss
    })
  ],
})
