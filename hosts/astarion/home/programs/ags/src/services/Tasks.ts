/**
 * ▀█▀ ▄▀█ █▀ █▄▀   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀
 * ░█░ █▀█ ▄█ █░█   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄
 *
 * For interfacing with Taskwarrior.
 */

import { GObject, register, property } from "astal/gobject";
import { execAsync } from "astal/process";
import { log } from "@/globals.js";
import Tree, { TreeNode } from "@/utils/Tree.js";
import SettingsManager from "./settings";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export interface Project {
  hierarchy: Array<string>;
  name: string;
  tasks: Array<Tasks>;
}

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
 * MODULE LEVEL VARIABLES
 **********************************************/

const taskConfig = SettingsManager.get_default().config.dashTasks;

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
  declare data: Tree<Project>;

  @property(Object)
  declare selectedProject: TreeNode<Project>;

  @property(Object)
  declare displayedTasks: Array<Task>;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();

    this.dataDirectory = taskConfig.directory;
    this.data = new Tree<Project>();
    this.displayedTasks = [];

    this.#initProjectTree();
  }

  /**
   * @function initProjectTree
   * @brief Parse projects from TaskWarrior and use them to build a tree.
   */
  #initProjectTree = () => {
    const cmd = `task rc.data.location='${this.dataDirectory}' _unique project`;

    execAsync(`bash -c "${cmd}"`)
      .then((out) => {
        const paths = out.split("\n");
        const tree = new Tree<Project>();
        tree.addRoot({ name: "root", tasks: [], hierarchy: [] });

        for (const path of paths) {
          const parts = path.split(".");
          let current = tree.root!;

          const partsTilNow: Array<string> = [];

          for (const part of parts) {
            let next = current.children.find((c) => c.data.name === part);

            if (!next) {
              next = new TreeNode<Project>({
                hierarchy: [...partsTilNow],
                name: part,
                tasks: [],
              });

              current.addChild(next);
            }

            current = next;
            partsTilNow.push(part);
          }
        }

        this.data = tree;
      })
      .catch(print);
  };

  /**
   * @function fetchTasksForProjects
   * @brief Fetch list of tasks for a TaskWarrior project.
   */
  #fetchTasksForProjects = async (project: Project) => {
    log("taskService", `fetchTasksForProjects: ${project.name}`);

    const projectPath =
      project.hierarchy.join(".") +
      (project.hierarchy.length > 0 ? "." : "") +
      project.name;
    const cmd = `task rc.data.location='${this.dataDirectory}' project:${projectPath} export`;

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

        this.displayedTasks = tasks;
      })
      .catch((err) => {
        log("taskService", err);
      });
  };

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/

  newProjectSelected = (project: TreeNode<Project>) => {
    this.selectedProject = project;
    this.#fetchTasksForProjects(project.data);
  };
}
