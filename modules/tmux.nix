# ▀█▀ █▀▄▀█ █░█ ▀▄▀
# ░█░ █░▀░█ █▄█ █░█

{
  flake.modules.homeManager.tmux = {
    programs.tmux = {
      enable = true;
    };
  };
}
