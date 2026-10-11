import { http } from '@/shared/api/http'

export const startSession = () => http.post('/api/session').catch(() => null)
