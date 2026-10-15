"use client";

import { useState } from "react";
import CloudImage from "@/components/ui/CloudImage";
import Placeholder from "@/components/ui/Placeholder";

type Img = { id: string; public_id: string; alt_text: string | null };

export default function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden border border-steel-200 bg-steel-100">
        {current ? <CloudImage publicId={current.public_id} alt={current.alt_text || name} preset="gallery" sizes="(min-width:1024px) 50vw, 100vw" priority className="object-contain" /> : <Placeholder label="Photo not yet added" />}
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.id}>
              <button type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index} className={`relative block aspect-square w-full overflow-hidden border-2 ${i === index ? "border-brand" : "border-steel-200"}`}>
                <CloudImage publicId={img.public_id} alt="" preset="thumb" sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
