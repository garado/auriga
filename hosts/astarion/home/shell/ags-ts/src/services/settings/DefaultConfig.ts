/**
 * █▀▄ █▀▀ █▀▀ ▄▀█ █░█ █░░ ▀█▀   █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀
 * █▄▀ ██▄ █▀░ █▀█ █▄█ █▄▄ ░█░   █▄▄ █▄█ █░▀█ █▀░ █ █▄█
 */

import { SystemConfig } from ".";

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  theme: {
    currentTheme: "mountain",
    themeConfig: {
      yorha: {
        displayName: "YoRHa",
        nvim: "yorha",
        kitty: "Yorha",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/yorha.png`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/yorha.png`,
        preview: `${SRC}/assets/defaults/theme/preview/yorha.png`,
      },
      mountain: {
        displayName: "Mountain",
        nvim: "mountain",
        kitty: "Mountain Fuji",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/mountain.jpg`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/mountain.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/mountain.png`,
      },
      kanagawa: {
        displayName: "Kanagawa",
        nvim: "kanagawa",
        kitty: "Kanagawa",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/kanagawa.jpg`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/kanagawa.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/kanagawa.png`,
      },
      nord: {
        displayName: "Nord",
        nvim: "onenord",
        kitty: "Onenord",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/nord.jpg`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/nord.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/nord.png`,
      },
      warning: {
        displayName: "Las Wawas",
        nvim: "yoru",
        kitty: "yoru",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/warning.png`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/warning.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/warning.png`,
      },
      nostalgia: {
        displayName: "Nostalgia",
        nvim: "nostalgia",
        kitty: "Nostalgia",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/nostalgia.jpg`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/nostalgia.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/nostalgia.png`,
      },
      yoru: {
        displayName: "Yoru",
        nvim: "yoru",
        kitty: "Yoru",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/yoru.jpg`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/yoru.jpg`,
        preview: `${SRC}/assets/defaults/theme/preview/yoru.png`,
      },
      gruvbox: {
        displayName: "Gruvbox Dark",
        nvim: "gruvbox",
        kitty: "Gruvbox Dark",
        wallpaper: `${SRC}/assets/defaults/theme/wallpapers/gruvbox.jpg`,
        lockscreen: `${SRC}/assets/defaults/theme/lockscreen/gruvbox.jpg`,
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
    includes: [],
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
    stickyNotesPath: "",
  },

  transit: {
    defaultLocation: {
      lat: 37.7749, // SF
      lon: -122.4194,
    },
    searchRadius: 50,
  },

  weather: {
    units: "imperial",
    lat: 37.7749,
    lon: -122.4194,
  },

  ttrss: {
    url: "",
  },

  secrets: {
    gemini: {
      key: "",
      sopsPath: "",
    },
    transit: {
      key: "",
      sopsPath: "",
    },
    locationiq: {
      key: "",
      sopsPath: "",
    },
    pushover: {
      user: {
        key: "",
        sopsPath: "",
      },
      api: {
        key: "",
        sopsPath: "",
      },
    },
    openweather: {
      key: "",
      sopsPath: "",
    },
    ttrss: {
      user: {
        key: "",
        sopsPath: "",
      },
      pass: {
        key: "",
        sopsPath: "",
      },
    },
  },
};
