# █▀▀ ▀█▀ █▄▀
# █▄█ ░█░ █░█

{
  flake.modules.homeManager.gtk =
    { pkgs, ... }:
    {
      gtk = {
        enable = true;
        cursorTheme = {
          name = "Bibata-Modern-Classic";
          package = pkgs.bibata-cursors;
        };
        font.name = "Karla";
        font.size = 14;
      };

      home.pointerCursor = {
        gtk.enable = true;
        x11.enable = true;
        package = pkgs.bibata-cursors;
        name = "Bibata-Modern-Classic";
        size = 24;
      };
    };
}
