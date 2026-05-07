import { db } from '../lib/db/prisma'
import { resolveCategory } from '../lib/parser/category-map'

async function main() {
  const allBookmarks = await db.bookmark.findMany({
    select: { id: true, folder: true },
  })

  let updated = 0
  let unmapped = 0
  const unmappedFolders = new Set<string>()

  for (const b of allBookmarks) {
    const folder = b.folder?.trim()
    const category = resolveCategory(folder)

    if (!category && folder) {
      unmapped++
      unmappedFolders.add(folder)
    }

    await db.bookmark.update({
      where: { id: b.id },
      data: {
        category,
        subfolder: folder || null,
      },
    })
    updated++
  }

  console.log(`Updated: ${updated}`)
  console.log(`Unmapped: ${unmapped}`)
  if (unmappedFolders.size > 0) {
    console.log('Unmapped folders:')
    for (const f of [...unmappedFolders].sort()) {
      console.log(`  - ${f}`)
    }
  }
  await db.$disconnect()
}

main().catch(console.error)
