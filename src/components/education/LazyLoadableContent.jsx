// src/components/education/LazyLoadableContent.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

export function LazyLoadableContent({
  children,
  threshold = 0.1, // How much of the element needs to be visible to trigger loading
  placeholderHeight = '300px',
  loadingText = 'Loading content...',
  delayMs = 0, // Optional delay to simulate loading or prioritize critical content
  once = true, // Whether to load only once or every time the component comes into view
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef(null);

  const checkVisibility = useCallback(() => {
    if (!contentRef.current) return;
    
    const rect = contentRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Check if element is in viewport with the given threshold
    const isElementVisible = 
      rect.top <= windowHeight * (1 - threshold) && 
      rect.bottom >= windowHeight * threshold;
    
    if (isElementVisible) {
      setIsVisible(true);
      
      // If we're only loading once and we're visible, we can stop observing
      if (once) {
        window.removeEventListener('scroll', checkVisibility);
        window.removeEventListener('resize', checkVisibility);
      }
    } else if (!once) {
      setIsVisible(false);
    }
  }, [threshold, once]);

  // Initialize visibility checking
  useEffect(() => {
    checkVisibility();
    
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    
    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [checkVisibility]);

  // Handle actual loading with optional delay
  useEffect(() => {
    if (isVisible && !isLoaded) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, delayMs);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLoaded, delayMs]);

  // If not visible or not yet loaded, show placeholder
  if (!isLoaded) {
    return (
      <div 
        ref={contentRef} 
        className="flex items-center justify-center" 
        style={{ height: placeholderHeight }}
      >
        {isVisible ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{loadingText}</p>
          </div>
        ) : (
          <div className="h-full w-full bg-gray-100/30 animate-pulse rounded"></div>
        )}
      </div>
    );
  }

  // Content is loaded and should be displayed
  return <div ref={contentRef}>{children}</div>;
}