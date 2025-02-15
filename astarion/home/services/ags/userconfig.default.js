
// █░█ █▀ █▀▀ █▀█   █▀▀ █▀█ █▄░█ █▀▀ █ █▀▀
// █▄█ ▄█ ██▄ █▀▄   █▄▄ █▄█ █░▀█ █▀░ █ █▄█

// Default user config.
// Rename this file to 'userconfig.js'

export default {
  themes: {
    kanagawa: {
      nvim: 'kanagawa',
      kitty: 'Kanagawa',
      wallpaper: '',
      ags: 'kanagawa',
    },
    mountain: {
      nvim: 'mountain',
      kitty: 'Mountain Fuji',
      wallpaper: '',
      ags: 'mountain',
    },
    nord: {
      nvim: 'onenord',
      kitty: 'Nord',
      wallpaper: '',
      ags: 'nord',
    },
    yoru: {
      nvim: 'yoru',
      kitty: 'Yoru',
      wallpaper: '',
      ags: 'yoru',
    },
    nostalgia: {
      kitty: 'Nostalgia Light',
      wallpaper: '',
    },
  },

  // Define the order of tabs.
  // Available:
  // home ledger calendar tasks goals life
  tabs: [
    "home", "calendar", "tasks", "goals", "ledger", "life"
  ],

  // Must be absolute path
  pfp: "",

  calendar: {
    // Adjust the color of events in the calendar based on
    colors: {
      'Events': '#607861',
    }
  },

  ledger: {
    // All files to include when calling ledger commands.
    includes: [
    ],

    // Watch this for changes. On change, update ledger widgets
    monitorDir: "",

    // List of accounts to display in top bar
    accountList: [
      {
        accountName: 'Assets:Checking:Bank',
        displayName: 'Checking',
      },
      {
        accountName: 'Assets:Savings:Bank',
        displayName: 'HYSA',
      },
      {
        accountName: 'Assets:Investments:401k',
        displayName: '401k',
      },
      {
        accountName: 'Assets:Investments:IRA',
        displayName: 'IRA',
      },
    ],

    // Rules for setting icons for the 'Transactions' widget
    // If nothing in transaction_name matches, then it will
    // search through account
    icon_maps: {
      transaction_name: {
        'Spotify': 'music',
      },

      account: {
        'Groceries': 'shopping-cart',
        'Household': 'home',
        'Salary': 'briefcase',
        'Wifi': 'wifi',
        'Utilities': 'zap',
        'Engineering': 'tool',
      },

      default: 'currency-dollar',
    },
  },

  github: {
    username: "garado",
  },

  openweather: {
    apiKey: "", // TODO set as env var
    latitude: "",
    longitude: "",
    units: "imperial",
  },

  task: {
    directory: '',
  },

  goals: {
    directory: '',
    splash: '',
  },

  kitty: {
    sessions_path: "/home/user/.config/kitty/sessions/"
  },
}
