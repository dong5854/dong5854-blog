export function bindEditorSaveShortcut(target: Window, save: () => void) {
  const handle = (event: KeyboardEvent) => {
    if (
      !(event.ctrlKey || event.metaKey) ||
      event.altKey ||
      (event.code !== 'KeyS' && event.key.toLowerCase() !== 's')
    )
      return
    // Physical key codes also work while the Korean input method is active.
    event.preventDefault()
    event.stopPropagation()
    if (!event.repeat) save()
  }
  target.addEventListener('keydown', handle, true)
  return () => target.removeEventListener('keydown', handle, true)
}
