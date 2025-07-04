
/* ▀█▀ █░█ █▀▀ █▀▄▀█ █▀▀ */
/* ░█░ █▀█ ██▄ █░▀░█ ██▄ */

import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../../userconfig.js'
import QuickSettingsTemplate from './_template.js'
import Gtk from 'gi://Gtk?version=3.0'

const Image = Widget.subclass(Gtk.Image)

/**
 * Apply a given theme
 */
const applyTheme = (theme) => {
  const themeName = theme[0]
  const themeDetails = theme[1]

  /* ags */
  if (themeDetails.ags) {
    /* sass: @import themes/oldtheme ==> @import themes/newtheme */
    const sassCmd = `sed -i \"s#import.*theme.*#import themes/${themeDetails.ags}#g\" $AGSCFG/sass/_colorscheme.sass`
    Utils.execAsync(`bash -c '${sassCmd}'`)
      .then(_ => {
        /* Tell other widgets the theme changed so they can update their styles */
        globalThis.systemTheme.setValue(themeName)
      })
      .catch(err => { print(err) })

    /* agscfg: currentTheme: 'kanagawa' => currentTheme: 'newTheme' */
    const configCmd = `sed -i \"s#currentTheme.*#currentTheme: \\"${themeName}\\",#g\" $AGSCFG/userconfig.js`
    Utils.execAsync(`bash -c '${configCmd}'`)
      .catch(err => { print(err) })
  }

  /* Wallpaper */
  if (themeDetails.wallpaper) {
    Utils.execAsync(`swww img ${themeDetails.wallpaper} --transition-type fade --transition-step 20 \
--transition-fps 255 --transition-duration 1.5 --transition-bezier .69,.89,.73,.46`)
      .catch(err => { print(err) })
  }

  /* Kitty */
  if (themeDetails.kitty) {
    Utils.exec(`kitty +kitten themes "${themeDetails.kitty}"`)
    Utils.execAsync(`bash -c "pgrep kitty | xargs kill -USR1"`)
  }

  /* Nvim (NvChad) */
  if (themeDetails.nvim) {
    const nvimPath = "$NVCFG/chadrc.lua"
    const nvimCmd = `sed -i 's/theme = \\".*\\"/theme = \\"${themeDetails.nvim}\\"/g'`
    Utils.exec(`bash -c "${nvimCmd} ${nvimPath}"`)
    Utils.execAsync("bash -c 'python3 $AGSCFG/scripts/nvim-reload.py'")
      .then(out => print)
      .catch(err => { print(err) })
  }
}

/**
 * Weeeee
 */
const ThemeButton = (theme) => {
  const themeName = theme[0]
  const themeDetails = theme[1]

  const ThemePreview = Image({
    className: 'preview-image',
    hpack: 'end',
    vpack: 'end',
    setup: self => {
      self.set_from_file(themeDetails.preview || '')
    }
  })

  const Info = Widget.CenterBox({
    vertical: false,
    classNames: [
      'preview-info',
      UserConfig.currentTheme == themeName ? 'check-active' : '',
    ],
    startWidget: Widget.Label({
      hpack: 'start',
      label: themeName
    }),
    endWidget: Widget.Icon({
      icon: UserConfig.currentTheme == themeName ? 'check-circle-symbolic' : 'circle-symbolic',
      hpack: 'end',
    }),
  })

  const Content = Widget.Box({
    className: 'preview-container',
    children: [
      Widget.Box({
        classNames: [
          'preview-wrapper',
          UserConfig.currentTheme == themeName ? 'active' : '',
        ],
        vertical: true,
        children: [
          Widget.Box({
            className: 'preview-image-wrapper',
            children: [ThemePreview],
          }),
          Info,
        ]
      })
    ]
  })

  return Widget.EventBox({
    child: Content,
    hexpand: false,
    vexpand: false,
    cursor: 'pointer',
    onPrimaryClick: () => { applyTheme(theme) }
  })
}

export default (globalRevealerState) => QuickSettingsTemplate({
  icon: 'palette-symbolic',
  label: UserConfig.currentTheme,
  maxDropdownHeight: 1000,
  children: Object.entries(UserConfig.themes).map(ThemeButton),
  globalRevealerState: globalRevealerState,
})
