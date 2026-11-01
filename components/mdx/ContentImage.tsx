import type { PreviewPositionProps } from '@/lib/remark/previewPositions'
import ImageCaption from './ImageCaption'

// Plain images also work for remote URLs without requiring Next Image dimensions.
export default function ContentImage({
  src,
  alt = '',
  width = '',
  align = 'center',
  ...position
}: {
  src: string
  alt?: string
  width?: string
  align?: string
} & PreviewPositionProps) {
  const size = /^\d+$/.test(String(width)) ? Math.min(2400, Math.max(1, Number(width))) : undefined
  return (
    <span
      {...position}
      className="mdx-image"
      style={{
        display: 'block',
        textAlign: align === 'left' ? 'left' : align === 'right' ? 'right' : 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ display: 'inline-block', width: size, maxWidth: '100%', height: 'auto' }}
      />
      <ImageCaption text={alt} />
    </span>
  )
}
