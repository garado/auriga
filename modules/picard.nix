# █▀█ █ █▀▀ ▄▀█ █▀█ █▀▄
# █▀▀ █ █▄▄ █▀█ █▀▄ █▄▀

{
  flake.modules.homeManager.picard =
    { pkgs, ... }:
    {
      home.packages = [ pkgs.picard ];
    };
}
