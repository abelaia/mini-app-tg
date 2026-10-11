export const fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)

export function mod(block, modifiers = {}) {
  return [
    block,
    ...Object.entries(modifiers)
      .filter(([, value]) => value)
      .map(([name, value]) => (value === true ? `${block}--${name}` : `${block}--${name}-${value}`)),
  ]
}
