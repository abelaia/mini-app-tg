export const text = (value) => typeof value === 'string' ? value.trim() : ''
export const length = (value) => Array.from(text(value)).length
export const required = (value) => text(value) ? '' : 'Заполните это поле'
export const maxLength = (limit) => (value) => length(value) <= limit ? '' : `Не больше ${limit} символов`
export const slug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(value)) ? '' : 'Только строчные латинские буквы, цифры и дефисы между словами'
export const clock = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value ?? '') ? '' : 'Укажите время от 00:00 до 23:59'
export const oneOf = (values) => (value) => values.includes(value) ? '' : 'Выберите значение из списка'
export const validate = (value, rules) => rules.map(rule => rule(value)).find(Boolean) ?? ''
