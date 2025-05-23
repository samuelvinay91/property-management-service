'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { virtualScrolling } from '@/lib/performance/optimization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  estimatedItemHeight?: number;
  variableHeight?: boolean;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  estimatedItemHeight,
  variableHeight = false,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const itemHeightsRef = useRef<Map<number, number>>(new Map());

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (variableHeight) {
      // For variable height items, we need to calculate based on actual heights
      let currentTop = 0;
      let startIndex = 0;
      let endIndex = items.length - 1;

      // Find start index
      for (let i = 0; i < items.length; i++) {
        const height = itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight;
        if (currentTop + height > scrollTop) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
        currentTop += height;
      }

      // Find end index
      currentTop = 0;
      for (let i = 0; i < items.length; i++) {
        const height = itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight;
        currentTop += height;
        if (currentTop > scrollTop + containerHeight) {
          endIndex = Math.min(items.length - 1, i + overscan);
          break;
        }
      }

      return { startIndex, endIndex };
    }

    return virtualScrolling.calculateVisibleRange(
      scrollTop,
      containerHeight,
      itemHeight,
      items.length,
      overscan
    );
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan, variableHeight, estimatedItemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (variableHeight) {
      let height = 0;
      for (let i = 0; i < items.length; i++) {
        height += itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight;
      }
      return height;
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, variableHeight, estimatedItemHeight]);

  // Calculate item position for variable height
  const getItemTop = useCallback((index: number) => {
    if (!variableHeight) {
      return index * itemHeight;
    }

    let top = 0;
    for (let i = 0; i < index; i++) {
      top += itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight;
    }
    return top;
  }, [itemHeight, variableHeight, estimatedItemHeight]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    onScroll?.(newScrollTop);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // Measure item height for variable height items
  const measureItemHeight = useCallback((index: number, height: number) => {
    if (variableHeight) {
      itemHeightsRef.current.set(index, height);
    }
  }, [variableHeight]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (items[i]) {
        const top = getItemTop(i);
        const style = variableHeight
          ? {
              position: 'absolute' as const,
              top,
              left: 0,
              right: 0,
              height: itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight,
            }
          : virtualScrolling.getItemStyle(i, itemHeight);

        items_to_render.push(
          <VirtualizedItem
            key={i}
            index={i}
            style={style}
            onHeightChange={measureItemHeight}
            variableHeight={variableHeight}
          >
            {renderItem(items[i], i, style)}
          </VirtualizedItem>
        );
      }
    }
    
    return items_to_render;
  }, [visibleRange, items, renderItem, itemHeight, getItemTop, measureItemHeight, variableHeight, estimatedItemHeight]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
      
      {/* Scroll indicator */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
        </div>
      )}
    </div>
  );
}

// Individual virtualized item component
interface VirtualizedItemProps {
  index: number;
  style: React.CSSProperties;
  children: React.ReactNode;
  onHeightChange: (index: number, height: number) => void;
  variableHeight: boolean;
}

function VirtualizedItem({
  index,
  style,
  children,
  onHeightChange,
  variableHeight,
}: VirtualizedItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variableHeight && itemRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onHeightChange(index, entry.contentRect.height);
        }
      });

      resizeObserver.observe(itemRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [index, onHeightChange, variableHeight]);

  return (
    <div ref={itemRef} style={style}>
      {children}
    </div>
  );
}

// Grid virtualization component
interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  gap?: number;
  className?: string;
}

export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  className = '',
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Calculate grid dimensions
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  // Calculate visible range
  const visibleRowStart = Math.floor(scrollTop / (itemHeight + gap));
  const visibleRowEnd = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / (itemHeight + gap))
  );

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
    setScrollLeft(event.currentTarget.scrollLeft);
  }, []);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const itemsToRender = [];

    for (let row = visibleRowStart; row <= visibleRowEnd; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col;
        
        if (index >= items.length) break;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: col * (itemWidth + gap),
          top: row * (itemHeight + gap),
          width: itemWidth,
          height: itemHeight,
        };

        itemsToRender.push(
          <div key={index} style={style}>
            {renderItem(items[index], index, style)}
          </div>
        );
      }
    }

    return itemsToRender;
  }, [visibleRowStart, visibleRowEnd, columnsPerRow, items, itemWidth, itemHeight, gap, renderItem]);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          position: 'relative',
          height: totalHeight,
          width: columnsPerRow * (itemWidth + gap) - gap,
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

// Infinite scroll virtualized list
interface InfiniteVirtualizedListProps<T> extends VirtualizedListProps<T> {
  hasNextPage: boolean;
  isLoading: boolean;
  loadMore: () => void;
  threshold?: number;
}

export function InfiniteVirtualizedList<T>({
  hasNextPage,
  isLoading,
  loadMore,
  threshold = 5,
  ...listProps
}: InfiniteVirtualizedListProps<T>) {
  const lastScrollTop = useRef(0);

  const handleScroll = useCallback((scrollTop: number) => {
    listProps.onScroll?.(scrollTop);
    
    const { containerHeight } = listProps;
    const totalHeight = listProps.items.length * listProps.itemHeight;
    const scrollBottom = scrollTop + containerHeight;
    const distanceFromBottom = totalHeight - scrollBottom;

    // Load more when approaching the bottom
    if (
      distanceFromBottom < threshold * listProps.itemHeight &&
      hasNextPage &&
      !isLoading &&
      scrollTop > lastScrollTop.current // Only when scrolling down
    ) {
      loadMore();
    }

    lastScrollTop.current = scrollTop;
  }, [listProps, hasNextPage, isLoading, loadMore, threshold]);

  return (
    <VirtualizedList
      {...listProps}
      onScroll={handleScroll}
      renderItem={(item, index, style) => {
        // Show loading indicator for last few items
        const isNearEnd = index >= listProps.items.length - threshold;
        
        return (
          <div style={style}>
            {listProps.renderItem(item, index, style)}
            {isNearEnd && isLoading && (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      }}
    />
  );
}