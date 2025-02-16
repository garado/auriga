
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
    tabs = "cd ~/Documents/Music/guitar/";
  
    cfg = "cd ~/.config";
    cfgags = "cd ~/Github/dotfiles/astarion/home/programs/ags/";
  
    # Quick edit
    # TODO Relative paths?
    edl = "nvim $ENCHIRIDION/self/ledger/2024/2024.ledger";
    edq = "nvim ~/Github/dotfiles/home/programs/qutebrowser.nix";

    # Enchiridion
    ench = "cd $ENCHIRIDION";
    todo = "cd $ENCHIRIDION/self/todo/ ; nvim";
    goals = "cd $ENCHIRIDION/self/goals/ ; nvim";
    
    # Nix
    rebuild = "sudo nixos-rebuild switch --flake .#astarion";
    re = "rebuild";
    ndev = "nix develop --command zsh";
  
    # Shortcut for terminal programs
    v = "nvim";
    nv = "nvim";
    tt = "taskwarrior-tui";
    taskt = "task context todo";
    taskg = "task context goals";
    taskn = "task context none";
  
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
