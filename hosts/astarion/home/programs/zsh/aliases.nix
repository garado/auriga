
# ▀█ █▀ █░█   ▄▀█ █░░ █ ▄▀█ █▀ █▀▀ █▀
# █▄ ▄█ █▀█   █▀█ █▄▄ █ █▀█ ▄█ ██▄ ▄█

{ self, pkgs, config, ... }: {
  programs.zsh.shellAliases = {
    # Shell commands
    c = "clear";
    lsa = "ls -la";
    p = "pwd";
    pclip = "pwd | wl-copy";
    
    # Quick navigation
    ".."   = "cd ..";
    "..."  = "cd ../..";
    "...." = "cd ../../..";
    desk = "cd ~/Desktop";
    dots = "cd ~/Github/dotfiles/";
    docs = "cd ~/Documents";
    mus  = "cd ~/Music";
    pics = "cd ~/Pictures";
    vids = "cd ~/Videos";
    gh   = "cd ~/Github";
    dl   = "cd ~/Downloads";
    tabs = "cd ~/Documents/Music/guitar/";

    cfg = "cd ~/.config";
    cfgags = "cd ~/Github/dotfiles/hosts/astarion/home/programs/ags/";
    ench = "cd $ENCHIRIDION";

    # Quick edit
    edl = "cd $ENCHIRIDION/self/ledger ; nvim 2024/2024.ledger";
    todo = "cd ~/Documents/stickynotes/ ; nvim todo.md";
    
    # Nix
    rebuild = "sudo nixos-rebuild switch --flake .#astarion";
    re = "rebuild";
    ndev = "nix develop --command zsh";
  
    # Shortcut for terminal programs
    v = "nvim";
    nv = "nvim";
    tt = "taskwarrior-tui";
  
    # Git
    gst = "git status";
    gtc = "git commit";
    gtcm = "git commit -m ";
    gtp = "git push";
    gds = "git diff --staged";
    gtd = "git diff";

    # Devshells
    cshell = "nix-shell ${self}/devshell/c-shell.nix";
    pyshell = "nix-shell ${self}/devshell/python-shell.nix";
    texshell = "nix-shell ${self}/devshell/latex-shell.nix";

    # Development
    py = "python3";
    m = "make";
  };
}
