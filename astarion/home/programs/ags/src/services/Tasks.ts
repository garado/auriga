/**
 * Service for interfacing with Taskwarrior.
 *
 * How I use taskwarrior to track tasks:
 * ------------------------------------------------------------
 * - Every task always has strictly one tag and one project
 *   (excluding virtual tags).
 * - The TW tag is the task category.
 * - The TW project is the task subcategory.
 *
 * Data organization:
 * ------------------------------------------------------------
 * `this.data` is a dictionary.
 *    - Keys: {string} category name
 *    - Values: {dictionary} key is subcategory name,
 *      value is Array<Task> for that subcategory
 *
 * Fetching data:
 * ------------------------------------------------------------
 * At construction, this service only fetches categories and
 * subcategories. The task data is "lazy-loaded" (only fetched
 * when the user selects the cat + subcat in the UI), which in
 * theory should improve startup performance?
 *
 * How the UI interacts with this service:
 * ------------------------------------------------------------
 * 'Categories' widget content is bound to the 'tags' property.
 * 'tags' prop is {Array<string>} and is set at construction.
 *
 * 'Subcategories' widget content is bound to the 'selectedTag' property.
 * 'selectedTag' prop is {string} and is updated from the UI, when the
 * user selects a tag.
 *
 * 'Tasklist' widget content is bound to the 'displayedTasks' property.
 * 'displayedTasks' is {Array<Task>} and is updated from either `fetchTasks`
 * or from
 */

import { GObject, register, property, signal } from "astal/gobject";
import { execAsync } from "astal/process";
import { log } from "@/globals.js";
import UserConfig from "../../userconfig.js";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export interface Annotation {
  entry: string;
  description: string;
}

export class Task {
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
    public children: Task[] = [],
    public depends?: string[],
    public icon?: string,
    public annotations?: Annotation[],
    public parent?: Task | undefined,
  ) {}

  static fromObject(obj: Partial<Task>): Task {
    return new Task(
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
      obj.depends ?? [],
      obj.icon ?? "target-symbolic",
      obj.annotations ?? [],
      obj.parent ?? undefined,
    );
  }
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

@register({ GTypeName: "Tasks" })
export default class Tasks extends GObject.Object {
  /**************************************************
   * SET UP SINGLETON
   **************************************************/

  static instance: Tasks;

  static get_default() {
    if (!this.instance) {
      this.instance = new Tasks();
    }

    return this.instance;
  }

  /**************************************************
   * PROPERTIES
   **************************************************/

  private dataDirectory: string;

  @property(Object)
  declare data: {
    [key: string]: Object;
  };

  @property(String)
  declare search: String;

  @property(Object)
  declare tags: Array<String>;

  @property(Object)
  declare displayedTasks: Array<Task>;

  @property(String)
  declare selectedTag: string;

  @property(String)
  declare selectedProject: string;

  @property(Object)
  declare selectedTask: Task;

  @signal(Object)
  declare renderTasks: (data: any) => void;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super({
      search: "",
      displayedTasks: [],
    });

    this.dataDirectory = UserConfig.task.directory;
    this.data = {};

    this.#initAllTags();

    this.connect("notify::selected-tag", () => {
      this.selectedProject = this.projectsInTag(this.selectedTag)[0];
    });

    this.connect("notify::selected-project", () => {
      const displayedTasks =
        this.data[this.selectedTag][this.selectedProject] ?? undefined;

      if (displayedTasks == undefined) {
        this.#fetchTasksForProject(this.selectedTag, this.selectedProject);
      } else {
        this.displayedTasks = displayedTasks;
        this.selectedTask = displayedTasks[0];
      }
    });
  }

  /**
   * Initialize list of tags.
   *
   * This will first run a command to grab the list of tags,
   * and then run 1 command per tag to fetch all projects.
   */
  #initAllTags = () => {
    const cmd = `task rc.data.location='${this.dataDirectory}' _unique tags -goals`;
    execAsync(`bash -c '${cmd}'`)
      .then((out) => {
        /**
         * Exclude 'next' because
         *
         * 1. I don't use them in any tags, and
         * 2. if there are any tasks with the 'NEXT' virtual tag, it shows up in this query like:
         * books
         * books,next <--
         *
         * @TODO: Find a cleaner way to do this
         */
        const tags = out.split("\n").filter((tag) => !tag.includes(",next"));

        this.tags = tags;

        this.data = {};

        /**
         * Run one command per tag to fetch all projects.
         */
        const promises = tags.map(async (tag) => {
          return this.#initProjectsForTag(tag);
        });

        Promise.all(promises)
          .then((result) => {
            for (let i = 0; i < tags.length; i++) {
              this.data[tags[i]] = {};

              result[i].forEach((project) => {
                this.data[tags[i]][project] = undefined;
              });
            }

            this.selectedTag = tags[0];
            this.selectedProject = this.projectsInTag(tags[0])[0];
          })
          .catch((err) => print(`TaskService: initAllTags: ${err}`));
      })
      .catch((err) => print(`TaskService: initAllTags: ${err}`));
  };

  /**
   * Initialize the list of projects for each tag.
   * @param {string} tag - the tag whose projects to fetch.
   * @return {Promise<Array<string>>} projects for the given tag
   */
  #initProjectsForTag = async (tag: string): Promise<Array<string>> => {
    const cmd = `task rc.data.location='${this.dataDirectory}' tag:${tag} status:pending _unique project`;
    return execAsync(`bash -c "${cmd}"`)
      .then((out) => {
        return out.split("\n");
      })
      .catch((err) => {
        print(`TaskService: initProjectsForTag: ${err}`);
        return [];
      });
  };

  /**
   * Fetch all tasks for a project.
   * @param {string} tag
   * @param {string} project
   */
  #fetchTasksForProject = (tag: string, project: string) => {
    log("taskService", `Fetching tasks for ${tag} ${project}`);

    const cmd = `task rc.data.location='${this.dataDirectory}' status:pending tag:'${tag}' project:'${project}' export`;

    execAsync(`bash -c "${cmd}"`)
      .then((out) => {
        const rawData = JSON.parse(out);
        const tasks = rawData.map((raw: Object) => Task.fromObject(raw));

        /* Sort by due date, then by title */
        tasks.sort((a: Task, b: Task) => {
          if (a.due == undefined && b.due == undefined) {
            return a.description > b.description;
          } else if (a.due != undefined && b.due == undefined) {
            return -1;
          } else if (a.due == undefined && b.due != undefined) {
            return 1;
          } else if (a.due != undefined && b.due != undefined) {
            return a.due > b.due;
          }
        });

        this.data[tag][project] = tasks;

        if (tag == this.selectedTag && project == this.selectedProject) {
          this.displayedTasks = tasks;
          this.selectedTask = tasks[0];
        }
      })
      .catch((err) => print(`TaskService: fetchTasksForProject: ${err}`));
  };

  /**************************************************
   * PUBLIC MOD FUNCTIONS
   **************************************************/

  /**
   * Return a list of the projects in a given tag.
   * @param {string} tag - tag whose projects to query
   */
  projectsInTag = (tag: string): Array<string> => {
    if (Object.keys(this.data).includes(tag)) {
      return Object.keys(this.data[tag]);
    } else {
      return [];
    }
  };

  /**
   * Modify a task.
   * @param {Task} task - task to modify
   * @param {string} modType - the property to modify
   * @param {string} value - the new property value to set
   *
   * note: quote escaping not handled properly
   */
  modify = (task: Task, modType: string, value: string) => {
    const cmd = `task rc.data.location="${this.dataDirectory}" ${task.uuid} modify ${modType}:"${value}"`;
    execAsync(`bash -c '${cmd}'`);
  };
}
