import { ComponentType } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../pages/components/Spinner';

export const withAuth = <P extends object>(
    WrappedComponent: ComponentType<P>,
    requireAuth: boolean = true
) => {
    return function WithAuthComponent(props: P) {
        const { isAuthenticated, isLoading } = useAuth(requireAuth);

        if (isLoading) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <Spinner />
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}; 