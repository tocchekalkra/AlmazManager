import {
    useState,
    type FormEvent,
} from 'react';

import {
    LockKeyhole,
    User,
    Warehouse,
} from 'lucide-react';

import {
    Navigate,
    useNavigate,
} from 'react-router-dom';

import api from '../api/api';
import { useAuth } from '../auth/AuthContext';


type LoginResponse = {
    accessToken: string;
    tokenType: string;
    expiresAtUtc: string;
    userId: string;
    fullName: string;
    login: string;
    role: string;
};


export default function LoginPage() {
    const navigate = useNavigate();

    const {
        login,
        isAuthenticated,
    } = useAuth();

    const [userLogin, setUserLogin] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [error, setError] =
        useState('');

    const [loading, setLoading] =
        useState(false);


    if (isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response =
                await api.post<LoginResponse>(
                    '/auth/login',
                    {
                        login: userLogin,
                        password,
                    },
                );

            const token =
                response.data.accessToken;

            if (!token) {
                throw new Error(
                    'API не вернул JWT-токен.',
                );
            }

            /*
             * Сохраняем дополнительную информацию
             * о пользователе.
             *
             * Позже перенесём это в AuthContext.
             */

            localStorage.setItem(
                'almaz_user',
                JSON.stringify({
                    userId: response.data.userId,
                    fullName: response.data.fullName,
                    login: response.data.login,
                    role: response.data.role,
                    expiresAtUtc:
                        response.data.expiresAtUtc,
                }),
            );

            /*
             * AuthContext сохраняет JWT.
             */
            login(token);

            /*
             * После успешного входа
             * отправляем пользователя
             * на главную страницу.
             */
            navigate('/', {
                replace: true,
            });

        } catch (requestError: any) {

            console.error(
                'Ошибка авторизации:',
                requestError,
            );

            if (
                requestError?.response?.status === 401
            ) {
                setError(
                    'Неверный логин или пароль.',
                );
            }
            else if (
                requestError?.response?.status === 400
            ) {
                setError(
                    requestError?.response?.data
                        ?.message ??
                    'Проверьте введённые данные.',
                );
            }
            else if (
                requestError?.response?.status >= 500
            ) {
                setError(
                    'Ошибка сервера. Попробуйте ещё раз.',
                );
            }
            else if (
                requestError?.response
            ) {
                setError(
                    requestError.response.data
                        ?.message ??
                    requestError.response.data
                        ?.title ??
                    'Не удалось выполнить вход.',
                );
            }
            else {
                setError(
                    'Не удалось подключиться к серверу.',
                );
            }

        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="login-page">

            <div
                className="login-background-glow"
            />

            <section className="login-card">

                <div className="login-brand">

                    <div className="login-logo">
                        <Warehouse size={28} />
                    </div>

                    <div>

                        <div
                            className="login-brand-name"
                        >
                            Almaz
                            <span>Manager</span>
                        </div>

                        <div
                            className="login-brand-subtitle"
                        >
                            СИСТЕМА СКЛАДСКОГО УЧЁТА
                        </div>

                    </div>

                </div>


                <div className="login-heading">

                    <p className="eyebrow">
                        WELCOME BACK
                    </p>

                    <h1>
                        Вход в систему
                    </h1>

                    <p>
                        Введите данные своей
                        учётной записи.
                    </p>

                </div>


                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >

                    <label>

                        <span>
                            Логин
                        </span>

                        <div className="login-input">

                            <User size={18} />

                            <input
                                value={userLogin}
                                onChange={(event) =>
                                    setUserLogin(
                                        event.target.value,
                                    )
                                }
                                placeholder="Введите логин"
                                autoComplete="username"
                                disabled={loading}
                                required
                            />

                        </div>

                    </label>


                    <label>

                        <span>
                            Пароль
                        </span>

                        <div className="login-input">

                            <LockKeyhole size={18} />

                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value,
                                    )
                                }
                                placeholder="Введите пароль"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />

                        </div>

                    </label>


                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}


                    <button
                        className="login-submit"
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? 'Выполняется вход...'
                            : 'Войти'}

                    </button>

                </form>


                <div className="login-footer">
                    AlmazManager • 2026
                </div>

            </section>

        </div>
    );
}