'use client'

interface MessageImagesProps {
  imageUrls: string[]
}

export function MessageImages({ imageUrls }: MessageImagesProps) {
  if (imageUrls.length === 0) return null

  const isSingle = imageUrls.length === 1

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {imageUrls.map((url, i) => (
        <a
          key={`${url}-${i}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <img
            src={url}
            alt="Attached image"
            className={
              isSingle
                ? 'max-w-[256px] max-h-[256px] rounded-md object-cover shadow-sm'
                : 'size-32 rounded-md object-cover shadow-sm'
            }
          />
        </a>
      ))}
    </div>
  )
}
