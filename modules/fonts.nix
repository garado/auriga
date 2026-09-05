# █▀▀ █▀█ █▄░█ ▀█▀ █▀
# █▀░ █▄█ █░▀█ ░█░ ▄█

{
  flake.modules.nixos.fonts =
    { pkgs, ... }:
    {
      fonts = {
        packages = with pkgs; [
          noto-fonts
          noto-fonts-color-emoji
          monocraft
          mononoki
          cozette
          scientifica
        ];
      };
    };
}
