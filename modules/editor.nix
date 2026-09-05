# █▀▀ █▀▄ █ ▀█▀ █▀█ █▀█
# ██▄ █▄▀ █ ░█░ █▄█ █▀▄

{
  flake.modules.nixos.editor = {
    environment.variables = {
      EDITOR = "nvim";
      VISUAL = "nvim";
    };
  };
}
