export function formatDate(date: string | number | Date, locale = 'en-US') {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(date).toLocaleDateString(locale, options)
}
