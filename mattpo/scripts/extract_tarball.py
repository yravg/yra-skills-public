#!/usr/bin/env python3
"""Extract a GitHub repo tarball without following links or writing outside dest.

The first path component is the GitHub archive prefix and is stripped.
Symlinks, hard links, devices, and paths that escape dest are refused.
"""
import pathlib
import sys
import tarfile


def strip_top(name):
    parts = name.split("/")
    if len(parts) <= 1:
        return ""
    return "/".join(parts[1:])


def unsafe(rel):
    if not rel or "\0" in rel or "\\" in rel or rel.startswith("/"):
        return True
    parts = pathlib.PurePosixPath(rel).parts
    return any(part in ("", ".", "..") for part in parts)


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: extract_tarball.py <tarball> <dest>")
    tar_path, dest = sys.argv[1], pathlib.Path(sys.argv[2]).resolve()
    dest.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tar_path, "r:*") as tar:
        for member in tar.getmembers():
            rel = strip_top(member.name)
            if not rel:
                continue
            if member.issym() or member.islnk() or member.isdev() or member.isfifo():
                sys.exit(f"refusing special entry: {member.name}")
            if unsafe(rel):
                sys.exit(f"refusing path: {member.name}")
            target = (dest / rel).resolve()
            if target != dest and dest not in target.parents:
                sys.exit(f"refusing escape: {member.name}")
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            if not member.isfile():
                sys.exit(f"refusing non-file: {member.name}")
            source = tar.extractfile(member)
            if source is None:
                sys.exit(f"missing data: {member.name}")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read())
    print("ok")


if __name__ == "__main__":
    main()
