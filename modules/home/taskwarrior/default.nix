# ▀█▀ ▄▀█ █▀ █▄▀ █░█░█ ▄▀█ █▀█ █▀█ █ █▀█ █▀█
# ░█░ █▀█ ▄█ █░█ ▀▄▀▄▀ █▀█ █▀▄ █▀▄ █ █▄█ █▀▄

{ pkgs, config, ... }:
{
  programs.taskwarrior = {
    enable = true;

    package = pkgs.taskwarrior2;

    dataLocation = "${config.home.homeDirectory}/Documents/tasks/";

    config = {
      "uda.why.type" = "string";
      "uda.why.label" = "why";

      "uda.icon.type" = "string";
      "uda.icon.label" = "icon";

      "uda.timescale.type" = "string";
      "uda.timescale.values" = "short,mid,long,aspirational";
      "uda.timescale.label" = "timescale";

      "uda.pinned.type" = "string";
      "uda.pinned.label" = "pinned";

      "context.goals" = "tag:goals";
      "context.todo" = "tag:books or tag:personal or tag:misc or tag:desktop or tag:music or tag:travel";
    };
  };
}
