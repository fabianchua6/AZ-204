'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseScrollDirectionOptions {
    threshold?: number;  // Minimum scroll delta to trigger
    initialVisible?: boolean;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
    const { threshold = 10, initialVisible = true } = options;

    const [isVisible, setIsVisible] = useState(initialVisible);
    const [lastScrollY, setLastScrollY] = useState(0);

    const handleScroll = useCallback(() => {
        const currentScrollY = window.scrollY;

        // Always show at the very top
        if (currentScrollY < 50) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            return;
        }

        const scrollDelta = currentScrollY - lastScrollY;

        // Scrolling down past threshold = hide
        if (scrollDelta > threshold) {
            setIsVisible(false);
            setLastScrollY(currentScrollY);
        }
        // Scrolling up past threshold = show
        else if (scrollDelta < -threshold) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
        }
    }, [lastScrollY, threshold]);

    useEffect(() => {
        // Set initial scroll position
        setLastScrollY(window.scrollY);

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return { isHeaderVisible: isVisible };
}
