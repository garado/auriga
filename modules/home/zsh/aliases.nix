
# ▀█ █▀ █░█   ▄▀█ █░░ █ ▄▀█ █▀ █▀▀ █▀
# █▄ ▄█ █▀█   █▀█ █▄▄ █ █▀█ ▄█ ██▄ ▄█

# zsh aliases that can be globally copied to any machine.

{ self, pkgs, config, ... }: {
  programs.zsh.shellAliases = {
    # Shell commands
    c = "clear";
    l = "ls -X --group-directories-first";
    lsa = "ls -laX --group-directories-first";
    p = "pwd";
    pclip = "pwd | wl-copy";
    
    # Quick navigation
    ".."   = "cd ..";
    "..."  = "cd ../..";
    "...." = "cd ../../..";
    desk = "cd ~/Desktop";
    docs = "cd ~/Documents";
    mus  = "cd ~/Music";
    pics = "cd ~/Pictures";
    vids = "cd ~/Videos";
    gh   = "cd ~/Github";
    dl   = "cd ~/Downloads";

    # Nix
    rebuild = "sudo nixos-rebuild switch --flake .#$(hostname)";
    re = "rebuild";
    ndev = "nix develop --command zsh";

    # Shortcut for terminal programs
    v = "nvim";
    nv = "nvim";

    # Git
    gst = "git status";
    gtc = "git commit";
    gtcm = "git commit -m ";
    gtp = "git push";
    gtd = "git diff";
    gds = "git diff --staged";
    gta = "git add";
    gtl = "git log";
    gtrl = "git reflog";

    # Devshells
    cshell = "nix-shell ${self}/devshell/c-shell.nix";
    pyshell = "nix-shell ${self}/devshell/python-shell.nix";
    texshell = "nix-shell ${self}/devshell/latex-shell.nix";
  };

  programs.zsh.initContent = ''
    lfcd() {
      tmp="$(mktemp)"
      lf -last-dir-path="$tmp" "$@"
      if [ -f "$tmp" ]; then
        dir="$(cat "$tmp")"
        rm -f "$tmp"
        [ -d "$dir" ] && cd "$dir"
      fi
    }
    alias lf="lfcd"
  '';
}
