# Auriga

Personal Nix configuration.

## Devices

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

## Applications
- nvim (nvchad)
- hyprland
- zsh
- lf (terminal file manager) with neat audio/image preview
- custom desktop shell made with qt/c++
  - new shell: labyrinthine (qt/c++)
  - old shell: [ags v2 (typescript+sass)](https://github.com/garado/ags-shell/)

## Home server (gethsemane)

- Immich (photo management)
- Homebox (home inventory)
- Paperless-ngx (documents)
- Syncthing for music/ledger files
- Nightly Restic backups to B2 + local
- TODO: TaskWarrior server
- TODO: CalDAV/CardDAV server
