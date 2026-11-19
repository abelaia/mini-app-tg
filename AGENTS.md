# Code style

- Use 4 spaces for every indentation level. Do not use literal tabs.
- Write readable multiline code. Do not put several CSS/SCSS declarations, control-flow statements, or template elements on one line.
- Put each CSS/SCSS declaration on its own line and separate nested selectors with blank lines.
- Always leave an empty line between adjacent style blocks, including after a closing `}` and before the next selector. Also separate declarations from the first nested selector with an empty line.
- Put Vue attributes on separate lines when an element has multiple attributes. Indent script and style contents consistently.
- Follow `.editorconfig` and `.prettierrc.json`. Run `npm run format` and `npm run format:check` from `frontend`.
- For Go, run `scripts/format-go.ps1` from the project root. It applies gofmt, then converts tabs to 4 spaces to honor the project's explicit style preference.
- Do not format generated files, dependency directories, database files, local environment settings, or binary assets.
- Preserve existing uncommitted changes. Keep local design notes and screenshots out of commits.
- Branch names must describe the task, e.g. `feature/admin-panel` or `fix/reminders`; do not include tool names.
