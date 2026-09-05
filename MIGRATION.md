# Dendritic migration

## Rules
- One item = one new file + wire into host imports + `git add -A` + build + commit.
- Build cmd: `nix build --no-link .#nixosConfigurations.astarion.config.system.build.toplevel`
- Green → commit. Red → stop, fix.
- Host-only bits: stay inline in `modules/hosts/astarion.nix`

## Scaffold
- [x] flake.nix = flake-parts + import-tree
- [x] modules/systems.nix (imports flakeModules.modules)
- [x] modules/formatter.nix
- [x] modules/configuration.nix (hosts/* -> nixosConfigurations)
- [x] modules/home-manager.nix (scrubbed inputs)
- [x] modules/hosts/astarion.nix minimal bootable

## Shared NixOS modules (reusable by archaea/gethsemane later)
- [X] nixos/nix-settings.nix   — nix.settings (experimental-features, auto-optimise-store)
- [X] nixos/locale.nix         — time.timeZone, i18n, console
- [X] nixos/mdns.nix           — services.avahi + services.resolved + networkmanager.dns + UDP 5353
- [X] nixos/editor.nix         — environment.variables/sessionVariables EDITOR/VISUAL
- [X] nixos/bluetooth.nix      — hardware.bluetooth
- [X] nixos/audio.nix          — services.pipewire (alsa/pulse/wireplumber) + security.rtkit
- [X] nixos/desktop.nix        — greetd/tuigreet, xserver.enable, xdg.portal, gnome-keyring,
                                  pam.services.greetd.enableGnomeKeyring, gvfs, tumbler, upower
- [X] nixos/fonts.nix          — port pre-dendritic/hosts/astarion/nixos/fonts.nix
- [X] nixos/steam.nix          — programs.steam
- [X] nixos/tailscale.nix      — services.tailscale (authKeyFile stays host-specific? see notes)

## Features (nixos + home-manager halves in one file)
- [X] features/hyprland.nix    — programs.hyprland + wayland.windowManager.hyprland
                                  (from pre-dendritic/modules/home/hyprland)
- [X] features/thunar.nix      — programs.thunar + thunar plugins
- [X] features/git.nix         — programs.git (system lfs) + hm programs.git settings

## Home modules
- [X] home/nvim.nix
- [X] home/lf.nix
- [X] home/zsh.nix             — merge pre-dendritic/modules/home/zsh + hosts/astarion/home/zsh
- [X] home/kitty.nix
- [X] home/gtk.nix
- [ ] home/astarion.nix        — the rest of hosts/astarion/home/home.nix (labyrinthine, mpd, etc.)

## Stays inline in modules/hosts/astarion.nix (host-specific, do last)
- [X] boot: kernelModules, blacklistedKernelModules, kernelParams
- [X] networking: firewall TCP 22, checkReversePath = "loose"
- [X] sops: defaultSopsFile + all secrets (owners/modes)
- [ ] services.auriga-syncthing + the 4 music/ledger paths
- [X] security.sudo framework-tool NOPASSWD rule
- [X] services.usbmuxd (iPhone)
- [X] environment.systemPackages grab-bag (trim later; audit item)
- [X] nixpkgs allowUnfreePredicate
- [X] musnix.enable + import musnix nixosModule
- [X] users.users.alexis full def (groups, shell)
- [X] wire home-manager.users.alexis.imports = home modules above

## After astarion is fully green + nixos-rebuild test OK
- [ ] git rm pre-dendritic/hosts/astarion, pre-dendritic/modules/home
- [ ] port archaea (reuses most nixos/ + home/ modules)
- [ ] port gethsemane (add modules/services/* for the selfhosted stack)
- [ ] delete pre-dendritic/, old flake cruft
- [ ] flip home-manager.useGlobalPkgs = true, rebuild, fix fallout
- [ ] nixos-rebuild switch all 3 hosts, reboot astarion, verify audio
