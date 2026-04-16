"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { productImageSrc } from "@/lib/catalog-shared";
import type { CatalogProduct } from "@/lib/catalog-shared";

export function ProductTileImage({ product }: { product: CatalogProduct }) {
  const initial = productImageSrc(product.image);
  const [src, setSrc] = useState(initial);

  const onError = useCallback(() => {
    setSrc("/placeholder-product.svg");
  }, []);

  return (
    <Image
      key={src}
      src={src}
      alt={product.imageAlt?.trim() || product.name}
      fill
      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 32vw"
      className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
      onError={onError}
      unoptimized={src.endsWith(".svg")}
    />
  );
}
