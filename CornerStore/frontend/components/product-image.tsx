"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

const FALLBACK = "/placeholder-product.svg";

type ProductImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
};

export function ProductImage({ src, alt, ...props }: ProductImageProps) {
  const resolved = src || FALLBACK;
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(src || FALLBACK);
  }, [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={
        process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "true" ||
        currentSrc.startsWith("http://") ||
        currentSrc.startsWith("https://")
      }
      onError={() => {
        if (currentSrc !== FALLBACK) setCurrentSrc(FALLBACK);
      }}
    />
  );
}
