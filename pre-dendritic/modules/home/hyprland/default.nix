# █░█ █▄█ █▀█ █▀█ █░░ ▄▀█ █▄░█ █▀▄
# █▀█ ░█░ █▀▀ █▀▄ █▄▄ █▀█ █░▀█ █▄▀

{
  inputs,
  lib,
  config,
  pkgs,
  ...
}:
{
  wayland.windowManager.hyprland = {
    enable = true;
    systemd.enable = true;

    plugins = with pkgs.hyprlandPlugins; [
      hyprsplit
    ];

    settings = {
      plugin = {
        hyprsplit = {
          num_workspaces = 9;
          persistent_workspaces = false;
        };
      };

      misc = {
        disable_hyprland_logo = true;
        disable_splash_rendering = true;
        enable_swallow = true;
        mouse_move_focuses_monitor = true;
        animate_manual_resizes = true;
      };

      env = [
        "XCURSOR_THEME,Bibata-Modern-Classic"
        "XCURSOR_SIZE,24"
        "HYPRCURSOR_THEME,Bibata-Modern-Classic"
        "HYPRCURSOR_SIZE,24"
      ];

      input = {
        kb_layout = "us";
        follow_mouse = 1;
        touchpad = {
          natural_scroll = "no";
        };
        sensitivity = 0;
      };

      general = {
        gaps_in = 5;
        gaps_out = 15;
        border_size = 2;
        "col.active_border" = "rgba(7d6a4faa)";
        "col.inactive_border" = "rgba(141414aa)";
        layout = "dwindle";
      };

      decoration = {
        rounding = 10;
        shadow = {
          enabled = true;
          range = 10;
          render_power = 3;
          color = "rgba(1a1a1aee)";
        };
      };

      layerrule = "animation slide, gtk4-layer-shell";

      animations = {
        enabled = "yes";
        animation = [
          "workspaces, 1, 2, default, slidevert"
          "windows, 1, 2, default, slide"
          "windowsMove, 1, 2, default"
        ];
      };

      windowrule = [
        "float, class:^(thunar)$"
        "float, class:^(mpv)$"
      ];

      dwindle = {
        pseudotile = "yes";
        preserve_split = "yes";
      };

      "$mainMod" = "SUPER";

      binde = [
        ", XF86MonBrightnessUp, exec, brightnessctl set 10+"
        ", XF86MonBrightnessDown, exec, brightnessctl set 10-"
        ", XF86AudioLowerVolume, exec, wpctl set-volume @DEFAULT_SINK@ 5%- --limit 1"
        ", XF86AudioRaiseVolume, exec, wpctl set-volume @DEFAULT_SINK@ 5%+ --limit 1"
      ];

      bind = [
        ", XF86AudioMute, exec, wpctl set-mute @DEFAULT_SINK@ toggle"
        ", XF86AudioPrev, exec, playerctl previous"
        ", XF86AudioNext, exec, playerctl next"
        ", XF86AudioPlay, exec, playerctl play-pause"

        "CTRL SHIFT, w, killactive"

        "ALT_L SHIFT, L, exec, astal -i lock lock"
        "ALT_L SHIFT, r, exec, pkill labyrinthine ; labyrinthine"

        "$mainMod SHIFT, s, exec, grimblast copy area"

        "$mainMod, RETURN, exec, kitty"
        "$mainMod, J, exec, labyrinthine-ctl toggle dash"
        "$mainMod, H, exec, labyrinthine-ctl toggle utility"
        "$mainMod, L, exec, labyrinthine-ctl toggle control"
        "$mainMod, R, exec, labyrinthine-ctl toggle launcher"

        "ALT_L, TAB, cyclenext"
        "ALT_L SHIFT, TAB, cyclenext, prev"
        "ALT_L, h, movefocus, l"
        "ALT_L, l, movefocus, r"
        "ALT_L, j, movefocus, u"
        "ALT_L, k, movefocus, d"

        "ALT_L, 1, split:workspace, 1"
        "ALT_L, 2, split:workspace, 2"
        "ALT_L, 3, split:workspace, 3"
        "ALT_L, 4, split:workspace, 4"
        "ALT_L, 5, split:workspace, 5"
        "ALT_L, 6, split:workspace, 6"
        "ALT_L, 7, split:workspace, 7"
        "ALT_L, 8, split:workspace, 8"
        "ALT_L, 9, split:workspace, 9"

        "$mainMod, TAB, workspace, +1"
        "$mainMod SHIFT, TAB, workspace, -1"

        "ALT_L SHIFT, 1, split:movetoworkspace, 1"
        "ALT_L SHIFT, 2, split:movetoworkspace, 2"
        "ALT_L SHIFT, 3, split:movetoworkspace, 3"
        "ALT_L SHIFT, 4, split:movetoworkspace, 4"
        "ALT_L SHIFT, 5, split:movetoworkspace, 5"
        "ALT_L SHIFT, 6, split:movetoworkspace, 6"
        "ALT_L SHIFT, 7, split:movetoworkspace, 7"
        "ALT_L SHIFT, 8, split:movetoworkspace, 8"
        "ALT_L SHIFT, 9, split:movetoworkspace, 9"

        "ALT_L CTRL, h, resizeactive, -90 0"
        "ALT_L CTRL, l, resizeactive, 90 0"
        "ALT_L CTRL, j, resizeactive, 0 90"
        "ALT_L CTRL, k, resizeactive, 0 -90"

        "ALT_L SHIFT, h, movewindow, l"
        "ALT_L SHIFT, l, movewindow, r"
        "ALT_L SHIFT, j, movewindow, u"
        "ALT_L SHIFT, k, movewindow, d"

        "$mainMod, f, fullscreen"
        "$mainMod, m, fullscreen, 1"
        "$mainMod, v, togglefloating"
        "$mainMod, s, pin"

        "$mainMod SHIFT, h, focusmonitor, l"
        "$mainMod SHIFT, j, focusmonitor, d"
        "$mainMod SHIFT, k, focusmonitor, u"
        "$mainMod SHIFT, l, focusmonitor, r"
      ];

      bindm = [
        "$mainMod, mouse:272, movewindow"
        "$mainMod, mouse:273, resizewindow"
      ];
    };
  };
}
