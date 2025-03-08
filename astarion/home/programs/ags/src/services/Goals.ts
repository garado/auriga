import { App } from "astal/gtk4";
import { GObject, register, property, signal } from "astal/gobject";
import { exec, execAsync } from "astal/process";
import UserConfig from "../../userconfig.js";
import { log } from "@/globals.js";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export class Goal {
  constructor(
    public description: string,
    public due: string,
    public entry: string,
    public id: number,
    public project: string,
    public status: string,
    public tag: string,
    public urgency: number,
    public uuid: string,
    public children: Goal[] = [],
    public why: string,
    public depends?: string[],
    public icon?: string,
    public annotations?: string[],
    public imgpath?: string,
    public parent?: Goal | undefined,
  ) {}

  static fromObject(obj: Partial<Goal>): Goal {
    return new Goal(
      obj.description ?? "",
      obj.due ?? "",
      obj.entry ?? "",
      obj.id ?? -1,
      obj.project ?? "",
      obj.status ?? "",
      obj.tag ?? "",
      obj.urgency ?? 0,
      obj.uuid ?? "",
      obj.children ?? [],
      obj.why ?? "",
      obj.depends ?? [],
      obj.icon ?? "target-symbolic",
      obj.annotations ?? [],
      obj.imgpath ?? "",
      obj.parent ?? undefined,
    );
  }
}

/**********************************************
 * PRIVATE TYPEDEFS
 **********************************************/

interface Filters {
  pending: boolean;
  completed: boolean;
  failed: boolean;
  developed: boolean;
  undeveloped: boolean;
}
/**********************************************
 * UTILITY
 **********************************************/

/**********************************************
 * CLASS DEFINITION
 **********************************************/

@register({ GTypeName: "Goals" })
export default class Goals extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Goals;

  static get_default() {
    if (!this.instance) {
      this.instance = new Goals();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  private dataDirectory: string;

  @property(Object)
  declare data: {
    [key: string]: Goal;
  };

  @property(Object)
  declare filters: Filters;

  @property(Object)
  declare sidebarGoal: Goal;

  @property(Object)
  declare sidebarBreadcrumbs: Array<Goal>;

  @property(Boolean)
  declare sidebarVisible: boolean;

  @signal(Object)
  declare renderGoals: (data: any) => void;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super({
      filters: {
        failed: false,
        completed: false,
        pending: true,
        developed: true,
        undeveloped: false,
      },
      sidebarBreadcrumbs: [],
    });

    this.dataDirectory = UserConfig.goals.directory;
    this.data = {};

    this.#fetchGoals();
  }

  /**
   * Fetch and store all goals.
   */
  #fetchGoals = () => {
    log("goalService", "Fetching goals");

    const cmd = `task rc.data.location="${this.dataDirectory}" tag:goals and "(status:pending or status:completed)" export`;

    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        const rawData = JSON.parse(out);
        rawData.map((raw: Object) => this.#insertGoal(Goal.fromObject(raw)));
        this.#sortGoals();
        this.emit("render-goals", this.data);
      })
      .catch((err) => print(`GoalService: fetchGoals: ${err}`));
  };

  /**
   * Insert goal.
   */
  #insertGoal = (goal: Goal) => {
    if (goal.project == undefined) {
      console.log(
        `GoalService: insertGoal: Goal "${goal.description}" (${goal.uuid}) has no associated project`,
      );
      return;
    }

    const category = goal.project;

    /* Initialize fields */

    /* Set image path (path may or may not exist) */
    /* Path is: <splashDirectory>/<category>/#<uuidShort>.jpg */
    const uuidShort = goal.uuid.substring(0, 8);
    goal.imgpath = `${UserConfig.goals.splash}/${category}/#${uuidShort}.jpg`;

    if (this.#isTaskFailed(goal)) {
      goal.status = "failed";
    }

    if (!goal.depends) goal.depends = [];
    goal.children = [];

    /* If this is a new category, then create the root node for it
     * And insert this goal as a child */
    if (this.data[category] == undefined) {
      log(
        "goalService",
        `Creating new category ${category} (${goal.description})`,
      );

      this.data[category] = Goal.fromObject({
        description: "Root",
        children: [],
        depends: [],
        uuid: "",
      });

      goal.parent = this.data[category];
      goal.parent.children.push(goal);

      return;
    }

    /* Is it a child of any existing goals? */
    const parent = this.#isDependency(goal);

    if (parent) {
      /* If it is: Insert into the parent. */
      goal.parent = parent;
      parent.children.push(goal);
      return;
    } else {
      /* If is it not: Insert at top level. */
      goal.parent = this.data[category];
      this.data[category].children.push(goal);
    }

    /* Is it a parent of any existing goals? */
    const foundChildren: Array<Goal> = [];
    this.#findDependencies(goal, foundChildren);

    if (foundChildren) {
      /* If the current goal is a parent:
       * Remove the found child from its existing parent. */
      foundChildren.forEach((child: Goal) => {
        const indexWithinPreviousParent = child.parent!.children.indexOf(child);
        child.parent!.children.splice(indexWithinPreviousParent, 1);

        /* Insert the found child into the current goal. */
        child.parent = goal;
        goal.children.push(child);
      });
    }
  };

  /**
   * Sort in this order:
   *  - due date
   *  - completion percentage
   *  - alphabetical (description)
   */
  #sortGoals = () => {
    log("goalService", "Sorting");

    const traverseAndSort = (node: Goal) => {
      node.children.sort(this.compareGoals);

      for (let i = 0; i < node.children.length; i++) {
        traverseAndSort(node.children[i]);
      }
    };

    Object.keys(this.data).forEach((category) => {
      traverseAndSort(this.data[category]);
    });
  };

  /**
   * Check if goal is failed.
   * Taskwarrior statuses only support 'pending' or 'completed'
   * A failed task in my TW setup is recorded as 'completed' but has an
   * annotation saying 'failed'.
   * This program uses 3 statuses: pending, completed, and failed
   */
  #isTaskFailed = (goal: Goal) => {
    // if (goal.status == "completed" && goal.annotations != undefined) {
    //   for (const x of goal.annotations) {
    //     if (x.description == "failed") {
    //       return true;
    //     }
    //   }
    // }
    return false;
  };

  /**
   * Check if the given goal is a child of any other goals that
   * were already inserted.
   */
  #isDependency = (goal: Goal, nodeToSearch?: Goal): null | Goal => {
    if (nodeToSearch == undefined) {
      nodeToSearch = this.data[goal.project];
    }

    if (
      nodeToSearch.depends != undefined &&
      nodeToSearch.depends.includes(goal.uuid)
    ) {
      return nodeToSearch;
    } else {
      for (let i = 0; i < nodeToSearch.children.length; i++) {
        const childNode = nodeToSearch.children[i];
        const parent = this.#isDependency(goal, childNode);
        if (parent) return parent;
      }
      return null;
    }
  };

  /**
   * Check if the given goal is the parent of any other goals
   * that were already inserted.
   */
  #findDependencies = (
    goal: Goal,
    foundChildren: Array<Goal>,
    nodeToSearch?: Goal,
  ) => {
    if (nodeToSearch == undefined) {
      nodeToSearch = this.data[goal.project];
    }

    if (goal.uuid == nodeToSearch.uuid) return;

    if (goal.depends!.includes(nodeToSearch.uuid)) {
      foundChildren.push(nodeToSearch);
    }

    for (let i = 0; i < nodeToSearch.children.length; i++) {
      const searchChild = nodeToSearch.children[i];
      this.#findDependencies(goal, foundChildren, searchChild);
    }
  };

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/
  /**
   * Return the children of a given node which satisfy the
   * currently active uifilters.
   */
  isMatching = (goal: Goal): boolean => {
    const statusMatch =
      (this.filters.completed && goal.status == "completed") ||
      (this.filters.pending && goal.status == "pending") ||
      (this.filters.failed && goal.status == "failed") ||
      (!this.filters.completed &&
        !this.filters.pending &&
        !this.filters.failed);

    const stateMatch =
      (this.filters.developed && goal.due && goal.why != undefined) ||
      (this.filters.undeveloped && (!goal.due || !goal.why)) ||
      (!this.filters.developed && !this.filters.undeveloped) ||
      (this.filters.developed && this.filters.undeveloped);

    return statusMatch && stateMatch;
  };

  filtersUpdated = () => {
    this.notify("filters");
  };

  compareGoals = (a: Goal, b: Goal): number => {
    if (a.due !== b.due) {
      return a.due > b.due ? -1 : 1;
    } else if (false) {
      /* TODO: By completion percentage */
    } else if (a.description != b.description) {
      return a.description > b.description ? -1 : 1;
    }
    return 0;
  };
}
