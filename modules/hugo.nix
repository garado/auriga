# █░█ █░█ █▀▀ █▀█
# █▀█ █▄█ █▄█ █▄█

# Static site generator

{
  flake.modules.nixos.hugo =
    { pkgs, ... }:
    {
      environment.systemPackages = with pkgs; [
        hugo
        go
      ];
    };
}
