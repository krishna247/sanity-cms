#!/usr/bin/env python3
"""
Transform export NDJSON from the old `post` schema (zctfdj1t / ajw4irs3:old)
into the new `blogPost` schema for ajw4irs3:production.

Diffs handled:
  - _type: post -> blogPost
  - featuredImage: image w/ inline alt -> imageWithAlt {image, alt, caption}
  - body inline _type: image -> _type: imageWithAlt {image, alt, caption}
  - seo: {title, description, image} -> {metaTitle, metaDescription, ogImage}
  - drop updatedAt, wpSlug
  - Filter docs to keep only: blogPost, author, category
"""

import json
import sys
from pathlib import Path

KEEP_TYPES = {"post", "author", "category"}


def transform_image_to_image_with_alt(node: dict) -> dict:
    """Old inline `_type: image` -> new `_type: imageWithAlt`.

    Old: {_type: 'image', _sanityAsset|asset, alt, caption?, _key}
    New: {_type: 'imageWithAlt', _key, alt, caption?, image: {_type: 'image', _sanityAsset|asset, crop?, hotspot?}}
    """
    out = {"_type": "imageWithAlt"}
    if "_key" in node:
        out["_key"] = node["_key"]
    out["alt"] = node.get("alt") or ""
    if "caption" in node and node["caption"]:
        out["caption"] = node["caption"]

    inner = {"_type": "image"}
    for k in ("_sanityAsset", "asset", "crop", "hotspot"):
        if k in node:
            inner[k] = node[k]
    out["image"] = inner
    return out


def transform_featured_image(fi: dict) -> dict:
    """Old featuredImage (image w/ inline alt) -> new imageWithAlt object."""
    out = {"_type": "imageWithAlt"}
    out["alt"] = fi.get("alt") or ""
    inner = {"_type": "image"}
    for k in ("_sanityAsset", "asset", "crop", "hotspot"):
        if k in fi:
            inner[k] = fi[k]
    out["image"] = inner
    return out


def transform_seo(seo: dict) -> dict:
    """Rename seo fields to match new schema."""
    out = {"_type": "seo"}
    if "title" in seo:
        out["metaTitle"] = seo["title"]
    if "description" in seo:
        out["metaDescription"] = seo["description"]
    if "image" in seo:
        out["ogImage"] = seo["image"]
    if "noIndex" in seo:
        out["noIndex"] = seo["noIndex"]
    return out


def transform_body(body: list) -> list:
    out = []
    for node in body:
        if isinstance(node, dict) and node.get("_type") == "image":
            out.append(transform_image_to_image_with_alt(node))
        else:
            out.append(node)
    return out


def transform_post(doc: dict) -> dict:
    new = {**doc}
    new["_type"] = "blogPost"
    new.pop("updatedAt", None)
    new.pop("wpSlug", None)
    if "featuredImage" in new and isinstance(new["featuredImage"], dict):
        new["featuredImage"] = transform_featured_image(new["featuredImage"])
    if "body" in new and isinstance(new["body"], list):
        new["body"] = transform_body(new["body"])
    if "seo" in new and isinstance(new["seo"], dict):
        new["seo"] = transform_seo(new["seo"])
    return new


def main(in_path: str, out_path: str) -> None:
    kept = 0
    dropped = 0
    counts: dict[str, int] = {}
    with open(in_path) as fin, open(out_path, "w") as fout:
        for line in fin:
            doc = json.loads(line)
            t = doc.get("_type")
            if t not in KEEP_TYPES:
                dropped += 1
                continue
            if t == "post":
                doc = transform_post(doc)
            counts[doc["_type"]] = counts.get(doc["_type"], 0) + 1
            kept += 1
            fout.write(json.dumps(doc, ensure_ascii=False) + "\n")
    print(f"kept={kept} dropped={dropped}")
    print(f"by type: {counts}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
