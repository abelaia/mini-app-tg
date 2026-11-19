const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../frontend/src')
const checking = process.argv.includes('--check')
const changed = []

function spaceBlocks(source) {
    const lines = source.split('\n')

    for (let index = lines.length - 1; index > 0; index -= 1) {
        const line = lines[index].trim()

        if (!line.endsWith('{') || !/^(?:[.&:#\[\w*\-]|@)/.test(line)) {
            continue
        }

        let start = index

        while (start > 0 && lines[start - 1].trim().endsWith(',')) {
            start -= 1
        }

        const previous = lines[start - 1]?.trim()

        if (previous && !previous.endsWith('{')) {
            lines.splice(start, 0, '')
        }
    }

    return lines.join('\n')
}

function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            visit(filename)
            continue
        }

        if (!/\.(vue|scss|css)$/.test(filename)) {
            continue
        }

        const original = fs.readFileSync(filename, 'utf8')
        const formatted = filename.endsWith('.vue')
            ? original.replace(
                  /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g,
                  (_, open, styles, close) => {
                      return open + spaceBlocks(styles) + close
                  },
              )
            : spaceBlocks(original)

        if (formatted !== original) {
            changed.push(path.relative(root, filename))

            if (!checking) {
                fs.writeFileSync(filename, formatted)
            }
        }
    }
}

visit(root)

if (checking && changed.length) {
    console.error('Add blank lines between style blocks:\n' + changed.join('\n'))
    process.exitCode = 1
} else {
    console.log(
        checking
            ? 'Style block spacing is consistent.'
            : `Spaced style blocks in ${changed.length} files.`,
    )
}
