'use client'

import { useState, type RefObject } from 'react'
import { editableImages, imageMarkup, type EditableImage } from '@/lib/editorImages'
import { applyTextEdit } from '@/lib/editorFormatting'

function ImageForm({
  image,
  textarea,
  onApplied,
}: {
  image: EditableImage
  textarea: RefObject<HTMLTextAreaElement | null>
  onApplied: () => void
}) {
  const [alt, setAlt] = useState(image.alt)
  const [width, setWidth] = useState(image.width)
  const [align, setAlign] = useState(image.align)
  const [error, setError] = useState('')
  const inputClass =
    'mt-1 w-full rounded-lg border-gray-300 bg-transparent text-sm dark:border-gray-700'
  return (
    <div className="space-y-3">
      <p className="truncate text-xs text-gray-500" title={image.src}>
        {image.src}
      </p>
      <label className="block text-xs">
        이미지 설명
        <input
          aria-label="이미지 설명"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="min-w-0 flex-1 text-xs">
          너비 (px, 빈칸은 원본)
          <input
            aria-label="이미지 너비"
            type="number"
            min="1"
            max="2400"
            value={width}
            onChange={(event) => setWidth(event.target.value)}
            className={inputClass}
          />
        </label>
        <fieldset className="text-xs">
          <legend className="mb-2">정렬</legend>
          <div className="flex gap-1">
            {[
              ['left', '왼쪽'],
              ['center', '가운데'],
              ['right', '오른쪽'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={align === value}
                onClick={() => setAlign(value)}
                className={`rounded-lg border px-2 py-2 ${align === value ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'border-gray-300 dark:border-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
        onClick={() => {
          try {
            const field = textarea.current
            if (!field || field.value.slice(image.start, image.end) !== image.source)
              throw new Error('본문이 변경되었습니다. 이미지를 다시 선택해 주세요.')
            if (
              !applyTextEdit(field, {
                start: image.start,
                end: image.end,
                text: imageMarkup({ ...image, alt, width, align }),
              })
            )
              throw new Error('이미지 설정을 적용하지 못했습니다.')
            onApplied()
          } catch (error) {
            setError((error as Error).message)
          }
        }}
      >
        이미지 설정 적용
      </button>
    </div>
  )
}

export default function ImageSettings({
  body,
  textarea,
  onClose,
}: {
  body: string
  textarea: RefObject<HTMLTextAreaElement | null>
  onClose: () => void
}) {
  const images = editableImages(body)
  const [selected, setSelected] = useState(0)
  const image = images[selected]
  return (
    <section
      aria-label="본문 이미지 편집"
      className="mb-4 space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">이미지 편집</h3>
        <button type="button" aria-label="이미지 편집 닫기" onClick={onClose} className="px-2">
          ×
        </button>
      </div>
      {images.length === 0 ? (
        <p className="text-xs text-gray-500">
          붙여넣거나 업로드한 이미지, 기본 Markdown 이미지의 설명·너비·정렬을 수정할 수 있습니다.
        </p>
      ) : (
        <>
          <div className="flex max-h-28 flex-wrap gap-2 overflow-auto">
            {images.map((item, i) => (
              <button
                type="button"
                key={item.start}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
                className={`max-w-full truncate rounded-lg border px-3 py-2 text-xs ${selected === i ? 'border-emerald-500 text-emerald-600' : 'border-gray-300 dark:border-gray-700'}`}
              >
                {i + 1}. {item.alt || '설명 없음'}
              </button>
            ))}
          </div>
          {image && (
            <ImageForm
              key={`${image.start}:${image.source}`}
              image={image}
              textarea={textarea}
              onApplied={onClose}
            />
          )}
        </>
      )}
    </section>
  )
}
