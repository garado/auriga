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

This config follows the [dendritic pattern](https://github.com/Doc-Steve/dendritic-design-with-flake-parts).

A few of my favorite things about my config structure:
- **Modules are autodiscovered.** With `import-tree`, every Nix file in `modules/` and `hosts/` is autodiscovered, so I almost never have to manually import anything.
- **Feature-oriented modules.** In my old setup, if I wanted to set up some feature that had a NixOS config and a Home Manager config, the two halves lived in separate files. Now they're combined in a single file, so everything about a feature - the system-level service, the user-level program config, any relevant packages, etc. - all live in a single file (or directory).
- **Modular host configs.** Because of the above, adding a feature to a host is as simple as adding one line to the host's import list.
- **Work configs are kept private.** At work I use nixpkgs/home-manager. I want to keep them version controlled here, but also keep them private. git-crypt encrypts those files so I can do both.

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

#### Restore a single file

```sh
sudo restic-daily-cloud dump latest /path/inside/repo > recovered-file
```

#### Restore a full snapshot to a directory

```sh
sudo restic-daily-cloud restore latest --target /path/to/restore-here
```

### Decrypting files with git-crypt

1. Install git-crypt on target machine: `nix shell nixpkgs#git-crypt`
2. Copy key to target machine.
3. `git-crypt unlock $PATH_TO_KEY`
