/**
 * █▀ █▀▀ ▀█▀ ▀█▀ █ █▄░█ █▀▀ █▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
 * ▄█ ██▄ ░█░ ░█░ █ █░▀█ █▄█ ▄█   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄
 *
 * Service for reading initial user settings and supplying settings to the reset
 * of the application.
 *
 * Also responsible for updating user settings.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { GObject, register, property } from "astal/gobject";
import { exec, execAsync } from "astal/process";

import { AccountConfig } from "@/services/Ledger";
import { DEFAULT_SYSTEM_CONFIG } from "./DefaultConfig.ts";
import { fileWrite } from "@/utils/File.ts";
import { Location } from "../Transit.ts";

/*****************************************************************************
 * Constants
 *****************************************************************************/

export const APP_PATHS = {
  SASS_COLORS_PATH: `${SRC}/src/styles/theme/colors/colors.sass`,
  SASS_MAIN_PATH: `${SRC}/src/styles/main.sass`,
  COMPILED_CSS_PATH: "/tmp/ags/style.css",
  USER_CONFIG_PATH: `${SRC}/userconfig.ts`,
  NVIM_CONFIG_PATH: "$NVCFG/chadrc.lua",
  NVIM_RELOAD_SCRIPT_PATH: `${SRC}/src/scripts/nvim-reload.py`,
} as const;

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

export interface ThemeConfig {
  displayName?: string;
  nvim: string;
  kitty: string;
  wallpaper: string;
  lockscreen: string;
  preview: string;
}

export interface SystemConfig {
  theme: {
    /** Current desktop theme. */
    currentTheme: string;

    /** Configuration for each individual theme. */
    themeConfig: Record<string, ThemeConfig>;
  };

  /** Define the order of dashboard tabs. */
  dashTabs: string[];

  dashHome: {
    profile: {
      name: string;
      pfp: string;
      splashText: string[];
    };

    /** Quotes to display. */
    quotes: [string, string][];

    /** Github username. */
    github: string;
  };

  dashCalendar: {
    /** Adjust the color of events in the calendar based on the calendar name */
    colors: Record<string, string>;
  };

  dashLedger: {
    /** All files to include when calling ledger commands. */
    includes: string[];

    /** When files in this directory change, the ledger service is refreshed */
    monitorDir: string;

    /* List of accounts to display, in order */
    accountList: AccountConfig[];
  };

  dashTasks: {
    directory: string;
  };

  dashGoals: {
    directory: string;
    categoryIcons: Record<string, string>;
  };

  utility: {
    palettes: Record<string, string[]>;
    stickyNotesPath: string;
  };

  misc: {
    /** @TODO use sops instead */
    geminiAPI: string;
  };

  transit: {
    apiKey: string;
    autocompleteApiKey: string;
    defaultLocation: Location;
    searchRadius: number;
  };

  pushover: {
    apiToken: string;
    userKey: string;
  };

  weather: {
    apiKey: string;
    units: string;
    lat: number;
    lon: number;
  };

  ttrss: {
    url: string;
    user: string;
    pass: string;
  };
}

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
  @property(Object) declare config: SystemConfig;

  @property(Object) declare availableThemes: string[];

  declare private _currentTheme: string;

  @property(String)
  get currentTheme(): string {
    return this._currentTheme;
  }

  set currentTheme(newTheme: string) {
    if (
      newTheme == this._currentTheme ||
      !this.availableThemes.includes(newTheme)
    ) {
      return;
    }

    this._currentTheme = newTheme;
    this.applyTheme(newTheme);
  }

  // Private functions -------------------------------------------------------
  constructor() {
    super();

    let userConfig;

    try {
      userConfig = require("userconfig.ts").UserConfig;
    } catch {
      userConfig = {};
    }

    this.config = this.mergeSystemConfig(DEFAULT_SYSTEM_CONFIG, userConfig);

    const availableThemes: string[] = [];
    Object.keys(this.config.theme.themeConfig).forEach((themeName) => {
      availableThemes.push(themeName);
    });

    this.availableThemes = availableThemes;
    this.currentTheme = this.config.theme.currentTheme;
  }

  /**
   * Write to `userconfig.ts` with new config.
   */
  private updateConfig = async (themeName: string) => {
    try {
      const escapedTheme = themeName.replace(/[\/&]/g, "\\$&");
      await execAsync(
        `sed -i --follow-symlinks 's/currentTheme:.*/currentTheme: "${escapedTheme}",/' ${APP_PATHS.USER_CONFIG_PATH}`,
      );
    } catch (error) {
      console.error("Failed to update config file:", error);
    }
  };

  /**
   * Apply Neovim NvChad theme.
   * WARNING: This is very specific to my setup.
   */
  private applyNeovimTheme = (themeName: string) => {
    const nvimThemeName = this.config.theme.themeConfig[themeName].nvim;

    if (nvimThemeName) {
      const nvimPath = "$NVCFG/chadrc.lua";
      const nvimCmd = `sed -i 's/theme = \\".*\\"/theme = \\"${nvimThemeName}\\"/g'`;

      exec(`bash -c "${nvimCmd} ${nvimPath}"`);

      execAsync(`bash -c 'python3 ${APP_PATHS.NVIM_RELOAD_SCRIPT_PATH}'`).catch(
        console.log,
      );
    }
  };

  /**
   * Apply wallpaper.
   */
  private applyWallpaper = (themeName: string) => {
    const wallpaper = this.config.theme.themeConfig[themeName].wallpaper;

    if (wallpaper) {
      const cmd = `swww img ${wallpaper} --transition-type fade --transition-step 20 --transition-fps 255 --transition-duration 1.5 --transition-bezier .69,.89,.73,.46`;
      execAsync(cmd).catch(console.log);
    }
  };

  /**
   * Apply astal CSS theme.
   */
  private applyCSSTheme = async (themeName: string = this.currentTheme) => {
    // Create/update colors.sass file
    const colorsContent = `@forward "${themeName}"`;
    fileWrite(APP_PATHS.SASS_COLORS_PATH, colorsContent);

    // Compile SASS and apply CSS
    try {
      const gtk4Cmd = `sass ${APP_PATHS.SASS_MAIN_PATH} ${APP_PATHS.COMPILED_CSS_PATH}`;
      exec(gtk4Cmd);

      const gtk3Cmd = `sass ${SRC}/src/styles/lock.sass /tmp/ags/lock-style.css`;
      exec(gtk3Cmd);

      globalThis.App.apply_css(APP_PATHS.COMPILED_CSS_PATH);
      this.notify("current-theme");

      if (globalThis.GtkVersion == 4) {
        execAsync(`astal -i lock reload-theme ${themeName}`);
      }
    } catch (error) {
      console.error("Failed to compile SASS:", error);
      return;
    }
  };

  /**
   * Apply Kitty theme.
   */
  private applyKittyTheme = (themeName: string) => {
    const themeConfig = this.config.theme.themeConfig;

    if (themeConfig[themeName].kitty) {
      execAsync(`kitty +kitten themes "${themeConfig[themeName].kitty}"`).catch(
        () => {
          execAsync(`bash -c "pgrep kitty | xargs kill -USR1"`);
        },
      );
    }
  };

  // Public functions --------------------------------------------------------
  applyTheme(themeName: string) {
    this.updateConfig(themeName);
    this.applyKittyTheme(themeName);
    this.applyNeovimTheme(themeName);
    this.applyWallpaper(themeName);

    if (globalThis.GtkVersion == 4) {
      this.applyCSSTheme(themeName);
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
