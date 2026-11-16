import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverImageProps {
  src?: string | null;
  title: string;
  author?: string;
  className?: string;
}

export function BookCoverImage({ src, title, author, className = '' }: BookCoverImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-between bg-gradient-to-br from-[#0B192C] via-[#132642] to-[#07111E] p-6 text-center text-white select-none ${className}`}
      >
        <div className="w-full border border-[#C59B27]/35 h-full flex flex-col items-center justify-between p-4">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#DFC166]">
            Bhagwati Publications
          </span>
          <div className="my-auto flex flex-col items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#C59B27]/80" strokeWidth={1.5} />
            <p className="font-serif text-base font-semibold leading-snug text-white line-clamp-3">
              {title}
            </p>
          </div>
          {author ? (
            <span className="text-xs text-slate-300 truncate max-w-full">{author}</span>
          ) : (
            <span className="text-[11px] text-[#C59B27]/70">Edition</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Book cover for ${title}`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover w-full h-full ${className}`}
    />
  );
}
