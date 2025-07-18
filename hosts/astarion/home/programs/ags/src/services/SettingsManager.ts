/**
 * █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ █▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
 * ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ ▄█   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄
 *
 * Manages user settings.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { App } from "astal/gtk4";
import { GObject, register, property } from "astal/gobject";
import { exec, execAsync } from "astal/process";
import UserConfig from "../../userconfig.js";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export interface ThemeDetails {
  nvim: string;
  kitty: string;
  wallpaper: string;
  preview: string;
}

interface SystemConfig {
  nvim: {
    configPath: string;
    reloadScript: string;
  };
  astal: {
    sassColorsPath: string;
    sassMainPath: string;
    compiledCssPath: string;
    userConfigPath: string;
  };
  wallpaper: {
    transitionConfig: {
      type: string;
      step: number;
      fps: number;
      duration: number;
      bezier: string;
    };
  };
  currentTheme: string;
  themeDetails: Record<string, ThemeDetails>;
}

/*****************************************************************************
 * Constants
 *****************************************************************************/

export const AVAILABLE_THEMES = [
  "mountain",
  "kanagawa",
  // "gruvbox",
  // "nord",
  // "yoru",
  // "nostalgia",
];

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  nvim: {
    configPath: "$NVCFG/chadrc.lua",
    reloadScript: "$AGSCFG/scripts/nvim-reload.py",
  },
  astal: {
    sassColorsPath: `${SRC}/src/styles/theme/colors/colors.sass`,
    sassMainPath: "./src/styles/main.sass",
    compiledCssPath: "/tmp/ags/style.css",
    userConfigPath: "$AGSCFG/userconfig.js",
  },
  wallpaper: {
    transitionConfig: {
      type: "fade",
      step: 20,
      fps: 255,
      duration: 1.5,
      bezier: ".69,.89,.73,.46",
    },
  },
  currentTheme: "mountain",
  themeDetails: {
    mountain: {
      nvim: "mountain",
      kitty: "Mountain Fuji",
      wallpaper: `${SRC}/assets/themes/wallpapers/mountain.jpg`,
      preview: `${SRC}/assets/themes/preview/mountain.png`,
    },
    kanagawa: {
      nvim: "kanagawa",
      kitty: "Kanagawa ",
      wallpaper: `${SRC}/assets/themes/wallpapers/kanagawa.jpg`,
      preview: `${SRC}/assets/themes/preview/kanagawa.png`,
    },
  },
};

/*****************************************************************************
 * Helper functions
 *****************************************************************************/

/*****************************************************************************
 * Class definition
 *****************************************************************************/

@register({ GTypeName: "Settings" })
export default class SettingsManager extends GObject.Object {
  // Singleton ---------------------------------------------------------------
  static instance: SettingsManager;

  static get_default() {
    if (!this.instance) {
      this.instance = new SettingsManager();
    }

    return this.instance;
  }

  // Properties --------------------------------------------------------------
  @property(Object) declare systemConfig: SystemConfig;

  @property(String) declare private _currentTheme: string;

  @property(String)
  get currentTheme() {
    return this._currentTheme;
  }

  set currentTheme(themeName: string) {
    this._currentTheme = themeName;
    this.applyTheme(themeName);
    this.notify("current-theme");
  }

  // Private functions -------------------------------------------------------
  constructor() {
    super();
    this.systemConfig = this.mergeSystemConfig(DEFAULT_SYSTEM_CONFIG, {});
    this.currentTheme = UserConfig.currentTheme;
  }

  /**
   * Apply Neovim NvChad theme.
   * WARNING: This is very specific to my setup.
   */
  private applyNeovimTheme = (themeName: string) => {
    const nvimThemeName = this.systemConfig.themeDetails[themeName].nvim;

    if (nvimThemeName) {
      const nvimPath = "$NVCFG/chadrc.lua";
      const nvimCmd = `sed -i 's/theme = \\".*\\"/theme = \\"${nvimThemeName}\\"/g'`;

      exec(`bash -c "${nvimCmd} ${nvimPath}"`);

      execAsync(`bash -c 'python3 ${SRC}/scripts/nvim-reload.py'`)
        .then(print)
        .catch(print);
    }
  };

  private applyWallpaper = (themeName: string) => {
    const wallpaper = this.systemConfig.themeDetails[themeName].wallpaper;

    if (wallpaper) {
      const cmd = `swww img ${wallpaper} --transition-type fade --transition-step 20 --transition-fps 255 --transition-duration 1.5 --transition-bezier .69,.89,.73,.46`;
      execAsync(cmd).catch(print);
    }
  };

  private applyCSSTheme = (themeName: string) => {
    // SASS: @forward 'oldtheme' ==> @forward 'newtheme'
    const sassCmd = `sed -i \"s#forward.*#forward \\"${themeName}\\"#g\" ${SRC}/src/styles/theme/colors/colors.sass`;
    execAsync(`bash -c '${sassCmd}'`)
      .then((_) => {
        // Tell other widgets the theme changed so they can update their styles
        execAsync(`sass ${SRC}/src/styles/main.sass /tmp/ags/style.css`).then(
          () => {
            App.apply_css("/tmp/ags/style.css");
          },
        );
      })
      .catch(print);

    // UserConfig: currentTheme: 'kanagawa' => currentTheme: 'newTheme'
    const configCmd = `sed -i \"s#currentTheme.*#currentTheme: \\"${themeName}\\",#g\" $AGSCFG/userconfig.js`;
    execAsync(`bash -c '${configCmd}'`).catch(print);
  };

  // Public functions --------------------------------------------------------
  applyTheme(themeName: string) {
    const themeDetails = this.availableThemes[themeName];

    // Change terminal theme
    if (themeDetails.kitty) {
      execAsync(`kitty +kitten themes "${themeDetails.kitty}"`).catch(() => {
        execAsync(`bash -c "pgrep kitty | xargs kill -USR1"`);
      });
    }
  }

  // Private helper functions ------------------------------------------------
  /**
   * Merge default system paths with custom overrides using deep merge
   * @param defaultPaths - Default system paths
   * @param customPaths - Custom path overrides
   * @returns Merged system paths configuration
   */
  private mergeSystemConfig(
    defaultPaths: SystemConfig,
    customPaths?: Partial<SystemConfig>,
  ): SystemConfig {
    if (!customPaths) return defaultPaths;

    return this.deepMerge(defaultPaths, customPaths);
  }

  /**
   * Deep merge utility for nested objects
   * @param target - Target object to merge into
   * @param source - Source object to merge from
   * @returns Merged object
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          this.isPlainObject(sourceValue) &&
          this.isPlainObject(targetValue)
        ) {
          (result as any)[key] = this.deepMerge(targetValue, sourceValue);
        } else if (sourceValue !== undefined) {
          (result as any)[key] = sourceValue;
        }
      }
    }

    return result;
  }

  /**
   * Check if a value is a plain object
   * @param value - Value to check
   * @returns True if value is a plain object
   */
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      value !== null &&
      typeof value === "object" &&
      Object.prototype.toString.call(value) === "[object Object]"
    );
  }
}
