
# █░█ █▀█ █▀▄▀█ █▀▀   █▀▄▀█ ▄▀█ █▄░█ ▄▀█ █▀▀ █▀▀ █▀█
# █▀█ █▄█ █░▀░█ ██▄   █░▀░█ █▀█ █░▀█ █▀█ █▄█ ██▄ █▀▄

# User-specific configurations.

{ inputs, lib, config, pkgs, ... }: {

  imports = [
    # These come from inputs defined in `flake.nix`
    inputs.ags.homeManagerModules.default
  
    # Import other pieces of config
    ./programs
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
      obsidian qutebrowser

      # Development
      # TODO Needed for ags - move to shell.nix?
      dart-sass gnome.gvfs

      (python3.withPackages (ps: with ps; [
        # Packages from nixpkgs
        # requests
        # beautifulsoup4
        pynvim

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
      name = "WhiteSur-cursors";
      package = pkgs.whitesur-cursors;
      size = 24;
    };
  }; /* end home */

  gtk = {
    enable = true;
    font.name = "CircularStd";
    font.size = 14;
  };

  programs.ags = {
    enable = true;
    configDir = ./services/ags;

    extraPackages = with pkgs; [
      gtksourceview

      (python3.withPackages (ps: with ps; [
        (buildPythonPackage rec {
          pname = "quote";
          version = "3.0";
          src = fetchPypi {
            inherit pname version;
            sha256 = "06873dfed9200cb2e88f98c562080938b42c88d4a37dcf89542cff3a210b6287";
          };
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
  };

  programs.git = {
    enable = true;
    userName = "garado";
    userEmail = "alexisgarado@gmail.com";
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
    longitude = 121.9886;
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
