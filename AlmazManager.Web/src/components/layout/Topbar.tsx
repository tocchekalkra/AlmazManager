import {
    ChevronDown,
    LogOut,
} from 'lucide-react';

import {
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    useAuth,
} from '../../auth/AuthContext';

export default function Topbar() {
    const navigate = useNavigate();

    const {
        user,
        logout,
    } = useAuth();

    const [menuOpen, setMenuOpen] =
        useState(false);

    const displayName =
        user?.name ??
        'Пользователь';

    const firstLetter =
        displayName
            .charAt(0)
            .toUpperCase();

    function handleLogout() {
        logout();

        navigate('/login', {
            replace: true,
        });
    }

    return (
        <header className="topbar">
            <div className="topbar-context">
                <strong>Склад рекламного производства</strong>
                <span>Единый журнал движения материалов</span>
            </div>

            <div className="topbar-actions">
                <div className="profile-wrapper">
                    <button
                        className="profile-button"
                        type="button"
                        onClick={() =>
                            setMenuOpen(
                                (value) => !value,
                            )
                        }
                    >
                        <div className="profile-avatar">
                            {firstLetter}
                            <span className="online-dot" />
                        </div>

                        <div className="profile-copy">
                            <strong>
                                {displayName}
                            </strong>

                            <span>
                                {user?.role ??
                                    'Пользователь'}
                            </span>
                        </div>

                        <ChevronDown
                            size={16}
                        />
                    </button>

                    {menuOpen && (
                        <div className="profile-menu">
                            <button
                                type="button"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} />
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
