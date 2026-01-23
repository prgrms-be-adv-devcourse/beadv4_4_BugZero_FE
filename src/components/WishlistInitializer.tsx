'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export default function WishlistInitializer() {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const fetchMyBookmarks = useWishlistStore((state) => state.fetchMyBookmarks);
    const reset = useWishlistStore((state) => state.reset);

    useEffect(() => {
        if (isLoggedIn) {
            fetchMyBookmarks();
        } else {
            reset();
        }
    }, [isLoggedIn, fetchMyBookmarks, reset]);

    return null;
}
