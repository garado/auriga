
/* █░█ █░░ █▀▀ █▀▄ █▀▀ █▀▀ █▀█ */
/* █▀█ █▄▄ ██▄ █▄▀ █▄█ ██▄ █▀▄ */

import GObject, { register, property } from "astal/gobject"
import { monitorFile, readFileAsync } from "astal/file"
import { exec, execAsync } from "astal/process"

@register({ GTypeName: "Theme" })
export default class Theme extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Them

  static get_default() {
    if (!this.instance) {
      this.instance = new Theme()
    }

    return this.instance
  }
  
  /**************************************************
   * PRIVATE PROPERTIES
   **************************************************/

  #kbdMax = get(`--device ${kbd} max`)
  #kbd = get(`--device ${kbd} get`)
  #screenMax = get("max")
  #screen = get("get") / (get("max") || 1)

  /**************************************************
   * GETTERS/SETTERS
   **************************************************/

  @property(Number)
  get kbd() { return this.#kbd }

  set kbd(value) {
    if (value < 0 || value > this.#kbdMax)
    return

    execAsync(`brightnessctl -d ${kbd} s ${value} -q`).then(() => {
      this.#kbd = value
      this.notify("kbd")
    })
  }

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super()
    monitorFile(kbdPath, async f => {
      const v = await readFileAsync(f)
      this.#kbd = Number(v) / this.#kbdMax
      this.notify("kbd")
    })
  }

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/
}
