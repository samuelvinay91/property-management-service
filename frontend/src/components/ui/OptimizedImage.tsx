'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { imageOptimization } from '@/lib/performance/optimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
  lazy?: boolean;
  placeholder?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      quality = 75,
      format = 'webp',
      fit = 'cover',
      lazy = true,
      placeholder,
      className = '',
      sizes,
      priority = false,
      onLoad,
      onError,
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(!lazy || priority);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Generate optimized URLs
    const optimizedSrc = imageOptimization.optimizeUrl(src, {
      width,
      height,
      quality,
      format,
      fit,
    });

    const srcSet = width
      ? imageOptimization.generateSrcSet(src, [
          Math.round(width * 0.5),
          width,
          Math.round(width * 1.5),
          Math.round(width * 2),
        ])
      : undefined;

    // Set up intersection observer for lazy loading
    useEffect(() => {
      if (!lazy || priority || shouldLoad) return;

      const observer = imageOptimization.createLazyLoader();
      if (!observer) return;

      observerRef.current = observer;

      const currentImg = imgRef.current;
      if (currentImg) {
        observer.observe(currentImg);
      }

      return () => {
        if (currentImg && observerRef.current) {
          observerRef.current.unobserve(currentImg);
        }
      };
    }, [lazy, priority, shouldLoad]);

    // Handle image loading
    useEffect(() => {
      const img = imgRef.current;
      if (!img || !shouldLoad) return;

      const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
        onLoad?.();
      };

      const handleError = () => {
        setHasError(true);
        setIsLoaded(false);
        onError?.();
      };

      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);

      // Check if image is already loaded (cached)
      if (img.complete && img.naturalHeight !== 0) {
        handleLoad();
      }

      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    }, [shouldLoad, optimizedSrc, onLoad, onError]);

    // Preload image for priority images
    useEffect(() => {
      if (!priority) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      if (srcSet) link.imageSrcset = srcSet;
      if (sizes) link.imageSizes = sizes;

      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }, [priority, optimizedSrc, srcSet, sizes]);

    const imageStyle = {
      transition: 'opacity 0.3s ease-in-out',
      opacity: isLoaded ? 1 : 0,
    };

    const placeholderStyle = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.3s ease-in-out',
      opacity: isLoaded ? 0 : 1,
      pointerEvents: 'none' as const,
    };

    const containerStyle = {
      position: 'relative' as const,
      display: 'inline-block',
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : 'auto',
    };

    return (
      <div style={containerStyle} className={className}>
        {/* Placeholder */}
        {(placeholder || !isLoaded) && (
          <div style={placeholderStyle}>
            {placeholder ? (
              <img
                src={placeholder}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'blur(5px)',
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
            )}
          </div>
        )}

        {/* Main image */}
        <img
          ref={(node) => {
            imgRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          src={shouldLoad ? optimizedSrc : undefined}
          data-src={!shouldLoad ? optimizedSrc : undefined}
          srcSet={shouldLoad && srcSet ? srcSet : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          style={imageStyle}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={() => {
            if (!shouldLoad) setShouldLoad(true);
          }}
        />

        {/* Error state */}
        {hasError && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            Failed to load image
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// Higher-order component for image optimization
export const withImageOptimization = <P extends object>(
  Component: React.ComponentType<P & { src: string }>
) => {
  return forwardRef<any, P & OptimizedImageProps>((props, ref) => {
    const { src, ...optimizedProps } = props;
    const optimizedSrc = imageOptimization.optimizeUrl(src, {
      width: optimizedProps.width,
      height: optimizedProps.height,
      quality: optimizedProps.quality,
      format: optimizedProps.format,
      fit: optimizedProps.fit,
    });

    return <Component ref={ref} {...(props as P)} src={optimizedSrc} />;
  });
};

// Progressive image loading component
export const ProgressiveImage = ({
  src,
  placeholder,
  alt,
  className,
  ...props
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.src = src;
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        src={imageSrc}
        alt={alt}
        className="transition-opacity duration-300"
        style={{ opacity: isLoading ? 0.7 : 1 }}
        {...props}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// Responsive image component
export const ResponsiveImage = ({
  src,
  alt,
  className,
  aspectRatio = '16/9',
  ...props
}: OptimizedImageProps & { aspectRatio?: string }) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        {...props}
      />
    </div>
  );
};