export type EditableImage = {
  start: number
  end: number
  source: string
  src: string
  alt: string
  width: string
  align: string
}
const decode = (value: string) =>
  value.replace(
    /&(amp|quot|lt|gt|#123|#125);/g,
    (_, key: string) => ({ amp: '&', quot: '"', lt: '<', gt: '>', '#123': '{', '#125': '}' })[key]!
  )
const encode = (value: string) =>
  value.replace(
    /[&"<>{}]/g,
    (char) =>
      ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;', '{': '&#123;', '}': '&#125;' })[
        char
      ]!
  )
export function editableImages(body: string): EditableImage[] {
  const images: EditableImage[] = []
  let offset = 0,
    fence = ''
  for (const line of body.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker && (!fence || (marker[1][0] === fence[0] && marker[1].length >= fence.length)))
      fence = fence ? '' : marker[1]
    else if (!fence && !line.startsWith('    ') && !line.startsWith('\t')) {
      // Consume inline code and comments first so examples are never edited as images.
      const pattern =
        /(`+)[\s\S]*?\1|<!--.*?-->|!\[([^\]\n]*)\]\(([^\s()]+)\)|<ContentImage\s+(?:[\w]+="[^"]*"\s*)+\/>/g
      for (const match of line.matchAll(pattern)) {
        if (match[1] || match[0].startsWith('<!--')) continue
        const attributes = Object.fromEntries(
          Array.from(match[0].matchAll(/(\w+)="([^"]*)"/g), ([, key, value]) => [
            key,
            decode(value),
          ])
        )
        const src = match[3] ?? attributes.src
        if (!src || !/^(\/(?!\/)|https?:\/\/)/.test(src)) continue
        images.push({
          start: offset + match.index!,
          end: offset + match.index! + match[0].length,
          source: match[0],
          src,
          alt: match[2] ?? attributes.alt ?? '',
          width: attributes.width ?? '',
          align: attributes.align ?? 'center',
        })
      }
    }
    offset += line.length + 1
  }
  return images
}
export function imageMarkup(image: Pick<EditableImage, 'src' | 'alt' | 'width' | 'align'>) {
  if (
    !/^(\/(?!\/)|https?:\/\/)/.test(image.src) ||
    !['left', 'center', 'right'].includes(image.align)
  )
    throw new Error('이미지 경로와 정렬을 확인해 주세요.')
  if (
    image.width &&
    (!/^\d+$/.test(image.width) || Number(image.width) < 1 || Number(image.width) > 2400)
  )
    throw new Error('너비는 1~2400px 또는 빈칸으로 입력하세요.')
  return `<ContentImage src="${encode(image.src)}" alt="${encode(image.alt)}" width="${image.width}" align="${image.align}" />`
}
