# Auriga

My personal Nix configuration.

## Hosts

| Machine | Name | Purpose |
| -------------------- | ---------- | --------------------------------------- |
| Framework 13 | astarion | Daily driver |
| Lenovo Ideapad Flex 5 | gethsemane | Home server (former daily driver) |
| Surface Go 2 | archaea  | Travel laptop/tablet |

## Structure

```
.
├── hosts/     # configs for each machine
├── modules/   # configs for each feature
└── devshell/  # development shells
```

This config follows the [dendritic pattern](https://github.com/Doc-Steve/dendritic-design-with-flake-parts). A few of my favorite things about the structure are below.

### Modules are autodiscovered

`flake.nix` uses `import-tree`, which autodiscovers everything in my specified directories (`modules/` and `hosts/`). No more manual imports!

```nix
outputs =
  inputs:
  inputs.flake-parts.lib.mkFlake { inherit inputs; } (
    inputs.import-tree [
      ./modules
      ./hosts
    ]
  );
```

### Aspect-oriented modules

Instead of one big config per host, each module declares a named "aspect" - a self-contained piece of config exposed as `flake.modules.nixos.<name>` (or `flake.modules.homeManager.<name>`). A host then composes the aspects it wants by name:

```nix
imports = (with config.flake.modules.nixos; [
  backup
  caddy
  immich
  silverbullet
  tailscale
]);
```

This means:
- Modules exist completely independently of hosts.
- Hosts become just a list of aspects.
- Adding a feature to a host is a one-line change, since `import-tree` autodiscovers every module.

---

## Runbooks

### Restoring backups

Backups run nightly via `services.restic.backups` (`modules/backup.nix`) to two backup repositories:
- `daily-cloud`: Backblaze B2
- `daily-blackreach`: local HDD

NixOS auto-generates a wrapper script per backup job with credentials already wired in: `restic-daily-cloud` and `restic-daily-blackreach`, available as root on `gethsemane`.

#### List snapshots

```sh
sudo restic-daily-cloud snapshots
```

#### Browse snapshots interactively

This mounts the repo as a real filesystem so it can be browsed with `lf`.

```sh
mkdir -p /mnt/restic
sudo restic-daily-cloud mount /mnt/restic

# in another shell:
sudo lf /mnt/restic

# when done:
fusermount -u /mnt/restic
```
