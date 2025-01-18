import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getStoredTokens, clearTokens } from '../utils/auth';

export const useAuth = (requireAuth = true) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const tokens = getStoredTokens();
            const hasValidTokens = !!tokens.access_token;
            
            setIsAuthenticated(hasValidTokens);
            setIsLoading(false);

            if (requireAuth && !hasValidTokens) {
                void router.push('/login');
            } else if (!requireAuth && hasValidTokens) {
                void router.push('/docs');
            }
        };

        checkAuth();
    }, [requireAuth, router]);

    const logout = () => {
        clearTokens();
        setIsAuthenticated(false);
        void router.push('/login');
    };

    return { isAuthenticated, isLoading, logout };
}; 