// components/ui/OptimizedImage.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { imageOptimization } from '@/lib/utils/performance';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  quality?: number;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  fallback?: string;
  progressive?: boolean;
  lazy?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  quality = 80,
  priority = false,
  sizes,
  onLoad,
  onError,
  fallback,
  progressive = true,
  lazy = true
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(!lazy || priority);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Progressive loading effect
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    
    const handleLoad = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = (error: Event) => {
      setHasError(true);
      if (fallback) {
        setCurrentSrc(fallback);
      }
      onError?.(error);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Generate optimized src with quality and format
    const optimizedSrc = generateOptimizedSrc(src, { width, height, quality });
    img.src = optimizedSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, width, height, quality, onLoad, onError, fallback, isInView]);

  // Generate responsive srcSet
  const generateSrcSet = () => {
    if (!width || !sizes) return undefined;
    
    const breakpoints = [width * 0.5, width, width * 1.5, width * 2];
    return breakpoints
      .map(w => `${generateOptimizedSrc(src, { width: Math.round(w), height, quality })} ${Math.round(w)}w`)
      .join(', ');
  };

  // Generate optimized image URL
  function generateOptimizedSrc(
    url: string, 
    options: { width?: number; height?: number; quality?: number }
  ): string {
    if (!url.startsWith('http') && !url.startsWith('/')) return url;
    
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    
    const format = imageOptimization.getOptimalImageFormat();
    if (format !== 'jpeg') params.set('f', format);
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // Placeholder component
  const PlaceholderComponent = () => (
    <div 
      className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <svg 
        className="w-8 h-8 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
    </div>
  );

  // Error component
  const ErrorComponent = () => (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center text-gray-500">
        <svg 
          className="w-8 h-8 mx-auto mb-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <p className="text-sm">Error al cargar imagen</p>
      </div>
    </div>
  );

  if (hasError && !fallback) {
    return <ErrorComponent />;
  }

  if (!isInView) {
    return <PlaceholderComponent />;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Placeholder/blur effect */}
      {!isLoaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 ${className}`}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`
          transition-opacity duration-500 ease-in-out
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
        srcSet={generateSrcSet()}
        sizes={sizes}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={(e) => {
          setHasError(true);
          if (fallback) {
            setCurrentSrc(fallback);
          }
          onError?.(e.nativeEvent);
        }}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !placeholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#e4007c]" />
        </div>
      )}
    </div>
  );
}

// Hook for image preloading
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, url]));
          resolve();
        };
        img.onerror = () => {
          setFailedImages(prev => new Set([...prev, url]));
          resolve();
        };
        img.src = url;
      });
    };

    Promise.all(urls.map(preloadImage));
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    hasFailed: (url: string) => failedImages.has(url)
  };
}

// Image gallery component with lazy loading
export function ImageGallery({
  images,
  className = '',
  itemClassName = '',
  onImageClick
}: {
  images: Array<{ src: string; alt: string; thumbnail?: string }>;
  className?: string;
  itemClassName?: string;
  onImageClick?: (index: number) => void;
}) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`aspect-square cursor-pointer hover:opacity-80 transition-opacity ${itemClassName}`}
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            placeholder={image.thumbnail}
            className="w-full h-full object-cover rounded-lg"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            lazy={true}
          />
        </div>
      ))}
    </div>
  );
}