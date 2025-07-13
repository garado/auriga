/**
 * ▀█▀ ▄▀█ █▀ █▄▀ █▀   ▀█▀ ▄▀█ █▄▄
 * ░█░ █▀█ ▄█ █░█ ▄█   ░█░ █▀█ █▄█
 *
 * Entrypoint for tasks tab, setting up all pages.
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { DashTabLayout } from "@/components/DashTabLayout.ts";
import Projects from "./projects/Projects";

/*****************************************************************************
 * Widget definition
 *****************************************************************************/

export default () => {
  return DashTabLayout({
    name: "Tasks and things",
    cssClasses: ["tasks"],
    pages: [{ name: "Projects", ui: Projects }],
  });
};
