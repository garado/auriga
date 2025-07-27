
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
<<<<<<< HEAD
    cursor_blink_interval 0.5
    cursor_stop_blinking_after 0
    scrollback_lines 5000
    enable_audio_bell no
    include current-theme.conf
    sync_to_monitor no
    '';
  };
    
=======
      cursor_blink_interval 0.5
      cursor_stop_blinking_after 0
      scrollback_lines 5000
      enable_audio_bell no
      include current-theme.conf
      sync_to_monitor no
      '';
  };

>>>>>>> develop
  # Symlink custom themes
  xdg.configFile."kitty/themes".source = ./themes;
  
  # Symlink sessions
  xdg.configFile."kitty/sessions".source = ./sessions;
}
