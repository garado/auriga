# █▀▀ █░░ ▄▀█ █░█ █▀▄ █▀▀
# █▄▄ █▄▄ █▀█ █▄█ █▄▀ ██▄

{
  flake.modules.nixos.claude = {
    unfreePackages = [ "claude-code" ];
  };

  flake.modules.homeManager.claude =
    { pkgs, ... }:
    {
      home.packages = [ pkgs.claude-code ];
    };
}
