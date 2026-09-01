# ▀█ █▀ █░█   ▄▀█ █░░ █ ▄▀█ █▀ █▀▀ █▀
# █▄ ▄█ █▀█   █▀█ █▄▄ █ █▀█ ▄█ ██▄ ▄█

# zsh aliases specific to @archaea.
# these will be merged with the global zsh config in ROOT/modules/home/zsh/.

{ pkgs, config, ... }:
{
  programs.zsh.shellAliases = {
    dots = "cd ~/Github/dotfiles/";
    cfg = "cd ~/.config";

    py = "python3";
    m = "make";
  };
}
