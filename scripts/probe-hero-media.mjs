import {getCliClient} from 'sanity/cli'
const client = getCliClient().withConfig({dataset: 'production'})

// What hero media does home + each project resolve to? We need to know whether a
// real <video> exists (so VideoObject is honest) and its Sanity videoUrl if any.
const rows = await client.fetch(`{
  "home": *[_id == "homePage"][0]{
    "heroBlocks": pageBuilder[_type in ["heroBlock","projectHeroBlock"]]{_type, "kind": media.kind, "videoUrl": media.video.asset->url}
  },
  "projects": *[_type == "project"]{
    "id": _id, "_updatedAt": _updatedAt, "segment": route.segment.current,
    "heroBlocks": pageBuilder[_type in ["heroBlock","projectHeroBlock"]]{_type, "kind": media.kind, "videoUrl": media.video.asset->url}
  }
}`)
console.log(JSON.stringify(rows, null, 2))
