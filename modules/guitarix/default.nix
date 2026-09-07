# █▀▀ █░█ █ ▀█▀ ▄▀█ █▀█ █ ▀▄▀
# █▄█ █▄█ █ ░█░ █▀█ █▀▄ █ █░█

# Realtime audio setup for guitarix / JACK

{ inputs, ... }:
{
  flake.modules.nixos.guitarix =
    { pkgs, ... }:
    {
      imports = [ inputs.musnix.nixosModules.musnix ];

      musnix.enable = true;

      # MIDI sequencer + raw MIDI device access, for JACK/guitarix routing
      boot.kernelModules = [
        "snd-seq"
        "snd-rawmidi"
      ];

      environment.systemPackages = with pkgs; [
        # auto-start qjackctl when guitarix starts
        (guitarix.overrideAttrs (old: {
          nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ [ makeWrapper ];
          postFixup = ''
            wrapProgram $out/bin/guitarix \
              --run 'pgrep -x qjackctl >/dev/null || (qjackctl >/dev/null 2>&1 &)'
          '';
        }))

        qjackctl
        libjack2
        jack2
        jack_capture
      ];
    };
}
