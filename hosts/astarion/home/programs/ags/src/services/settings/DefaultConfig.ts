/**
 * █▀▄ █▀▀ █▀▀ ▄▀█ █░█ █░░ ▀█▀   █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀
 * █▄▀ ██▄ █▀░ █▀█ █▄█ █▄▄ ░█░   █▄▄ █▄█ █░▀█ █▀░ █ █▄█
 */

import { SystemConfig } from ".";

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  theme: {
    currentTheme: "mountain",
    themeConfig: {
      kanagawa: {
        nvim: "kanagawa",
        kitty: "Kanagawa",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/kanagawa.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/kanagawa.png`,
      },
      nostalgia: {
        nvim: "nostalgia",
        kitty: "Nostalgia",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/nostalgia.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/nostalgia.png`,
      },
      mountain: {
        nvim: "mountain",
        kitty: "Mountain Fuji",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/mountain.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/mountain.png`,
      },
      nord: {
        nvim: "onenord",
        kitty: "Onenord",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/nord.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/nord.png`,
      },
      yoru: {
        nvim: "yoru",
        kitty: "Yoru",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/yoru.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/yoru.png`,
      },
      gruvbox: {
        nvim: "gruvbox",
        kitty: "Gruvbox Dark",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/gruvbox.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/gruvbox.png`,
      },
    },
  },

  dashTabs: ["home", "calendar", "ledger", "tasks", "goals"],

  dashHome: {
    profile: {
      name: "User",
      pfp: `${SRC}/assets/defaults/pfp.png`,
      splashText: [
        "I sell propane and propane accessories.",
        "That boy ain't right.",
        "Taste the meat, not the heat.",
        "Bwah!",
        "I'm gonna go get some more iced tea.",
        "Yep.",
        "I tell you what.",
      ],
    },

    /** Quotes to display. */
    quotes: [
      ["Don't forget to update your user configuration.", "userconfig.ts"],
    ],

    /** Github username. */
    github: "torvalds",
  },

  dashCalendar: {
    colors: {
      Events: "#896f70",
    },
  },

  dashLedger: {
    includes: [""],
    monitorDir: "",
    accountList: [],
  },

  dashTasks: {
    directory: "",
  },

  dashGoals: {
    directory: "",
    categoryIcons: {},
  },

  utility: {
    palettes: {
      "Holbein Acrylic Gouache": [
        "cyan",
        "magenta",
        "yellow",
        "black",
        "white",
      ],
      "Watercolor Travel Set": [
        "Lemon Yellow",
        "Cadmium Yellow",
        "Cadmium Red",
        "Alizarin Crimson",
        "Dioxazine Purple",
        "Ultramarine",
        "Cerulean Blue",
        "Sap Green",
        "Burnt Sienna",
        "Burnt Umber",
        "Payne's Gray",
        "Chinese White",
      ],
    },
  },

  misc: {
    geminiAPI: "",
  },
};
