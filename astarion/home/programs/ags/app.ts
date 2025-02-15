import { App } from "astal/gtk4"
import Bar from "./src/windows/bar/Bar.ts"
import { exec } from "astal/process"

exec("sass ./src/styles/main.sass /tmp/ags/style.css")

App.start({
  css: "/tmp/ags/style.css",
  main() {
    App.get_monitors().map(Bar)
  },
})
