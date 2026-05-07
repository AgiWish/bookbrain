import { db } from '../lib/db/prisma'
import { resolveCategory } from '../lib/parser/category-map'

async function main() {
  const bookmarks = await db.bookmark.findMany({
    select: { id: true, subfolder: true, folder: true, category: true },
  })

  let updated = 0
  let unchanged = 0

  for (const b of bookmarks) {
    const subfolderName = b.subfolder ?? b.folder
    const newCategory = resolveCategory(subfolderName)

    if (newCategory && newCategory !== b.category) {
      await db.bookmark.update({
        where: { id: b.id },
        data: { category: newCategory },
      })
      console.log(`  ${b.category} → ${newCategory}: ${subfolderName}`)
      updated++
    } else {
      unchanged++
    }
  }

  console.log(`\nDone: ${updated} updated, ${unchanged} unchanged`)
}

main().finally(() => db.$disconnect())
