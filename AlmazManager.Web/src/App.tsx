import {
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';

import ProtectedRoute from './auth/ProtectedRoute';

import AppLayout from './components/layout/AppLayout';

import CategoriesPage from './pages/CategoriesPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import InventoryPage from './pages/InventoryPage';
import IssuePage from './pages/IssuePage';
import LoginPage from './pages/LoginPage';
import MaterialsPage from './pages/MaterialsPage';
import OperationsPage from './pages/OperationsPage';
import ReceivingPage from './pages/ReceivingPage';
import SettingsPage from './pages/SettingsPage';
import StockPage from './pages/StockPage';
import UsersPage from './pages/UsersPage';

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route
                        path="/"
                        element={<DashboardPage />}
                    />

                    <Route
                        path="/stock"
                        element={<StockPage />}
                    />

                    <Route
                        path="/materials"
                        element={<MaterialsPage />}
                    />

                    <Route
                        path="/categories"
                        element={<CategoriesPage />}
                    />

                    <Route
                        path="/receiving"
                        element={<ReceivingPage />}
                    />

                    <Route
                        path="/issue"
                        element={<IssuePage />}
                    />

                    <Route
                        path="/inventory"
                        element={<InventoryPage />}
                    />

                    <Route
                        path="/documents"
                        element={<DocumentsPage />}
                    />

                    <Route
                        path="/operations"
                        element={<OperationsPage />}
                    />

                    <Route
                        path="/users"
                        element={<UsersPage />}
                    />

                    <Route
                        path="/settings"
                        element={<SettingsPage />}
                    />
                </Route>
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    );
}