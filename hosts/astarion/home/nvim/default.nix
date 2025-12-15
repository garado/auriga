
# █▄░█ █▀▀ █▀█ █░█ █ █▀▄▀█
# █░▀█ ██▄ █▄█ ▀▄▀ █ █░▀░█

{ pkgs, config, fetchFromGitHub, ... }: {
  programs.neovim = {
    enable = true;

    # For TaskWiki
    withPython3 = true;
    extraPython3Packages = (ps: with ps; [
      pynvim
      tasklib
      six
      packaging
    ]);

  };

  # Install NvChad
  xdg.configFile."nvim".source = pkgs.stdenv.mkDerivation {
    name = "NvChad";

    src = pkgs.fetchFromGitHub {
      owner = "NvChad";
      repo = "NvChad";
      rev = "5189f3e32c87478632bb471817db1df13f8b16d1";
      hash = "sha256-P5TRjg603/7kOVNFC8nXfyciNRLsIeFvKsoRCIwFP3I=";
    };

    # Copy custom NvChad config
    installPhase = ''
    mkdir -p $out
    cp -r ./* $out/
    cd $out/
    ln -sf /home/alexis/Github/dotfiles/hosts/astarion/home/programs/nvim/nvchad-custom/ $out/lua/custom
    '';

    # installPhase = ''
    # mkdir -p $out
    # cp -r ./* $out/
    # cd $out/
    # cp -r ${./nvchad-custom} $out/lua/custom
    # '';
  };
}
