import {
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';

import ProtectedRoute from './auth/ProtectedRoute';
import AuthorizationRoute from './auth/AuthorizationRoute';

import AppLayout from './components/layout/AppLayout';

import CategoriesPage from './pages/CategoriesPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import InventoryPage from './pages/InventoryPage';
import IssuePage from './pages/IssuePage';
import LoginPage from './pages/LoginPage';
import MaterialsPage from './pages/MaterialsPage';
import OperationsPage from './pages/OperationsPage';
import OracalInventoryPage from './pages/OracalInventoryPage';
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

                    <Route element={<AuthorizationRoute administratorOnly />}>
                        <Route
                            path="/categories"
                            element={<CategoriesPage />}
                        />
                    </Route>

                    <Route
                        path="/receiving"
                        element={<ReceivingPage />}
                    />

                    <Route
                        path="/issue"
                        element={<IssuePage />}
                    />

                    <Route
                        element={
                            <AuthorizationRoute
                                permission="canInventoryStandard"
                            />
                        }
                    >
                        <Route
                            path="/inventory"
                            element={<InventoryPage />}
                        />
                    </Route>

                    <Route
                        element={
                            <AuthorizationRoute
                                permission="canInventoryOracal"
                            />
                        }
                    >
                        <Route
                            path="/inventory/oracal"
                            element={<OracalInventoryPage />}
                        />
                    </Route>

                    <Route
                        path="/documents"
                        element={<DocumentsPage />}
                    />

                    <Route
                        path="/operations"
                        element={<OperationsPage />}
                    />

                    <Route element={<AuthorizationRoute administratorOnly />}>
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
