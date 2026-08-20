import {
    useEffect,
    useState,
} from 'react';

import {
    Navigate,
    Outlet,
} from 'react-router-dom';

import api from '../api/api';
import { useAuth } from './AuthContext';

type CurrentUserAccess = {
    canInventoryStandard: boolean;
    canInventoryOracal: boolean;
    canManageSupplies: boolean;
};

type AuthorizationRouteProps = {
    administratorOnly?: boolean;
    permission?: keyof CurrentUserAccess;
};

export default function AuthorizationRoute({
    administratorOnly = false,
    permission,
}: AuthorizationRouteProps) {
    const { user } = useAuth();
    const isAdministrator = user?.role === 'Administrator';
    const [allowed, setAllowed] = useState<boolean | null>(() => {
        if (administratorOnly) {
            return isAdministrator;
        }

        if (!permission || isAdministrator) {
            return true;
        }

        return null;
    });

    useEffect(() => {
        if (administratorOnly) {
            setAllowed(isAdministrator);
            return;
        }

        if (!permission || isAdministrator) {
            setAllowed(true);
            return;
        }

        let cancelled = false;

        async function loadAccess() {
            try {
                setAllowed(null);

                const response = await api.get<CurrentUserAccess>(
                    '/users/me/access',
                );

                if (!cancelled) {
                    setAllowed(Boolean(response.data[permission!]));
                }
            } catch (requestError) {
                console.error(
                    'Не удалось проверить права маршрута:',
                    requestError,
                );

                if (!cancelled) {
                    setAllowed(false);
                }
            }
        }

        void loadAccess();

        return () => {
            cancelled = true;
        };
    }, [administratorOnly, isAdministrator, permission]);

    if (allowed === null) {
        return null;
    }

    if (!allowed) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
