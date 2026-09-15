# ▀█▀ █▀▄▀█ █░█ ▀▄▀
# ░█░ █░▀░█ █▄█ █░█

{
  flake.modules.homeManager.tmux = {
    programs.tmux = {
      enable = true;

      terminal = "tmux-256color";
      mouse = true;
      escapeTime = 10;
      focusEvents = true;
      historyLimit = 10000;
      keyMode = "vi";

      extraConfig = ''
        # restore undercurl/colored-underline support lost from reporting
        # xterm-256color instead of xterm-kitty (see modules/kitty)
        set -as terminal-overrides ",*:Tc"
        set -as terminal-overrides ",*:Smulx=\E[4::%p1%dm"
        set -as terminal-overrides ",*:Setulc=\E[58::2::%p1%{65536}%/%d::%p1%{256}%/%{255}%&%d::%p1%{255}%&%d%;m"

        # let apps (nvim) OSC52 copy through to the outer terminal (kitty)
        set -g set-clipboard on
      '';
    };
  };
}
