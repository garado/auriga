# █▄▀ █ ▀█▀ ▀█▀ █▄█
# █░█ █ ░█░ ░█░ ░█░

{
  flake.modules.homeManager.kitty = {
    programs.kitty = {
      enable = true;

      font = {
        name = "Ioskeley Mono";
        size = 15.0;
      };

      settings = {
        window_padding_width = 20;
      };

      keybindings = {
        # broadcast: send input to every tab in the currently-focused Kitty window
        "ctrl+shift+alt+b" =
          "launch --allow-remote-control --type=overlay kitty +kitten broadcast --match state:focused_os_window";
      };

      extraConfig = ''
        cursor_blink_interval 0.5
        cursor_stop_blinking_after 0
        scrollback_lines 5000
        enable_audio_bell no
        include current-theme.conf
        sync_to_monitor no

        # report xterm-256color instead of xterm-kitty so remote hosts
        # (and tmux) don't need the kitty terminfo entry installed
        term xterm-256color
      '';
    };

    xdg.configFile."kitty/themes".source = ./themes;
    xdg.configFile."kitty/sessions".source = ./sessions;
  };
}
