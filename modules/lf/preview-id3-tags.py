import sys

from mutagen import File as MutagenFile


def main():
    if len(sys.argv) < 2:
        return

    path = sys.argv[1]
    audio = MutagenFile(path, easy=True)
    if audio is None:
        print("(unreadable audio file)")
        return

    if audio.info is not None:
        length = getattr(audio.info, "length", None)
        bitrate = getattr(audio.info, "bitrate", None)
        if length is not None:
            mins, secs = divmod(int(length), 60)
            print(f"length: {mins}:{secs:02d}")
        if bitrate is not None:
            print(f"bitrate: {bitrate // 1000} kbps")
        print()

    for key in sorted(audio.keys()):
        values = audio.get(key) or []
        value = ", ".join(str(v) for v in values)
        if value:
            print(f"{key}: {value}")


if __name__ == "__main__":
    main()
