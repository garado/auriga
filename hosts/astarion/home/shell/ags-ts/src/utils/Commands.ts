/**
 * █▀▀ █▀█ █▀▄▀█ █▀▄▀█ ▄▀█ █▄░█ █▀▄   █▀█ ▄▀█ ▀█▀ █░█   █▀▀ ▄▀█ █▀▀ █░█ █▀▀
 * █▄▄ █▄█ █░▀░█ █░▀░█ █▀█ █░▀█ █▄▀   █▀▀ █▀█ ░█░ █▀█   █▄▄ █▀█ █▄▄ █▀█ ██▄
 *
 * Caching absolute paths to binaries to avoid repeated PATH lookups.
 *
 * WHY THIS EXISTS:
 * ================
 * On NixOS, PATH contains a LOT of Nix store directories before the actual binary location.
 * Every time you spawn a command like `nmcli` without an absolute path, the system:
 * 1. Tries /nix/store/xxx-gjs/bin/nmcli (fails)
 * 2. Tries /nix/store/xxx-nodejs/bin/nmcli (fails)
 * 3. Tries /nix/store/xxx-dart-sass/bin/nmcli (fails)
 * ... repeats 50+ times ...
 * 50. Finally finds /run/current-system/sw/bin/nmcli (success!)
 *
 * This creates 50+ failed execve() syscalls per command invocation, causing:
 * - Excessive CPU wakeups (terrible for battery life)
 * - Slower command execution
 * - Unnecessary process spawning overhead
 *
 * Run this command to see the carnage:
 * sudo strace -p $(pgrep gjs) -f -e trace=clone,execve 2>&1 | grep execve | tee profile.log
 *
 * SOLUTION:
 * =========
 * Look up paths once at startup, cache them, use absolute paths everywhere.
 * Trade 1 lookup at startup for 0 failed execve() calls during runtime.
 */

import { exec } from "astal";

let bash: string | undefined = undefined;

const findCmd = (name: string) => {
  try {
    return exec(`${bash ?? "bash"} -lc "which ${name}"`).trim();
  } catch {
    return name; // fallback to PATH if not found
  }
};

bash = findCmd("bash");

export const CMD = {
  astal: findCmd("astal"),
  awk: findCmd("awk"),
  bash: bash,
  cat: findCmd("cat"),
  curl: findCmd("curl"),
  cut: findCmd("cut"),
  gcalcli: findCmd("gcalcli"),
  hledger: findCmd("hledger"),
  hyprctl: findCmd("hyprctl"),
  kill: findCmd("kill"),
  kitty: findCmd("kitty"),
  mkdir: findCmd("mkdir"),
  nmcli: findCmd("nmcli"),
  sass: findCmd("sass"),
  sed: findCmd("sed"),
  swww: findCmd("swww"),
  systemctl: findCmd("systemctl"),
  task: findCmd("task"),
  notifysend: findCmd("notify-send"),
};
