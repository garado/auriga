import { App } from 'astal/gtk4'
import { exec } from 'astal/process'

import './src/globals.ts'
import Bar from './src/windows/bar/Bar.ts'
import Dash from './src/windows/dash/Dash.ts'

exec('sass ./src/styles/main.sass /tmp/ags/style.css')

App.start({
  css: '/tmp/ags/style.css',
  icons: './src/assets/icons/',
  main() {
    App.get_monitors().map(Bar)
    App.get_monitors().map(Dash)
  },
})
