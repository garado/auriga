
# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# User-specific configurations.

{ self, inputs, lib, config, pkgs, ... }: {

  imports = [
    # Defined in flake.nix
    inputs.ags.homeManagerModules.default

    # Import other pieces of config
    ./gtk
    ./hyprland
    ./kitty
    ./lf
    ./nvim
    # ./qutebrowser
    ./taskwarrior
    ./zsh
  ];

  # Explicitly define allowed unfree packages
  nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) [
    "obsidian"
  ];

  home = {
    username = "alexis";

    homeDirectory = "/home/alexis";

    packages = with pkgs; [
      # Entertainment
      ncspot

      # Productivity
      obsidian

      inputs.ags.packages.${pkgs.system}.io

      (python3.withPackages (ps: with ps; [
        # Packages from nixpkgs
        pynvim
        pip

        # Build a package from PyPI
        (buildPythonPackage rec {
          pname = "quote";
          version = "3.0";
          src = fetchPypi {
            inherit pname version;
            sha256 = "06873dfed9200cb2e88f98c562080938b42c88d4a37dcf89542cff3a210b6287";
          };
          # Add any build inputs required by your package
          buildInputs = [];
        })

        (buildPythonPackage rec {
          pname = "gazpacho";
          version = "1.1";
          src = fetchPypi {
            inherit pname version;
            sha256 = "1579c1be2de05b5ded0a97107b179d12491392fb095aeab185b283ea48cd7010";
          };
        })

      ]))

    ];

    pointerCursor = {
      gtk.enable = true;
      x11.enable = true;
      package = pkgs.bibata-cursors;
      name = "Bibata-Modern-Classic";
      size = 24;
    };
  };

  gtk = {
    enable = true;
    cursorTheme = {
      name = "Bibata-Modern-Classic";
      package = pkgs.bibata-cursors;
    };
    font.name = "Karla";
    font.size = 14;
  };

  programs.ags = {
    enable = true;

    # symlinked to ~/.config/ags
    configDir = ./shell/ags-ts;

    extraPackages = with pkgs; [
      gtksourceview5 libpng /** Source code */
      libshumate /** Provides map widget for dashboard transit tab */
      gvfs imagemagick /** Cover art utils for media player */
      gtk-session-lock /** For lockscreen (written with gtk3) */
      inputs.ags.packages.${pkgs.system}.apps
      inputs.ags.packages.${pkgs.system}.auth
      inputs.ags.packages.${pkgs.system}.battery
      inputs.ags.packages.${pkgs.system}.bluetooth
      inputs.ags.packages.${pkgs.system}.cava
      inputs.ags.packages.${pkgs.system}.greet
      inputs.ags.packages.${pkgs.system}.hyprland
      inputs.ags.packages.${pkgs.system}.mpris
      inputs.ags.packages.${pkgs.system}.network
      inputs.ags.packages.${pkgs.system}.notifd
      inputs.ags.packages.${pkgs.system}.powerprofiles
      inputs.ags.packages.${pkgs.system}.wireplumber
    ];
  };

  programs.git = {
    enable = true;
    userName = "garado";
    userEmail = "alexisgarado@gmail.com";
    extraConfig = {
      core.quotepath = false;
      i18n.commitencoding = "utf-8";
      i18n.logoutputencoding = "utf-8";
    };
  };

  programs.ledger = {
    enable = true;
    settings = {
      file = "~/Enchiridion/self/ledger/2024/2024.ledger";
    };
  };

  services.gammastep = {
    enable = true;
    provider = "manual";
    latitude = 37.5485;
    longitude = -121.9886;
  };

  # Let home-manager install and manage itself
  programs.home-manager = {
    enable = true;
  };

  # Nicely reload system units when changing configs
  systemd.user.startServices = "sd-switch";

  # home-manager version
  home.stateVersion = "24.11";
}
