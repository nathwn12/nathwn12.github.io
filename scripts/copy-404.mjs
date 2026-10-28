import { copyFile, readFile, writeFile } from "fs/promises"

const dist = new URL("../dist/", import.meta.url)
const documents = [
  "Nathaniel-Nikolai-Ladero-Resume.pdf",
  "Nathaniel-Nikolai-Ladero-CV.pdf",
]

try {
  for (const name of documents) {
    await copyFile(
      new URL(`../${name}`, import.meta.url),
      new URL(name, dist),
    )
    console.log(`OK: copied ${name} → dist/${name}`)
  }
  const html = await readFile(new URL("index.html", dist), "utf8")
  await writeFile(new URL("404.html", dist), html)
  console.log("OK: copied dist/index.html → dist/404.html")
} catch (err) {
  console.error(
    "copy-404: failed to copy production fallback assets:",
    err instanceof Error ? err.message : err,
  )
  process.exit(1)
}
