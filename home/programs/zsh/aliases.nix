
# ▀█ █▀ █░█   ▄▀█ █░░ █ ▄▀█ █▀ █▀▀ █▀
# █▄ ▄█ █▀█   █▀█ █▄▄ █ █▀█ ▄█ ██▄ ▄█

{ pkgs, config, ... }: {
  programs.zsh.shellAliases = {
    # Basic shell commands
    c = "clear";
    lsa = "ls -la";
    p = "pwd";
    
    # Quick navigation
    ".."   = "cd ..";
    "..."  = "cd ../..";
    "...." = "cd ../../..";
    desk = "cd ~/Desktop";
    dots = "cd ~/Github/dotfiles/";
    docs = "cd ~/Documents";
    pics = "cd ~/Pictures";
    gh   = "cd ~/Github";
    dl   = "cd ~/Downloads";
  
    cfg = "cd ~/.config";
    cfgags = "cd ~/Github/dotfiles/home/services/ags/";
  
    # Quick edit
    # TODO Relative paths?
    edl = "nvim $ENCHIRIDION/ledger/2024/2024.ledger";
    edq = "nvim ~/Github/dotfiles/home/programs/qutebrowser.nix";

    # Enchiridion
    ench = "cd $ENCHIRIDION";
    goals = "cd $ENCHIRIDION/goals ; nvim";
    
    # Nix
    rebuild = "sudo nixos-rebuild switch --flake .#astarion";
    re = "rebuild";
    ndev = "nix develop --command zsh";
  
    # Shortcut for terminal programs
    v = "nvim";
    nv = "nvim";
    tt = "taskwarrior-tui";
    ttg = "taskwarrior-tui --taskdata=/home/alexis/Enchiridion/goals/.taskwiki";
  
    # Git
    gst = "git status";
    gc = "git commit -m ";
    gp = "git push";

    # ags development
    a = "ags -c ./config.js";
    pa = "pkill .ags-wrapped";

    # Misc
    py = "python3";
  };
}
