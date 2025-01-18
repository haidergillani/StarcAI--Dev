import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getStoredTokens, clearTokens } from '../utils/auth';

export const useAuth = (requireAuth: boolean = true) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const tokens = getStoredTokens();
            const hasValidTokens = !!tokens.access_token;
            
            setIsAuthenticated(hasValidTokens);
            setIsLoading(false);

            if (requireAuth && !hasValidTokens) {
                router.push('/login');
            } else if (!requireAuth && hasValidTokens) {
                router.push('/docs');
            }
        };

        checkAuth();
    }, [requireAuth, router]);

    const logout = () => {
        clearTokens();
        setIsAuthenticated(false);
        router.push('/login');
    };

    return { isAuthenticated, isLoading, logout };
}; 