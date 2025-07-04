
# █░█░█ █▀█ ▄▀█ █▀█ █▀▀ █▀█ █▀▄
# ▀▄▀▄▀ █▀▀ █▀█ █▀▀ ██▄ █▀▄ █▄▀

# Wallpaper daemon

{...}: {
  programs.wpaperd = {
    enable = true;

    settings = {
      eDP-1.path = "~/Github/dotfiles/assets/walls/samori.jpg";
      DP-11.path = "~/Github/dotfiles/assets/walls/samori.jpg";
      DP-12.path = "~/Github/dotfiles/assets/walls/samori.jpg";
    };
  };
}
