import { addDays, addMonths, nextMonday, setHours, startOfDay, startOfMonth } from 'date-fns'
import type { DigestSettings } from '@/lib/gtm/schemas'

const SEND_HOUR = 9

export function nextSendDate(cadence: DigestSettings['cadence'], now = new Date()) {
  if (cadence === 'weekly') {
    const thisMonday = setHours(startOfDay(now), SEND_HOUR)
    if (now.getDay() === 1 && now < thisMonday) return thisMonday
    return setHours(startOfDay(nextMonday(now)), SEND_HOUR)
  }
  const firstOfNext = startOfMonth(addMonths(now, 1))
  const firstMonday = firstOfNext.getDay() === 1 ? firstOfNext : nextMonday(addDays(firstOfNext, -1))
  return setHours(startOfDay(firstMonday), SEND_HOUR)
}
