# █▀▀ █ ▀█▀
# █▄█ █ ░█░
{

  flake.modules.nixos.git = {
    programs.git = {
      enable = true;
      lfs.enable = true;
    };
  };

  flake.modules.homeManager.git = {
    programs.git = {
      enable = true;
      settings = {
        user.name = "garado";
        user.email = "alexisgarado@gmail.com";
        core.quotepath = false;
        i18n.commitencoding = "utf-8";
        i18n.logoutputencoding = "utf-8";
      };
    };
  };
}
