# █▀▀ █ █▀█ █▀▀ █▀▀ █▀█ ▀▄▀
# █▀░ █ █▀▄ ██▄ █▀░ █▄█ █░█

{
  flake.modules.homeManager.firefox =
    { pkgs, ... }:
    let
      profilePath = "l47sq8qz.default";

      # https://github.com/DivitMittal/firefox-nixCfg
      # https://github.com/MrOtherGuy/firefox-csshacks
      fxCsshacks = pkgs.fetchFromGitHub {
        owner = "MrOtherGuy";
        repo = "firefox-csshacks";
        rev = "7f4848d17e4ccf6a96a47ac9d017bb3a919d8bce";
        sha256 = "1340f3xgd0i0k6drkphkxlas33h4piiy8i6fnigsg7xd5ym7zg1b";
      };
    in
    {
      programs.firefox = {
        enable = true;

        profiles.default = {
          # pin to the existing profile (profiles.ini)
          id = 0;
          name = "default";
          path = profilePath;
          isDefault = true;

          settings = {
            "toolkit.legacyUserProfileCustomizations.stylesheets" = true;
            "sidebar.verticalTabs" = true;
            "sidebar.revamp" = true;
          };

          userChrome = ''
            @charset "UTF-8";

            @import url(CSS/fx-csshacks/chrome/toolbars_below_content_v2.css);

            @import url(CSS/fx-csshacks/chrome/hide_statuspanel_when_fullscreen.css);
            @import url(CSS/fx-csshacks/chrome/minimal_toolbarbuttons_v2.css);

            @import url(CSS/custom/right_margin.css);
            @import url(CSS/custom/minimal_bar.css);
          '';
        };
      };

      home.file = {
        ".mozilla/firefox/${profilePath}/chrome/CSS/fx-csshacks" = {
          source = fxCsshacks;
          recursive = true;
        };
        ".mozilla/firefox/${profilePath}/chrome/CSS/custom" = {
          source = ./firefox/custom-css;
          recursive = true;
        };
      };
    };
}
