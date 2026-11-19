import { initData } from '@/shared/telegram/telegram'

const baseUrl = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {}
  if (initData) headers.Authorization = `tma ${initData}`
  if (body) headers['Content-Type'] = raw ? body.type : 'application/json'
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, data?.error ?? response.statusText, data?.fields)
  return data
}

export const http = {
  upload: (path, blob) => request(path, { method: 'POST', body: blob, raw: true }),
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
