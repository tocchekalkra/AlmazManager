import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import api from '../api/api';
import { useAuth } from '../auth/AuthContext';

export type ThemeMode = 'System' | 'Dark' | 'Light';

type PreferencesResponse = {
    theme: ThemeMode;
    materialOrder: string[];
    categoryOrder: string[];
};

type ThemeContextValue = {
    mode: ThemeMode;
    resolved: 'dark' | 'light';
    setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth();
    const [mode, setModeState] = useState<ThemeMode>('System');
    const [systemDark, setSystemDark] = useState(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    );

    const resolved = mode === 'System'
        ? systemDark ? 'dark' : 'light'
        : mode.toLowerCase() as 'dark' | 'light';

    useEffect(() => {
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
        query.addEventListener('change', listener);
        return () => query.removeEventListener('change', listener);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = resolved;
        document.documentElement.style.colorScheme = resolved;
    }, [resolved]);

    useEffect(() => {
        if (!token) return;

        let cancelled = false;
        api.get<PreferencesResponse>('/preferences')
            .then((response) => {
                if (!cancelled && response.data.theme) {
                    setModeState(response.data.theme);
                }
            })
            .catch(() => undefined);

        return () => { cancelled = true; };
    }, [token]);

    async function setMode(nextMode: ThemeMode) {
        setModeState(nextMode);
        await api.put('/preferences', { theme: nextMode });
    }

    const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used inside ThemeProvider');
    return context;
}
