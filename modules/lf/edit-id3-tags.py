import os
import subprocess
import sys
import tempfile

from mutagen import File as MutagenFile
from mutagen.easyid3 import EasyID3
from mutagen.id3 import COMM

EasyID3.RegisterKey(
    "comment",
    lambda id3, key: [str(frame) for frame in id3.getall("COMM")],
    lambda id3, key, value: (
        id3.delall("COMM"),
        id3.add(COMM(encoding=3, lang="eng", desc="", text=value)),
    ),
    lambda id3, key: id3.delall("COMM"),
)

EasyID3.RegisterTextKey("releasedate", "TDRL")

FIELDS = [
    "title",
    "artist",
    "album",
    "albumartist",
    "tracknumber",
    "discnumber",
    "date",
    "releasedate",
    "genre",
    "comment",
    "composer",
    "compilation",
    "titlesort",
    "artistsort",
    "albumsort",
    "albumartistsort",
    "composersort",
    "conductor",
    "arranger",
    "lyricist",
    "mood",
    "bpm",
    "grouping",
    "discsubtitle",
    "organization",
    "catalognumber",
    "isrc",
    "barcode",
    "asin",
    "copyright",
    "language",
    "media",
    "encodedby",
    "website",
    "version",
    "author",
    "originaldate",
    "releasecountry",
    "performer",
    "musicbrainz_albumid",
    "musicbrainz_albumartistid",
    "musicbrainz_artistid",
    "musicbrainz_trackid",
    "musicbrainz_releasetrackid",
    "musicbrainz_releasegroupid",
    "musicbrainz_discid",
    "musicbrainz_workid",
    "musicbrainz_albumstatus",
    "musicbrainz_albumtype",
    "musicbrainz_trmid",
]


def read_tags(path):
    audio = MutagenFile(path, easy=True)
    if audio is None:
        return {}
    return {field: (audio.get(field) or [""])[0] for field in FIELDS}


def read_extra_tags(path):
    """Any other tag present on the file with a value, outside of FIELDS."""
    audio = MutagenFile(path, easy=True)
    if audio is None:
        return {}
    extra = {}
    for key in audio.keys():
        if key in FIELDS:
            continue
        values = audio.get(key)
        if not values:
            continue
        value = values[0] if isinstance(values, list) else values
        if value:
            extra[key] = value
    return extra


def write_tags(path, tags):
    audio = MutagenFile(path, easy=True)
    if audio is None:
        return
    for field, value in tags.items():
        if value:
            audio[field] = value
        elif field in audio:
            del audio[field]
    audio.save()


def main():
    files = sys.argv[1:]
    if not files:
        return

    original_keys = {}

    with tempfile.NamedTemporaryFile(mode="w", suffix=".tags", delete=False) as tmp:
        tmp_path = tmp.name
        for path in files:
            tags = read_tags(path)
            extra = read_extra_tags(path)
            original_keys[path] = set(FIELDS) | set(extra)
            tmp.write(f"# FILE: {path}\n")
            for field in FIELDS:
                tmp.write(f"{field}: {tags.get(field, '')}\n")
            if extra:
                tmp.write("# --- other tags found on file ---\n")
                for key, value in sorted(extra.items()):
                    tmp.write(f"{key}: {value}\n")
            tmp.write("\n")

    subprocess.run([os.environ.get("EDITOR", "nvim"), tmp_path])

    sections = {}
    current_file = None
    current_tags = {}
    with open(tmp_path) as f:
        for line in f:
            line = line.rstrip("\n")
            if line.startswith("# FILE: "):
                if current_file:
                    sections[current_file] = current_tags
                current_file = line.removeprefix("# FILE: ").strip()
                current_tags = {}
            elif line.startswith("#"):
                continue
            elif ":" in line and current_file:
                key, _, value = line.partition(":")
                key = key.strip()
                if key:
                    current_tags[key] = value.strip()
        if current_file:
            sections[current_file] = current_tags

    os.unlink(tmp_path)

    for path, keys in original_keys.items():
        tags = sections.setdefault(path, {})
        for key in keys:
            if key not in tags:
                tags[key] = ""

    for path, tags in sections.items():
        write_tags(path, tags)


if __name__ == "__main__":
    main()
