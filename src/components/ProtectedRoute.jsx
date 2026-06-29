import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [], permission }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If user exists but is invalid (e.g. no role), treat as unauthenticated
    if (user && !user.role) {
        console.warn('[ProtectedRoute] User object present but missing role:', user);
        return <Navigate to="/login" replace />;
    }

    const hasRole = roles.length === 0 || roles.includes(user.role);
    const hasPermission = !permission || user.permissions?.includes(permission) || user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!hasRole || !hasPermission) {
        console.warn('[ProtectedRoute] Access denied. Redirecting...', {
            path: window.location.pathname,
            userRole: user.role,
            requiredRoles: roles,
            requiredPermission: permission,
            hasRole,
            hasPermission
        });

        if (user.role === 'OWNER') return <Navigate to="/onboarding" replace />;
        // If staff, try to find a safe route
        if (user.permissions?.includes('orders')) return <Navigate to="/orders" replace />;
        if (user.permissions?.includes('dashboard')) return <Navigate to="/dashboard" replace />;

        console.log('[ProtectedRoute] Final fallback redirect to /');
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
