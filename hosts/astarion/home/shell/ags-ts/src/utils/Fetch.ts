/**
 * █▀▀ █▀▀ ▀█▀ █▀▀ █░█
 * █▀░ ██▄ ░█░ █▄▄ █▀█
 *
 * Util function for curl
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { execAsync } from "astal";
import { CMD } from "./Commands";

/*****************************************************************************
 * Types and interfaces
 *****************************************************************************/

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

/*****************************************************************************
 * Functions
 *****************************************************************************/

export const fetch = async (
  url: string,
  opts: FetchOptions = {},
): Promise<string> => {
  const method = opts.method || "GET";
  const headers = opts.headers || {};

  const args = ["-s", "-X", method];

  // Headers
  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }

  // Body
  if (opts.body) {
    args.push("-d", opts.body);
  }

  args.push(url);

  return execAsync([CMD.curl, ...args]);
};
