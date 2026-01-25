<h1>Auriga</h1>
Personal Nix configuration.

<h2>Devices</h2>
<table>
  <tr>
    <th>Machine</th>
    <th>Name</th>
    <th>Purpose</th>
  </tr>
  <tr>
    <td>Framework 13</td>
    <td>astarion</td>
    <td>Daily driver</td>
  </tr>
  <tr>
    <td>Lenovo Ideapad Flex 5</td>
    <td>gethsemane</td>
    <td>Home server</td>
  </tr>
  <tr>
    <td>Surface Go 2</td>
    <td>archaea</td>
    <td>(WIP) Wall-mounted home dashboard</td>
  </tr>
</table>

<h2>Structure</h2>
<pre>
.
├── hosts/          # per-machine configs
├── modules/        # shared NixOS/home manager modules
├── devshell/       # development shells
└── secrets.yaml    # sops-encrypted secrets
</pre>

<h2>Applications</h2>
<ul>
  <li>nvim (nvchad)</li>
  <li>hyprland</li>
  <li>zsh</li>
  <li>lf (terminal file manager) with neat audio/image preview</li>
  <li>custom desktop shell made with qt/c++</li>
  <ul>
    <li>new shell: labyrinthine (qt/c++)</li>
    <li>old shell: <a href="https://github.com/garado/ags-shell/" target="_blank">ags v2 (typescript+sass)</a></li>
  </ul>
</ul>

<h2>Home server (gethsemane)</h2>
<ul>
  <li>Immich (photo management)</li>
  <li>Homebox (home inventory)</li>
  <li>Syncthing for music/ledger files</li>
  <li>Nightly Restic backups to B2 + local</li>
  <li>TODO: TaskWarrior server</li>
  <li>TODO: CalDAV/CardDAV server</li>
</ul>
