import { readFile, writeFile } from "fs/promises"

const dist = new URL("../dist/", import.meta.url)
const html = await readFile(new URL("index.html", dist), "utf8")
await writeFile(new URL("404.html", dist), html)
console.log("OK: copied dist/index.html → dist/404.html")