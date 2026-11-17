const SHOWS = [
  { id: 'dalekiy-gorod', title: 'Далекий город', translator: 'Сабина', day: 'monday', platform: 'Иви', url: 'https://www.ivi.ru' },
  { id: 'eto-prosto-stambul', title: 'Это просто Стамбул', translator: 'Диана', day: 'monday', platform: 'ВКонтакте', url: 'https://vk.com/turkdizionline' },
  { id: 'pod-zemley', title: 'Под землей', translator: 'Диана', day: 'wednesday', platform: 'ВКонтакте', url: 'https://vk.com/turkdizionline' },
  { id: 'lyubov-eto-ogon', title: 'Любовь — это огонь', translator: 'Севинч', day: 'wednesday', platform: 'ВКонтакте', url: 'https://vk.com/turkdizionline' },
  { id: 'eto-more-perepolnitsya', title: 'Это море переполнится', translator: 'Диана', day: 'friday', platform: 'ВКонтакте', url: 'https://vk.com/turkdizionline' },
  { id: 'rozy-i-grekhi', title: 'Розы и грехи', translator: 'Сабина', day: 'saturday', platform: 'Иви', url: 'https://www.ivi.ru' },
]

const DAYS = [
  { id: 'monday', full: 'Понедельник', short: 'Пн' },
  { id: 'tuesday', full: 'Вторник', short: 'Вт' },
  { id: 'wednesday', full: 'Среда', short: 'Ср' },
  { id: 'thursday', full: 'Четверг', short: 'Чт' },
  { id: 'friday', full: 'Пятница', short: 'Пт' },
  { id: 'saturday', full: 'Суббота', short: 'Сб' },
  { id: 'sunday', full: 'Воскресенье', short: 'Вс' },
]

const KINDS = [
  { id: 'repeat', title: 'Повтор', hint: 'повтор прошлой серии' },
  { id: 'premiere', title: 'Новая серия', hint: 'новая серия' },
]

const TIMES = { repeat: '20:00', premiere: '21:00' }

const INK = {
  'dalekiy-gorod': { a: '#243656', b: '#e0b15a', c: '#f6ead7' },
  'eto-prosto-stambul': { a: '#1d3e68', b: '#e7c98a', c: '#f8f1e3' },
  'pod-zemley': { a: '#3c2b24', b: '#e08a3c', c: '#f3dcc4' },
  'lyubov-eto-ogon': { a: '#8c2e28', b: '#f0a35e', c: '#ffe6c4' },
  'eto-more-perepolnitsya': { a: '#145e66', b: '#8fd0c8', c: '#e7f4f2' },
  'rozy-i-grekhi': { a: '#7a2340', b: '#e7a0b4', c: '#fde8ee' },
}

const LINKS = [
  { title: 'Сабина', text: 'Владелец и переводчик', url: 'https://t.me/sabqard' },
  { title: 'Канал', text: 'Новости и анонсы эфиров', url: 'https://t.me/+rboCXLMxn0QxNGM6' },
  { title: 'Афра Сарачоглу', text: 'Второй канал', url: 'https://t.me/afraramazandemir' },
]

const TABS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'about', label: 'Канал' },
]

const STORE_KEY = 'dizi-look-reminders'
const LOOKS = ['velvet', 'ceramic', 'poster']

const saved = localStorage.getItem(STORE_KEY)
const reminders = new Set(saved ? JSON.parse(saved) : ['pod-zemley|premiere'])

const ui = {
  velvet: { tab: 'today', day: '', toast: '', timer: 0 },
  ceramic: { tab: 'today', day: '', toast: '', timer: 0 },
  poster: { tab: 'today', day: '', toast: '', timer: 0 },
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

function moscowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type) => parts.find((part) => part.type === type)?.value || ''
  const weekday = pick('weekday').toLowerCase()
  const map = {
    понедельник: 'monday',
    вторник: 'tuesday',
    среда: 'wednesday',
    четверг: 'thursday',
    пятница: 'friday',
    суббота: 'saturday',
    воскресенье: 'sunday',
  }
  return {
    dayId: map[weekday] || 'monday',
    weekday,
    date: `${pick('day')} ${pick('month')}`,
    clock: `${pick('hour')}:${pick('minute')}`.replace(/\s/g, ''),
    minutes: Number(pick('hour')) * 60 + Number(pick('minute')),
  }
}

function dayById(id) {
  return DAYS.find((day) => day.id === id)
}

function showsOn(dayId) {
  return SHOWS.filter((show) => show.day === dayId)
}

function upcoming(dayId) {
  const start = DAYS.findIndex((day) => day.id === dayId)
  const items = []
  for (let step = 1; step <= 6 && items.length < 3; step += 1) {
    const day = DAYS[(start + step) % 7]
    showsOn(day.id).forEach((show) => {
      if (items.length < 3) items.push({ show, caption: step === 1 ? 'Завтра' : day.full })
    })
  }
  return items
}

function eventStatus(clock, minutes) {
  const [hour, minute] = clock.split(':').map(Number)
  const diff = hour * 60 + minute - minutes
  if (diff > 0) {
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    const label = hours ? `через ${hours} ч` : `через ${mins} мин`
    return { state: 'soon', label }
  }
  if (diff > -60) return { state: 'live', label: 'в эфире' }
  return { state: 'done', label: 'завершён' }
}

function minusTen(clock) {
  const [hour, minute] = clock.split(':').map(Number)
  const total = (hour * 60 + minute - 10 + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function vars(show) {
  const ink = INK[show.id]
  return `--a:${ink.a};--b:${ink.b};--c:${ink.c}`
}

function art(show) {
  const pictures = {
    'dalekiy-gorod': `<svg viewBox="0 0 160 120" aria-hidden="true"><path d="M116 16a14 14 0 1 0 2 24 10 10 0 1 1-2-24z" fill="var(--c)"/><path d="M0 94c26-22 42-6 60 4 18-26 40-38 66-16 16 12 26 6 34-8v46H0V94z" fill="var(--b)" opacity=".45"/><g fill="var(--c)"><rect x="22" y="58" width="18" height="42"/><rect x="46" y="38" width="28" height="62"/><rect x="80" y="62" width="18" height="38"/></g><g fill="var(--b)"><rect x="26" y="66" width="4" height="5"/><rect x="33" y="66" width="4" height="5"/><rect x="26" y="76" width="4" height="5"/><rect x="33" y="76" width="4" height="5"/><rect x="52" y="48" width="5" height="6"/><rect x="61" y="48" width="5" height="6"/><rect x="52" y="60" width="5" height="6"/><rect x="61" y="60" width="5" height="6"/><rect x="52" y="72" width="5" height="6"/><rect x="61" y="72" width="5" height="6"/><rect x="85" y="70" width="4" height="5"/><rect x="91" y="70" width="4" height="5"/><rect x="85" y="80" width="4" height="5"/><rect x="91" y="80" width="4" height="5"/></g></svg>`,
    'eto-prosto-stambul': `<svg viewBox="0 0 160 120" aria-hidden="true"><path d="M28 86V40" stroke="var(--c)" stroke-width="5"/><path d="M28 40l-8 10h16z" fill="var(--c)"/><circle cx="28" cy="32" r="3.5" fill="var(--b)"/><path d="M132 86V40" stroke="var(--c)" stroke-width="5"/><path d="M132 40l-8 10h16z" fill="var(--c)"/><circle cx="132" cy="32" r="3.5" fill="var(--b)"/><path d="M50 86V64a30 30 0 0 1 60 0v22z" fill="var(--c)"/><circle cx="80" cy="52" r="7" fill="var(--b)"/><path d="M72 86v-12h16v12" fill="var(--a)"/><path d="M14 104c18-12 30-12 44 0s28 12 44 0 30-12 44 0v8H14z" fill="var(--b)"/></svg>`,
    'pod-zemley': `<svg viewBox="0 0 160 120" aria-hidden="true"><path d="M8 36c28 14 42-18 72-4s42 18 72 0" stroke="var(--b)" stroke-width="9" fill="none" opacity=".55" stroke-linecap="round"/><path d="M8 60c30 14 48-10 76 2s38 16 68-2" stroke="var(--c)" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M8 86c28 10 52-16 80 0s36 12 64-8" stroke="var(--b)" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="80" cy="62" r="11" fill="var(--b)"/><circle cx="80" cy="62" r="4.5" fill="var(--c)"/></svg>`,
    'lyubov-eto-ogon': `<svg viewBox="0 0 160 120" aria-hidden="true"><path d="M80 14c12 24 38 30 30 58 16 8 20 26 4 36-12 10-24 12-34 12s-24-3-34-14C30 90 40 72 54 66c0-22 14-30 26-52z" fill="var(--c)"/><path d="M80 50c8 14 18 18 12 34-8 4-10 14-12 18-4-8-8-14-16-16 2-18 8-22 16-36z" fill="var(--b)"/></svg>`,
    'eto-more-perepolnitsya': `<svg viewBox="0 0 160 120" aria-hidden="true"><circle cx="118" cy="28" r="11" fill="var(--c)"/><path d="M6 56c18-16 26-16 44 0s26 16 44 0 26-16 44 0 22 16 22 0" stroke="var(--c)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M6 78c18-16 26-16 44 0s26 16 44 0 26-16 44 0 22 16 22 0" stroke="var(--b)" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M6 100c18-12 26-12 44 0s26 12 44 0 26-12 44 0 22 12 22 0" stroke="var(--c)" stroke-width="8" fill="none" stroke-linecap="round" opacity=".75"/></svg>`,
    'rozy-i-grekhi': `<svg viewBox="0 0 160 120" aria-hidden="true"><path d="M78 72c-14 10-16 30-2 38" stroke="var(--b)" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="98" rx="12" ry="6" transform="rotate(-28 60 98)" fill="var(--b)" opacity=".8"/><circle cx="46" cy="42" r="13" fill="var(--c)"/><circle cx="46" cy="42" r="5" fill="var(--b)"/><circle cx="72" cy="52" r="20" fill="var(--c)"/><circle cx="72" cy="52" r="8" fill="var(--b)"/><circle cx="100" cy="40" r="15" fill="var(--c)"/><circle cx="100" cy="40" r="6" fill="var(--b)"/></svg>`,
  }
  return `<div class="art">${pictures[show.id]}</div>`
}

function bell(show, kind, now) {
  const clock = TIMES[kind.id]
  const key = `${show.id}|${kind.id}`
  const on = reminders.has(key)
  const status = eventStatus(clock, now.minutes)
  const label = on ? `Снять напоминание: ${show.title}, ${clock}` : `Напомнить: ${show.title}, ${clock}`
  return { clock, key, on, status, label }
}

function icon(on) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.2 16V10.8a5.8 5.8 0 0 1 11.6 0V16l1.4 2H4.8L6.2 16z" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 20.2a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`
}

function tabs(look) {
  const current = ui[look].tab
  return `<nav class="tabs">${TABS.map((tab) => `<button type="button" data-tab="${tab.id}" aria-current="${tab.id === current ? 'page' : 'false'}">${tab.label}</button>`).join('')}</nav>`
}

function toast(look) {
  const text = ui[look].toast
  return text ? `<div class="toast" role="status">${esc(text)}</div>` : ''
}

function shell(look, inner) {
  return `${inner}${tabs(look)}${toast(look)}`
}

function banner(look) {
  if (look === 'velvet') {
    return `<aside class="v-banner"><span>пример анонса</span><p>Суббота, 21:00 — «Розы и грехи». Сабина выходит в эфир.</p></aside>`
  }
  if (look === 'ceramic') {
    return `<aside class="c-banner"><span>пример анонса</span><p>В субботу в 21:00 Сабина переводит «Розы и грехи».</p></aside>`
  }
  return `<aside class="p-banner"><span>пример анонса</span><strong>Сб 21:00</strong><p>Розы и грехи · Сабина</p></aside>`
}

function velvetTimes(show, now) {
  return `<div class="v-times">${KINDS.map((kind) => {
    const item = bell(show, kind, now)
    return `<button type="button" class="v-time is-${item.status.state}${item.on ? ' is-on' : ''}" data-bell="${item.key}" data-time="${item.clock}" aria-pressed="${item.on}" aria-label="${esc(item.label)}"><span class="v-time__clock">${item.clock}</span><span class="v-time__meta"><b>${kind.title}</b><i>${item.status.label}</i></span>${icon(item.on)}</button>`
  }).join('')}</div>`
}

function ceramicTimes(show, now) {
  return `<div class="c-times">${KINDS.map((kind) => {
    const item = bell(show, kind, now)
    return `<button type="button" class="c-time is-${item.status.state}${item.on ? ' is-on' : ''}" data-bell="${item.key}" data-time="${item.clock}" aria-pressed="${item.on}" aria-label="${esc(item.label)}"><span>${item.clock}</span><small>${kind.title}</small>${icon(item.on)}</button>`
  }).join('')}</div>`
}

function posterTimes(show, now) {
  return `<div class="p-times">${KINDS.map((kind) => {
    const item = bell(show, kind, now)
    return `<button type="button" class="p-time is-${item.status.state}${item.on ? ' is-on' : ''}" data-bell="${item.key}" data-time="${item.clock}" aria-pressed="${item.on}" aria-label="${esc(item.label)}"><b>${item.clock}</b><small>${kind.id === 'repeat' ? 'повтор' : 'новая'}</small><em>${item.status.label}</em>${icon(item.on)}</button>`
  }).join('')}</div>`
}

function velvetScreen(now) {
  const today = dayById(now.dayId)
  const shows = showsOn(now.dayId)
  const next = upcoming(now.dayId)
  const list = shows.length
    ? shows.map((show) => `<article class="v-card" style="${vars(show)}"><div class="v-art">${art(show)}<span>${esc(show.platform)}</span></div><h3>${esc(show.title)}</h3><p>переводит ${esc(show.translator)}</p>${velvetTimes(show, now)}</article>`).join('')
    : `<div class="v-empty"><h3>Сегодня без эфиров</h3><p>${next[0] ? `${esc(next[0].caption)} — «${esc(next[0].show.title)}» в 20:00` : 'На неделе тихо'}</p></div>`
  const later = next.length
    ? `<section class="v-later"><h3>Дальше</h3>${next.map(({ show, caption }) => `<button type="button" class="v-next" data-bell="${show.id}|premiere" data-time="21:00" aria-pressed="${reminders.has(`${show.id}|premiere`)}" aria-label="${esc(show.title)}"><i style="${vars(show)}"></i><span><small>${esc(caption)}</small><b>${esc(show.title)}</b></span><em>21:00</em></button>`).join('')}</section>`
    : ''
  return shell('velvet', `<div class="screen v-screen"><header class="v-head"><div><p class="brand">Türk Dizi</p><h2>Сегодня</h2><p class="when">${esc(today.full)}, ${esc(now.date)}</p></div><time>${esc(now.clock)}<small>мск</small></time></header>${banner('velvet')}<div class="v-list">${list}</div>${later}</div>`)
}

function ceramicScreen(now) {
  const today = dayById(now.dayId)
  const shows = showsOn(now.dayId)
  const next = upcoming(now.dayId)
  const list = shows.length
    ? shows.map((show) => `<article class="c-card" style="${vars(show)}"><div class="c-card__top">${art(show)}<div><p>${esc(show.platform)}</p><h3>${esc(show.title)}</h3><span>${esc(show.translator)}</span></div></div>${ceramicTimes(show, now)}</article>`).join('')
    : `<div class="c-empty"><h3>Сегодня выходной</h3><p>${next[0] ? `Ближе всего ${esc(next[0].caption.toLowerCase())}: «${esc(next[0].show.title)}»` : 'Эфиров нет'}</p></div>`
  const later = next.length
    ? `<section class="c-later"><h3>Скоро</h3>${next.map(({ show, caption }) => `<article class="c-row" style="${vars(show)}">${art(show)}<div><small>${esc(caption)} · ${esc(show.platform)}</small><b>${esc(show.title)}</b></div><button type="button" data-bell="${show.id}|premiere" data-time="21:00" aria-pressed="${reminders.has(`${show.id}|premiere`)}" aria-label="Напомнить о ${esc(show.title)}">21:00</button></article>`).join('')}</section>`
    : ''
  return shell('ceramic', `<div class="screen c-screen"><header class="c-head"><p class="brand">Türk Dizi</p><div class="c-head__row"><h2>Сегодня</h2><time>${esc(now.clock)}</time></div><p class="when">${esc(today.full.toLowerCase())}, ${esc(now.date)}</p></header>${banner('ceramic')}<div class="c-list">${list}</div>${later}</div>`)
}

function posterScreen(now) {
  const today = dayById(now.dayId)
  const shows = showsOn(now.dayId)
  const next = upcoming(now.dayId)
  const list = shows.length
    ? shows.map((show) => `<article class="p-card" style="${vars(show)}"><div class="p-card__copy"><p>${esc(show.platform)} · ${esc(show.translator)}</p><h3>${esc(show.title)}</h3>${posterTimes(show, now)}</div>${art(show)}</article>`).join('')
    : `<div class="p-empty"><h3>Сегодня тихо</h3><p>${next[0] ? `${esc(next[0].caption)} · ${esc(next[0].show.title)}` : ''}</p></div>`
  const later = next.length
    ? `<section class="p-later"><h3>Дальше</h3>${next.map(({ show, caption }) => `<article style="${vars(show)}"><small>${esc(caption)}</small><b>${esc(show.title)}</b><em>21:00</em></article>`).join('')}</section>`
    : ''
  return shell('poster', `<div class="screen p-screen"><header class="p-head"><p class="brand">ТУРКДИЗИ</p><h2>${esc(today.full)}</h2><p class="when">${esc(now.date)} · ${esc(now.clock)} мск</p></header>${banner('poster')}<div class="p-list">${list}</div>${later}</div>`)
}

function velvetWeek(now) {
  const rows = DAYS.map((day) => {
    const shows = showsOn(day.id)
    const body = shows.length
      ? shows.map((show) => `<div class="v-week__show" style="${vars(show)}"><b>${esc(show.title)}</b><span>${esc(show.translator)}</span>${velvetTimes(show, now)}</div>`).join('')
      : `<p class="quiet">без эфиров</p>`
    return `<section class="v-week__day${day.id === now.dayId ? ' is-today' : ''}"><header><span>${day.short}</span><h3>${day.full}</h3>${day.id === now.dayId ? '<em>сегодня</em>' : ''}</header>${body}</section>`
  }).join('')
  return shell('velvet', `<div class="screen v-screen"><header class="v-head"><div><p class="brand">Türk Dizi</p><h2>Неделя</h2><p class="when">время московское</p></div><time>${esc(now.clock)}<small>мск</small></time></header><div class="v-week">${rows}</div></div>`)
}

function ceramicWeek(now) {
  const selected = ui.ceramic.day || now.dayId
  const chips = DAYS.map((day) => `<button type="button" data-day="${day.id}" class="${day.id === selected ? 'is-on' : ''}" aria-pressed="${day.id === selected}">${day.short}${day.id === now.dayId ? '<i></i>' : ''}</button>`).join('')
  const day = dayById(selected)
  const shows = showsOn(selected)
  const body = shows.length
    ? shows.map((show) => `<article class="c-card" style="${vars(show)}"><div class="c-card__top">${art(show)}<div><p>${esc(show.platform)}</p><h3>${esc(show.title)}</h3><span>${esc(show.translator)}</span></div></div>${ceramicTimes(show, now)}</article>`).join('')
    : `<div class="c-empty"><h3>${esc(day.full)}</h3><p>В этот день эфиров нет. Можно просто отдохнуть.</p></div>`
  return shell('ceramic', `<div class="screen c-screen"><header class="c-head"><p class="brand">Türk Dizi</p><div class="c-head__row"><h2>Неделя</h2><time>${esc(now.clock)}</time></div><p class="when">${esc(day.full)}</p></header><div class="c-days">${chips}</div><div class="c-list">${body}</div></div>`)
}

function posterWeek(now) {
  const rows = DAYS.map((day) => {
    const shows = showsOn(day.id)
    const body = shows.length
      ? shows.map((show) => `<article class="p-week__show" style="${vars(show)}"><b>${esc(show.title)}</b><span>${esc(show.translator)} · ${esc(show.platform)}</span><em>20:00 / 21:00</em></article>`).join('')
      : `<p class="p-week__empty">тихо</p>`
    return `<section class="p-week__day${day.id === now.dayId ? ' is-today' : ''}"><h3>${day.short}</h3><div>${body}</div></section>`
  }).join('')
  return shell('poster', `<div class="screen p-screen"><header class="p-head"><p class="brand">ТУРКДИЗИ</p><h2>Неделя</h2><p class="when">${esc(now.clock)} мск</p></header><div class="p-week">${rows}</div></div>`)
}

function velvetAbout() {
  const links = LINKS.map((link) => `<a class="v-link" href="${link.url}" target="_blank" rel="noopener noreferrer"><b>${esc(link.title)}</b><span>${esc(link.text)}</span></a>`).join('')
  return shell('velvet', `<div class="screen v-screen"><header class="v-head"><div><p class="brand">Türk Dizi</p><h2>Канал</h2></div></header><div class="v-about"><p>Смотрим новые серии вместе с переводчицами: на Иви и в группе ВКонтакте.</p>${links}<p class="fine">Повтор в 20:00, новая серия в 21:00, время московское. Реклама — в личные сообщения группы.</p></div></div>`)
}

function ceramicAbout() {
  const links = LINKS.map((link) => `<a class="c-link" href="${link.url}" target="_blank" rel="noopener noreferrer"><b>${esc(link.title)}</b><span>${esc(link.text)}</span></a>`).join('')
  return shell('ceramic', `<div class="screen c-screen"><header class="c-head"><p class="brand">Türk Dizi</p><h2>Канал</h2><p class="when">онлайн-перевод турецких сериалов</p></header><div class="c-about"><p>Новые серии смотрим вместе: переводчицы выходят в прямой эфир, а бот напоминает за 10 минут.</p><div class="c-places"><a href="https://www.ivi.ru" target="_blank" rel="noopener noreferrer">Иви</a><a href="https://vk.com/turkdizionline" target="_blank" rel="noopener noreferrer">ВКонтакте</a></div>${links}</div></div>`)
}

function posterAbout() {
  const links = LINKS.map((link) => `<a class="p-link" href="${link.url}" target="_blank" rel="noopener noreferrer"><b>${esc(link.title)}</b><span>${esc(link.text)}</span></a>`).join('')
  return shell('poster', `<div class="screen p-screen"><header class="p-head"><p class="brand">ТУРКДИЗИ</p><h2>Канал</h2><p class="when">Иви и ВКонтакте · 20:00 и 21:00</p></header><div class="p-about"><p>Серии с переводчицами в прямом эфире. Бот пишет за десять минут.</p>${links}</div></div>`)
}

function markup(look, now) {
  const tab = ui[look].tab
  if (tab === 'week') {
    if (look === 'velvet') return velvetWeek(now)
    if (look === 'ceramic') return ceramicWeek(now)
    return posterWeek(now)
  }
  if (tab === 'about') {
    if (look === 'velvet') return velvetAbout()
    if (look === 'ceramic') return ceramicAbout()
    return posterAbout()
  }
  if (look === 'velvet') return velvetScreen(now)
  if (look === 'ceramic') return ceramicScreen(now)
  return posterScreen(now)
}

function paint(look, now = moscowParts()) {
  const phone = document.querySelector(`[data-phone="${look}"]`)
  const screen = phone.querySelector('.screen')
  const top = screen ? screen.scrollTop : 0
  phone.innerHTML = markup(look, now)
  const next = phone.querySelector('.screen')
  if (next) next.scrollTop = top
}

function paintAll() {
  const now = moscowParts()
  LOOKS.forEach((look) => paint(look, now))
}

function setLook(look) {
  document.querySelectorAll('[data-pick]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.pick === look))
  })
  document.querySelectorAll('.column').forEach((column) => {
    column.classList.toggle('is-on', column.dataset.look === look)
  })
  if (location.hash !== `#${look}`) history.replaceState(null, '', `#${look}`)
}

function notify(look, text) {
  ui[look].toast = text
  paint(look)
  clearTimeout(ui[look].timer)
  ui[look].timer = setTimeout(() => {
    ui[look].toast = ''
    paint(look)
  }, 1700)
}

document.addEventListener('click', (event) => {
  const pick = event.target.closest('[data-pick]')
  if (pick) {
    setLook(pick.dataset.pick)
    return
  }
  const column = event.target.closest('[data-look]')
  if (!column) return
  const look = column.dataset.look
  const tab = event.target.closest('[data-tab]')
  if (tab) {
    ui[look].tab = tab.dataset.tab
    paint(look)
    return
  }
  const day = event.target.closest('[data-day]')
  if (day) {
    ui[look].day = day.dataset.day
    paint(look)
    return
  }
  const control = event.target.closest('[data-bell]')
  if (!control) return
  const key = control.dataset.bell
  if (reminders.has(key)) {
    reminders.delete(key)
    localStorage.setItem(STORE_KEY, JSON.stringify([...reminders]))
    notify(look, 'Напоминание снято')
    return
  }
  reminders.add(key)
  localStorage.setItem(STORE_KEY, JSON.stringify([...reminders]))
  notify(look, `Бот напишет в ${minusTen(control.dataset.time)} по Москве`)
})

const params = new URLSearchParams(location.search)
const preset = params.get('tab')
if (preset === 'today' || preset === 'week' || preset === 'about') {
  LOOKS.forEach((look) => {
    ui[look].tab = preset
  })
}
const initial = LOOKS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'velvet'
setLook(initial)
paintAll()
setInterval(paintAll, 30000)
