/**
 * █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ █▀
 * ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ ▄█
 */

import { App } from "astal/gtk4";
import { GObject, register, property } from "astal/gobject";
import { exec, execAsync } from "astal/process";
import UserConfig from "../../userconfig.js";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export interface Theme {
  nvim: string;
  kitty: string;
  wallpaper: string;
  astal: string;
  preview: string;
}

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

  declare private _currentTheme: string;

  @property(String)
  get currentTheme() {
    return this._currentTheme;
  }

  set currentTheme(themeName: string) {
    this._currentTheme = themeName;
    this.applyTheme(themeName);
    this.notify("current-theme");
  }

  @property(Object)
  declare availableThemes: Object;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();
    this.availableThemes = UserConfig.themes;
    this.currentTheme = UserConfig.currentTheme;
  }

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/
  applyTheme(themeName: string) {
    const themeDetails = this.availableThemes[themeName];

    /* Nvim (NvChad) theme */
    if (themeDetails.nvim) {
      const nvimPath = "$NVCFG/chadrc.lua";
      const nvimCmd = `sed -i 's/theme = \\".*\\"/theme = \\"${themeDetails.nvim}\\"/g'`;
      exec(`bash -c "${nvimCmd} ${nvimPath}"`);
      execAsync("bash -c 'python3 $AGSCFG/scripts/nvim-reload.py'")
        .then(print)
        .catch(print);
    }

    /* Change wallpaper */
    if (themeDetails.wallpaper) {
      execAsync(
        `swww img ${themeDetails.wallpaper} --transition-type fade --transition-step 20 \
--transition-fps 255 --transition-duration 1.5 --transition-bezier .69,.89,.73,.46`,
      ).catch(print);
    }

    /* Change Astal CSS theme */
    if (themeDetails.astal) {
      /* SASS: @forward 'oldtheme' ==> @forward 'newtheme' */
      const sassCmd = `sed -i \"s#forward.*#forward \\"${themeDetails.astal}\\"#g\" /home/alexis/Github/dotfiles/hosts/astarion/home/programs/ags/src/styles/theme/colors/colors.sass`;
      execAsync(`bash -c '${sassCmd}'`)
        .then((_) => {
          /* Tell other widgets the theme changed so they can update their styles */
          execAsync("sass ./src/styles/main.sass /tmp/ags/style.css").then(
            () => {
              App.apply_css("/tmp/ags/style.css");
            },
          );
        })
        .catch(print);

      /* UserConfig: currentTheme: 'kanagawa' => currentTheme: 'newTheme' */
      const configCmd = `sed -i \"s#currentTheme.*#currentTheme: \\"${themeName}\\",#g\" $AGSCFG/userconfig.js`;
      execAsync(`bash -c '${configCmd}'`).catch(print);
    }

    /* Change terminal theme */
    if (themeDetails.kitty) {
      execAsync(`kitty +kitten themes "${themeDetails.kitty}"`).catch(() => {
        execAsync(`bash -c "pgrep kitty | xargs kill -USR1"`);
      });
    }
  }
}
