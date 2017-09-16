const path = require('path'),
  fs = require('fs')

const basepath = process.env.BASE_PATH,
  filenames = fs.readdirSync(basepath)

let entries = []
filenames.forEach(filename => {
  if (path.extname(filename) === '.json') {
    entries = entries.concat(JSON.parse(fs.readFileSync(path.join(basepath, filename))))
  }
})
entries.sort((a, b) => {
  return a.args[0] > b.args[0] ? 1 : a.args[0] < b.args[0] ? -1 : 0
})

let lastMs, count = 0, frame = []
for (let entry of entries) {
  const ms = entry && Array.isArray(entry.args) ? entry.args[0] : undefined
  if (ms) {
    if (lastMs && ms !== lastMs) {
      count++
      if (count % 10000 === 0) console.log(`${count} frames processed`)
      frame = []
    }
    frame.push(entry)
    lastMs = ms
  }
}
