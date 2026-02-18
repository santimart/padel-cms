import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMatchTime(dateString: string | null) {
  if (!dateString) return null
  const date = new Date(dateString)
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'short' })
  const dayNum = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'short' })
  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  
  return `${dayName} ${dayNum} ${month} - ${time}hs`
}

export function formatName(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
