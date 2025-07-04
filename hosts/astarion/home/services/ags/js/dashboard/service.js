''
// █▀▄ ▄▀█ █▀ █░█   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀
// █▄▀ █▀█ ▄█ █▀█   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄

// State management and keybind handling for dashboard.

import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../userconfig.js'
import Gdk from "gi://Gdk";

class DashService extends Service {
  constructor() {
    log('dashService', 'Constructing dashService')
    super()
  }

  static {
    Service.register (
      this,
      { // Signals
        'active-tab-index-changed': ['int'],
        'page-index-changed': ['int'],
        'dash-state-changed': ['boolean'],
      },
      { // Properties
        'active-tab-index': ['int', 'rw'],
        'page-index': ['int', 'rw'],
        'num-tabs': ['int', 'rw'],
      },
    )
  }

  /* Private properties */
  #activeTabIndex = 0
  #activePageIndex = 0
  #numTabs = 0
  #binds = {}
  #dashState = false
  #lastKeyPress = ''
  
  get dash_state() {
    return this.#dashState
  }

  set dash_state(state) {
    this.#dashState = state
    this.emit('dash-state-changed', state)
  }
 
  get active_tab_index() {
    return this.#activeTabIndex
  }

  set active_tab_index(index) {
    this.#lastKeyPress = ''
    this.#activeTabIndex = index
    this.emit('active-tab-index-changed', this.#activeTabIndex)
  }
  
  get num_tabs() {
    return this.#numTabs
  }
  
  set num_tabs(num) {
    this.#numTabs = num
  }

  addTabBinds(index, bindTable) {
    this.#binds[index] = bindTable
  }

  /**
   * Use keyboard input to navigate between tabs and pages.
   * Returns TRUE if key handled; FALSE otherwise.
   * (Returning TRUE prevents the default Gtk keybind from running.)
   */
  handleKey = (self, event) => {
    const key = (event.get_keyval()[1])

    // Number keys are reserved for tab navigation
    if (Gdk.KEY_1 <= key && key <= Gdk.KEY_9) {
      // Navigation keys are 1-indexed, but active tab index is 0-indexed
      // (Key 1 should switch to Tab 0)
      const num = key - Gdk.KEY_0 - 1

      if (num < this.#numTabs && this.#activeTabIndex != num) {
        this.#activeTabIndex = num
        this.emit('active-tab-index-changed', this.#activeTabIndex)
        return true
      }
    }

    // All other keys are handled by the tab
    else {
      const bindList = this.#binds[this.#activeTabIndex]

      let char = undefined

      switch (key) {
        case Gdk.KEY_Escape:
          char = 'Esc'
          break

        case Gdk.KEY_Tab:
          char = 'Tab'
          break

        case Gdk.KEY_ISO_Left_Tab:
          char = 'ShiftTab'
          break

        default:
          char = String.fromCharCode(key) // Convert ASCII -> char
          break
      }

      const multiBind = `${this.#lastKeyPress}${char}`
      this.#lastKeyPress = char

      if (bindList && bindList[multiBind]) {
        bindList[multiBind]()
        this.#lastKeyPress = ''
        return true
      }

      if (bindList && bindList[char]) {
        bindList[char]()
        return true
      }

    }

    return false
  }
}

const service = new DashService

export default service
