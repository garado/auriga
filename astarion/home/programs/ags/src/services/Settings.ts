/* █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ █▀ */
/* ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ ▄█ */

import { GObject, register, property } from "astal/gobject";
import UserConfig from "../../userconfig.js";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

/**********************************************
 * PRIVATE TYPEDEFS
 **********************************************/

/**********************************************
 * UTILITY
 **********************************************/

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Settings" })
export default class Settings extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Settings;

  static get_default() {
    if (!this.instance) {
      this.instance = new Settings();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  @property(Number)
  declare netWorth: Number;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();
  }
}
