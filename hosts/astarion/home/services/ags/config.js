
// █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀ ░ ░░█ █▀
// █▄▄ █▄█ █░▀█ █▀░ █ █▄█ ▄ █▄█ ▄█

// Entry point for config - loads SASS and JS

import App from 'resource:///com/github/Aylur/ags/app.js'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import Gtk from 'gi://Gtk?version=3.0'
import { log } from './js/global.js'

// Custom icons
Gtk.IconTheme.get_default().append_search_path(`${App.configDir}/assets/icons`);
Gtk.IconTheme.get_default().append_search_path(`${App.configDir}/assets/icons/phosphor`);

// Function to reload and reapply SASS
function loadSASS() {
  const sass = `${App.configDir}/sass/base.sass`
  const css = `/tmp/ags/style.css`

  // Compile, reset, and apply
  log('program', 'Reloading SASS')
  Utils.exec(`sass ${sass} ${css}`)
  App.resetCss()
  App.applyCss(css)
}

log('program', 'Loading SASS')
loadSASS()

// Watch SASS for changes and reload on change
Utils.monitorFile(`${App.configDir}/sass`, loadSASS)

await import(`file://${App.configDir}/js/main.js`)

log('program', 'Import complete')
