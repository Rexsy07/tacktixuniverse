import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ContentSkeleton } from '@/components/ui/loading-skeletons';

interface LayoutShiftPreventProps {
  children: React.ReactNode;
  isLoading?: boolean;
  fallback?: React.ReactNode;
  minHeight?: string | number;
  className?: string;
  /**
   * Reserved space dimensions to prevent layout shifts
   */
  reservedSpace?: {
    width?: string | number;
    height?: string | number;
  };
  /**
   * Animation duration for smooth transitions
   */
  transitionDuration?: number;
  /**
   * Whether to show a smooth transition animation
   */
  animate?: boolean;
}

/**
 * A wrapper component that prevents layout shifts by reserving space
 * and providing smooth transitions between loading and loaded states.
 */
export function LayoutShiftPrevent({
  children,
  isLoading = false,
  fallback,
  minHeight,
  className,
  reservedSpace,
  transitionDuration = 300,
  animate = true,
}: LayoutShiftPreventProps) {
  const [isVisible, setIsVisible] = useState(!isLoading);

  useEffect(() => {
    if (!isLoading && !isVisible) {
      // Smooth transition when content loads
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (isLoading && isVisible) {
      setIsVisible(false);
    }
  }, [isLoading, isVisible]);

  const containerStyles: React.CSSProperties = {
    minHeight: minHeight || reservedSpace?.height || 'auto',
    width: reservedSpace?.width || '100%',
    transition: animate ? `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)` : undefined,
    contain: 'layout style',
  };

  const contentStyles: React.CSSProperties = {
    opacity: isVisible ? 1 : 0.7,
    transform: isVisible ? 'translateY(0)' : 'translateY(2px)',
    transition: animate ? `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease` : undefined,
  };

  return (
    <div
      className={cn('prevent-layout-shift', className)}
      style={containerStyles}
    >
      {isLoading ? (
        <div style={contentStyles}>
          {fallback || <ContentSkeleton height={minHeight as string} />}
        </div>
      ) : (
        <div style={contentStyles}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing layout shift prevention state
 */
export function useLayoutShiftPrevent(isLoading: boolean, delay: number = 100) {
  const [shouldShowContent, setShouldShowContent] = useState(!isLoading);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShouldShowContent(false);
      setIsTransitioning(true);
    } else {
      const timer = setTimeout(() => {
        setShouldShowContent(true);
        setIsTransitioning(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isLoading, delay]);

  return {
    shouldShowContent,
    isTransitioning,
    contentClass: cn(
      'content-transition',
      (isLoading || isTransitioning) && 'loading'
    ),
  };
}

/**
 * Higher-order component for wrapping components with layout shift prevention
 */
export function withLayoutShiftPrevention<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    minHeight?: string | number;
    fallback?: React.ReactNode;
    animate?: boolean;
  }
) {
  return function WrappedComponent(
    props: P & { isLoading?: boolean; className?: string }
  ) {
    const { isLoading = false, className, ...componentProps } = props;

    return (
      <LayoutShiftPrevent
        isLoading={isLoading}
        className={className}
        minHeight={options?.minHeight}
        fallback={options?.fallback}
        animate={options?.animate}
      >
        <Component {...(componentProps as P)} />
      </LayoutShiftPrevent>
    );
  };
}