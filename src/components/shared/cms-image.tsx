import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Public-site image wrapper.
 *
 * CMS-managed media has unknown intrinsic dimensions, so most calls go through
 * the `fill` layout with a containing `relative` parent + an explicit `sizes`
 * hint. When the caller knows width/height (e.g. logos, avatars), pass them
 * directly and `fill` is skipped.
 *
 * Defaults differ from `<Image>`:
 *   - `loading="lazy"` unless caller passes `priority` (LCP-eligible images)
 *   - `decoding="async"` for parser yielding
 *   - `quality` defaults to 80 (AVIF/WebP keep this visually clean)
 *
 * `sizes` is intentionally required for `fill` images. Without it the browser
 * downloads the largest variant — the single biggest source of wasted bytes
 * on image-heavy pages.
 */
type CmsImageProps = Omit<ImageProps, "src" | "alt" | "sizes"> & {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  /** Apply a soft skeleton when src is missing so layout stays stable. */
  fallbackClassName?: string;
  wrapperClassName?: string;
};

export function CmsImage({
  src,
  alt,
  sizes,
  fill,
  className,
  wrapperClassName,
  fallbackClassName,
  quality = 80,
  priority,
  ...rest
}: CmsImageProps) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={cn("bg-muted", fallbackClassName ?? className)}
      />
    );
  }

  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", wrapperClassName)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          className={cn("object-cover", className)}
          {...rest}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      className={className}
      {...rest}
    />
  );
}
