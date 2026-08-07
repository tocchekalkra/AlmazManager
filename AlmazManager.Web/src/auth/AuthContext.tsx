import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import {
    getUserFromToken,
    type JwtUser,
} from './token';

type AuthContextType = {
    token: string | null;
    user: JwtUser | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
};

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined,
    );

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [token, setToken] =
        useState<string | null>(() =>
            localStorage.getItem(
                'almazmanager_token',
            ),
        );

    const [user, setUser] =
        useState<JwtUser | null>(() => {
            const stored =
                localStorage.getItem(
                    'almazmanager_user',
                );

            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch {
                    return null;
                }
            }

            const storedToken =
                localStorage.getItem(
                    'almazmanager_token',
                );

            if (!storedToken) {
                return null;
            }

            return getUserFromToken(
                storedToken,
            );
        });

    function login(newToken: string) {
        const decodedUser =
            getUserFromToken(newToken);

        localStorage.setItem(
            'almazmanager_token',
            newToken,
        );

        localStorage.setItem(
            'almazmanager_user',
            JSON.stringify(decodedUser),
        );

        setToken(newToken);
        setUser(decodedUser);
    }

    function logout() {
        localStorage.removeItem(
            'almazmanager_token',
        );

        localStorage.removeItem(
            'almazmanager_user',
        );

        setToken(null);
        setUser(null);
    }

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token),
            login,
            logout,
        }),
        [token, user],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth должен использоваться внутри AuthProvider',
        );
    }

    return context;
}