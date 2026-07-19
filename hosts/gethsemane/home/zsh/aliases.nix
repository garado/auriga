
# ▀█ █▀ █░█   ▄▀█ █░░ █ ▄▀█ █▀ █▀▀ █▀
# █▄ ▄█ █▀█   █▀█ █▄▄ █ █▀█ ▄█ ██▄ ▄█

# zsh aliases specific to @gethsemane.
# these will be merged with the global zsh config in ROOT/modules/home/zsh/.

{ self, pkgs, config, ... }: {
  programs.zsh.shellAliases = {
    # Run the nightly garado.github.io script on demand
    run-auto-wiki-pr = "sudo systemctl start --wait auto-wiki-pr.service";
    log-auto-wiki-pr = "journalctl -u auto-wiki-pr.service -e --no-pager";
  };
}
