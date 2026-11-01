import type { ComponentPropsWithoutRef } from 'react'
import type { ImageProps } from 'next/image'
import Image from '@/components/Image'
import ImageCaption from './ImageCaption'

export function CaptionedImage(props: ImageProps) {
  return (
    <span className="mdx-image block">
      <Image {...props} alt={props.alt} />
      <ImageCaption text={props.alt} />
    </span>
  )
}

export function MarkdownImage(props: ComponentPropsWithoutRef<'img'>) {
  return (
    <span className="mdx-image block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...props} alt={props.alt ?? ''} />
      <ImageCaption text={props.alt} />
    </span>
  )
}
