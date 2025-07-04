
# █▄▀ █ ▀█▀ ▀█▀ █▄█
# █░█ █ ░█░ ░█░ ░█░

{ pkgs, ... }: {
  programs.kitty = {
    enable = true;

    font = {
      name = "Mononoki";
      size = 15.0;
    };

    settings = {
      window_padding_width = 20;
    };

    extraConfig = ''
    cursor_blink_interval 0.5
    cursor_stop_blinking_after 0
    scrollback_lines 5000
    enable_audio_bell no
    include current-theme.conf
    sync_to_monitor no
    '';
  };
    
  # Symlink custom themes
  xdg.configFile."kitty/themes".source = ./themes;
  
  # Symlink sessions
  xdg.configFile."kitty/sessions".source = ./sessions;
}
