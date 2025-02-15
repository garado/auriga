
// █▀▀ █▀█ ▄▀█ █░░ █▀
// █▄█ █▄█ █▀█ █▄▄ ▄█

/**
 * Interfaces with goals contained within Taskwarrior.
 * 
 * Similar to the other Task service, but this takes a different enough
 * approach to storing and sorting data that it made more sense to
 * create an entirely new service.
 *
 * The Task service sorts strictly by tag and project:
 *
 * task.data = {
 *    tagName1: {
 *      projectName1: [], // array of tasks
 *      projectName2: [], // array of tasks
 *    },
 *    tagName2: {
 *      projectName3: [], // array of tasks
 *      projectName4: [], // array of tasks
 *    }
 * }
 *
 * The Goal service organizes by category and then hierarchically
 * for each category.
 *
 * Categories are implemented in Taskwarrior using projects.
 * The hierarchy is implemented in Taskwarrior using dependencies.
 *
 * Other info:
 * Each task can only have one project.
 * All goals have the tag 'goal'.
 * A Taskwarrior context is set which filters things tagged 'goal'.
 *
 * This data is stored here:
 *    goal.data = {
 *      category1 = tree1,
 *      category2 = tree2,
 *      category3 = tree3,
 *    }
 *
 * `task export` returns all tasks in a flat unsorted array, so the goals
 * service processes the array to rebuild the hierarchy.
 */

/*************************************************
 * IMPORTS
/*************************************************/

import Gio from 'gi://Gio'
import Utils from 'resource:///com/github/Aylur/ags/utils.js'
import UserConfig from '../../userconfig.js'

/*************************************************
 * MODULE-LEVEL VARIABLES
/*************************************************/

/**
 * The user's UTC offset.
 *
 * date +%z returns "-0700" for UTC-7, so there's extra math to
 * convert that string to a usable integer.
 */
const USER_UTC_OFFSET = Number(Utils.exec("date +%z")) / 100

const CONTEXT_SET = ""
const CONTEXT_UNSET = ""

/*************************************************
 * SERVICE DEFINITION
/*************************************************/

class GoalService extends Service {
  static {
    Service.register (
      this,
      { // Signals
        'render-goals':     ['jsobject'],
        'request-sidebar':  ['boolean'],
        'sidebar-data-changed': ['jsobject'],
      },
      { // Properties
        /* Makes #taskData available publicly. */
        'data':      ['jsobject', 'r'],

        'sidebar-data': ['jsobject', 'rw'],
        
        'sidebar-breadcrumbs': ['jsobject', 'rw'],

        'ui-settings': ['jsobject', 'rw'],
      },
    )
  }
  
  /***************************************
   * PRIVATE VARIABLES
   ***************************************/

  // Private variables
  #dataDirectory = ''

  #data = {}

  #uiSettings = {
    failed: false,
    completed: false,
    pending: true,
    developed: true,
    undeveloped: false,
  }

  /**
   * Initialize with some dummy data
   */
  #defaultSidebarData = {
    isDefault: true,
    parent: { description: 'Placeholder' },
    children: [],
    description: 'Placeholder',
  }

  #sidebarData = this.#defaultSidebarData

  /**
   * The sidebar has a navigation thingy
   */
  #sidebarBreadcrumbs = []

  /***************************************
   * PUBLIC FUNCTIONS
   ***************************************/

  get data() {
    return this.#data
  }

  get ui_settings() {
    return this.#uiSettings
  }

  /**
   * @function set_settings
   * @param [Object] settings Keys are props, values are new states
   */
  set_settings (newSettings) {
    Object.keys(newSettings).forEach(property => {
      log('goalService', `set_settings: ${property} -> ${newSettings[property]}`)
      this.#uiSettings[property] = newSettings[property]
    })

    this.notify('ui-settings')
    this.emit('render-goals', this.#data)
  }

  /* Sidebar data ----------------------------------------- */
  get sidebar_data() {
    return this.#sidebarData
  }

  set sidebar_data(data) {
    this.#sidebarData = data
    this.notify('sidebar-data')
    this.emit('sidebar-data-changed', this.#sidebarData)
  }

  resetSidebarData() {
    this.#sidebarData = this.#defaultSidebarData
    this.notify('sidebar-data')
    this.emit('sidebar-data-changed', this.#sidebarData)
  }
  
  /* Breadcrumbs ------------------------------------------ */
  /* Used in the sidebar when navigating subgoals. */

  get sidebar_breadcrumbs() {
    return this.#sidebarBreadcrumbs
  }
  
  set sidebar_breadcrumbs(crumb) {
    this.#sidebarBreadcrumbs = crumb
    this.notify('sidebar-breadcrumbs')
  }

  pushBreadcrumb(crumb) {
    this.#sidebarBreadcrumbs.push(crumb)
    this.notify('sidebar-breadcrumbs')
  }

  followBreadcrumbs(dir) {
    if (dir < 0 && this.#sidebarBreadcrumbs.length > 0) {
      this.#sidebarData = this.#sidebarBreadcrumbs.pop()
      this.notify('sidebar-data')
      this.notify('sidebar-breadcrumbs')
    }
  }

  /**
   * This function is called when a goal is clicked.
   * It emits the 'request-sidebar' signal which is caught by
   * the Overview widget, which will reveal the Sidebar widget.
   */
  requestSidebar(state) {
    this.emit('request-sidebar', state)
  }

  toggleStatus(goal) {
    const cmd = `task ${goal.uuid} mod status:${goal.status == 'pending' ? 'completed' : 'pending'}`
  }

  /**
   * Turn a string given in TaskWarrior's weird format to a date object.
   * The TaskWarrior format is:
   *    YYYYMMDDThhmmssZ
   * This function first converts it to
   *    YYYY-MM-DDThh:mm:ssZ
   * And from there it can be directly turned into a date object.
   *
   * TODO the task service uses this too; put this function in a shared file
   */
  tasktimeToDateObj(tasktime) {
    const re = /(\d\d\d\d)(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z/.exec(tasktime)
    const convert = `${re[1]}-${re[2]}-${re[3]}T${re[4]}:${re[5]}:${re[6]}Z`
    return new Date(convert)
  }

  /**
   * Convert a date object to the form YYYY-MM-DD.
   */
  dateToYYYYMMDD(date) {
    date.setUTCHours(date.getUTCHours() + USER_UTC_OFFSET)
    return date.toISOString().split('T')[0]
  }

  /**
   * Convert a TaskWarrior time string to a YYYY-MM-DD string.
   */
  tasktimeToYYYYMMDD(tasktime) {
    const date = this.tasktimeToDateObj(tasktime)
    return this.dateToYYYYMMDD(date)
  }

  /**
   * Fetch all goals and store them.
   */
  fetchGoals() {
    log('goalService', 'Fetching goals')

    const cmd = `task rc.data.location='${this.#dataDirectory}' tag:goals and "(status:pending or status:completed)" export`

    Utils.execAsync(['bash', '-c', cmd])
      .then(out => {
        this.#data = {}

        const goals = JSON.parse(out)
        goals.forEach(g => this.#insertGoal(g))

        this.#sortGoals()

        this.emit('render-goals', this.#data)
      })
      .catch(err => print(`GoalService: fetchGoals: ${err}`))
  }


  /***************************************
   * PRIVATE FUNCTIONS
   ***************************************/

  constructor(taskdata) {
    log('goalService', 'Constructing goal service')

    super()

    this.#dataDirectory = taskdata

    this.fetchGoals()

    // print(JSON.stringify(this.#data))

    // A taskwarrior hook sets this externally when a task is added or modified
    // The hook contains:
    //    ags -r "goalDataUpdated.setValue(0)"
    globalThis.goalDataUpdated = Variable(0)

    goalDataUpdated.connect('changed', () => {
      log('goalService', 'Goal data has changed')
      this.fetchGoals()
    })
  }

  /**
   * Sort goals in this order:
   *  - due date
   *  - completion percentage
   *  - alphabetical (description)
   */
  #sortGoals() {
    log('goalService', 'Sorting')

    function goalSort(a, b) {
      if (a.due !== b.due) {
        return a.due > b.due
      } else if (false) {
        // TODO: Completion percentage
      } else if (a.description != b.description) {
        return a.description > b.description
      }
    }

    function traverseAndSort(node)
    {
      node.children.sort(goalSort)

      for (let i = 0; i < node.children.length; i++) {
        traverseAndSort(node.children[i])
      }
    }

    Object.keys(this.#data).forEach(category => {
      traverseAndSort(this.#data[category])
    })
  }

  /**
   * Insert goals into a category tree.
   */
  #insertGoal(goal) {
    // log('goalService', `insertGoal: ${goal.description}`)

    if (!goal.project || goal.project.length == 0) {
      console.log(`GoalService: insertGoal: Goal "${goal.description}" (${goal.uuid}) has no associated project`)
      return
    }

    const category = goal.project

    /* Initialize fields */

    // Set image path (path may or may not exist)
    // Path is: <splashDirectory>/<category>/#<uuidShort>.jpg
    const uuidShort = goal.uuid.substring(0, 8)
    goal.imgpath = `${UserConfig.goals.splash}/${category}/#${uuidShort}.jpg`

    if (this.#isTaskFailed(goal)) {
      goal.status = 'failed'
    }

    if (!goal.depends) goal.depends = []
    goal.children = []

    /* If this is a new category, then create the root node for it
     * And insert this goal as a child */
    if (this.#data[category] == undefined) {
      log('goalService', `Creating new category ${category} (${goal.description})`)
      this.#data[category] = {
        description: 'Root',
        children: [],
        depends: [],
        uuid: '',
      }

      goal.parent = this.#data[category]
      goal.parent.children.push(goal)

      return
    }

    // Is it a child of any existing goals?
    const parent = this.#isDependency(goal)

    if (parent) {
      // If it is: Insert into the parent.
      goal.parent = parent
      parent.children.push(goal)
      return
    } else {
      // If is it not: Insert at top level.
      goal.parent = this.#data[category]
      this.#data[category].children.push(goal)
    }

    // Is it a parent of any existing goals?
    const foundChildren = []
    this.#findDependencies(goal, foundChildren)

    if (foundChildren) {
      // If the current goal is a parent:
      // Remove the found child from its existing parent.
      foundChildren.forEach(child => {
        const indexWithinPreviousParent = child.parent.children.indexOf(child)
        child.parent.children.splice(indexWithinPreviousParent, 1)

        // Insert the found child into the current goal.
        child.parent = goal
        goal.children.push(child)
      })
    }
  }

  /**
   * Check if goal is failed.
   * Taskwarrior statuses only support 'pending' or 'completed'
   * A failed task in Taskwarrior is recorded as 'completed' but has an annotation saying 'failed'
   * This program uses 3 statuses: pending, completed, and failed
   */
  #isTaskFailed(goal) {
    if (goal.status == 'completed' && goal.annotations != undefined) {
      for (const x of goal.annotations) {
        if (x.description == 'failed') {
          return true
        }
      }
    }
    return false
  }

  /**
   * Check if the given goal is a child of any other goals that
   * were already inserted.
   */
  #isDependency(goal, nodeToSearch) {
    if (nodeToSearch == undefined) {
      nodeToSearch = this.#data[goal.project]
    }

    if (nodeToSearch.depends.includes(goal.uuid)) {
      return nodeToSearch
    } else {
      for (let i = 0; i < nodeToSearch.children.length; i++) {
        const childNode = nodeToSearch.children[i]
        const parent = this.#isDependency(goal, childNode)
        if (parent) return parent
      }
      return null
    }
  }

  /**
   * Check if the given goal is the parent of any other goals
   * that were already inserted.
   */
  #findDependencies(goal, foundChildren, nodeToSearch) {
    if (nodeToSearch == undefined) {
      nodeToSearch = this.#data[goal.project]
    }

    if (goal.uuid == nodeToSearch.uuid) return

    if (goal.depends.includes(nodeToSearch.uuid)) {
      foundChildren.push(nodeToSearch)
    }

    for (let i = 0; i < nodeToSearch.children.length; i++) {
      const searchChild = nodeToSearch.children[i]
      this.#findDependencies(goal, foundChildren, searchChild)
    }
  }

  /**
   * Recursively print hierarchy for a goal.
   */
  #printGoal(goal, offset = 0) {
    print(`${' '.repeat(offset * 2)} - ${goal.status == 'completed' ? 'DONE: ' : ''}${goal.description}`)
    goal.children.forEach(child => this.#printGoal(child, offset + 1))
  }

  /**
   * Print the hierarchy for all categories.
   */
  #printAll(node = this.#data) {
    const categories = Object.keys(node)

    categories.forEach(category => {
      print(category.toUpperCase())
      const rootNode = this.#data[category]
      this.#printGoal(rootNode)
    })
  }
}

const service = new GoalService(UserConfig.goals.directory)

export default service
