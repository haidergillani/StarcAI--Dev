import type { ComponentType } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../pages/components/Spinner';

export const withAuth = <P extends object>(
    WrappedComponent: ComponentType<P>,
    requireAuth = true
) => {
    return function WithAuthComponent(props: P) {
        const { isLoading } = useAuth(requireAuth);

        if (isLoading) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <Spinner duration={5000} />
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}; 