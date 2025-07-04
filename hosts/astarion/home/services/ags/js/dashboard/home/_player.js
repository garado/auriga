
// █▀█ █░░ ▄▀█ █▄█ █▀▀ █▀█
// █▀▀ █▄▄ █▀█ ░█░ ██▄ █▀▄

const Mpris = await Service.import('mpris')

import Variable from 'resource:///com/github/Aylur/ags/variable.js'
import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
// import KotontrionCava from '../../widgets/cava.js'

const DEFAULT_IMG = '/home/alexis/Github/dotfiles/hosts/astarion/home/services/ags/assets/no-music.jpg'

Mpris.cache_cover_art = false

const getPlayer = () => {
  return Mpris.players[Mpris.players.length - 1]
}

/** @param {number} length */
function lengthStr(length) {
  const min = Math.floor(length / 60);
  const sec = Math.floor(length % 60);
  const sec0 = sec < 10 ? '0' : '';
  return `${min}:${sec0}${sec}`;
}

export default () => {
  const albumArtCover = Widget.Box({
    vexpand: true,
    className: 'album-art',
    setup: self => {
      self.hook(Mpris, (self) => {
        const coverPath = Mpris.players.length == 0 ? DEFAULT_IMG : getPlayer().cover_path
        self.css = `background-image: url('${coverPath}')`
      }, 'player-changed')
    }
  });

  const source = Widget.Box({
    hpack: 'start',
    vertical: false,
    spacing: 8,
    children: [
      Widget.Icon('music-notes-symbolic'),
      Widget.Label({
        css: 'padding-bottom: 4px',
        setup: self => {
          self.hook(Mpris, (self) => {
            const value = Mpris.players.length == 0 ? 'None' : getPlayer().identity
            self.label = value
          }, 'player-changed')
        }
      })
    ]
  })

  const title = Widget.Label({
    className: 'title',
    valign: 'center',
    hpack: 'start',
    setup: self => {
      self.hook(Mpris, (self) => {
        const value = Mpris.players.length == 0 ? 'Nothing playing' : getPlayer().track_title
        self.label = value
      }, 'player-changed')
    }
  });

  const artist = Widget.Label({
    className: 'artist',
    hpack: 'start',
    setup: self => {
      self.hook(Mpris, (self) => {
        const value = Mpris.players.length == 0 ? "It's quiet in here..." : getPlayer().track_artists.join(', ')
        self.label = value
      }, 'player-changed')
    }
  });

  return Widget.Overlay({
    className: 'player',
    vexpand: true,
    overlays: [
      Widget.Overlay({
        child: albumArtCover,
        overlays: [
          // KotontrionCava({
          //   bars: 30,
          //   barHeight: 150,
          //   smooth: true,
          // }),
          Widget.Box({
            className: 'album-art-gradient',
            vexpand: true,
            hexpand: true,
            css: 'padding: 1px',
          })
        ],
      }),
      Widget.Box( {
        vexpand: true,
        vertical: true,
        className: 'info',
        spacing: 8,
        children: [
          source,
          title,
          artist,
        ],
      }),
    ]
  })
}
