
# ▀█ █▀ █░█   ▄▀█ █░░ █ ▄▀█ █▀ █▀▀ █▀
# █▄ ▄█ █▀█   █▀█ █▄▄ █ █▀█ ▄█ ██▄ ▄█

# zsh aliases specific to @astarion.
# these will be merged with the global zsh config in ROOT/modules/home/zsh/.

{ self, pkgs, config, ... }: {
  programs.zsh.shellAliases = {
    # Quick navigation
    dots = "cd ~/Github/dotfiles/";
    tabs = "cd ~/Documents/Music/guitar/";

    cfg = "cd ~/.config";
    cfgags = "cd ~/Github/dotfiles/hosts/astarion/home/shell/ags-ts/";
    ench = "cd $ENCHIRIDION";

    # Quick edit
    edl = "cd $ENCHIRIDION/self/ledger ; nvim 2024/2024.ledger";
    todo = "cd ~/Documents/stickynotes/ ; nvim todo.md";

    # Terminal program shortcuts
    tt = "taskwarrior-tui";

    # Development
    py = "python3.11";
    m = "make";

    # Nix
    rebuild = "sudo nixos-rebuild switch --flake .#astarion";
  };
}
