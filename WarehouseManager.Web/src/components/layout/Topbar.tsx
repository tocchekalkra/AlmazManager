import {
    Bell,
    ChevronDown,
    Moon,
    Search,
} from 'lucide-react';

export default function Topbar() {
    return (
        <header className="topbar">
            <div className="global-search">
                <Search size={19} />

                <input
                    placeholder="Поиск по материалам, документам, операциям..."
                />
            </div>

            <div className="topbar-actions">
                <button className="icon-button" type="button">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>

                <button className="icon-button" type="button">
                    <Moon size={20} />
                </button>

                <button className="profile-button" type="button">
                    <div className="profile-avatar">
                        А
                        <span className="online-dot" />
                    </div>

                    <div className="profile-copy">
                        <strong>Администратор</strong>
                        <span>admin</span>
                    </div>

                    <ChevronDown size={16} />
                </button>
            </div>
        </header>
    );
}