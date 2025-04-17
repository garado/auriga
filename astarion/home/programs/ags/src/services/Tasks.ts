/**
 *
 * ▀█▀ ▄▀█ █▀ █▄▀   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀
 * ░█░ █▀█ ▄█ █░█   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄
 *
 * For interfacing with Taskwarrior
 */

import { GObject, register, property, signal } from "astal/gobject";
import { execAsync } from "astal/process";
import { log } from "@/globals.js";
import UserConfig from "../../userconfig.js";
import Tree, { TreeNode } from "@/utils/Tree.js";

/**********************************************
 * PUBLIC TYPEDEFS
 **********************************************/

export interface Project {
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
  declare data: Tree<Project>;

  /**************************************************
   * PRIVATE FUNCTIONS
   **************************************************/

  constructor() {
    super();

    this.dataDirectory = UserConfig.task.directory;

    this.data = new Tree<Project>();

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
        tree.addRoot({ name: "root", tasks: [] });

        for (const path of paths) {
          const parts = path.split(".");
          let current = tree.root!;

          for (const part of parts) {
            let next = current.children.find((c) => c.data.name === part);

            if (!next) {
              next = new TreeNode<Project>({ name: part, tasks: [] });
              current.addChild(next);
            }

            current = next;
          }
        }

        this.data = tree;
      })
      .catch(print);
  };

  /**************************************************
   * PUBLIC FUNCTIONS
   **************************************************/
}
