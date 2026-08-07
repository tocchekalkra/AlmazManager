export type JwtUser = {
    id?: string;
    name: string;
    role?: string;
};

function decodeBase64Url(value: string) {
    const normalized = value
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const decoded = atob(normalized);

    return decodeURIComponent(
        Array.from(decoded)
            .map(
                (character) =>
                    '%' +
                    character.charCodeAt(0).toString(16).padStart(2, '0'),
            )
            .join(''),
    );
}

export function getUserFromToken(token: string): JwtUser {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            return {
                name: 'Пользователь',
            };
        }

        const payload = JSON.parse(
            decodeBase64Url(parts[1]),
        );

        const name =
            payload[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
            ] ??
            payload.name ??
            payload.unique_name ??
            payload.sub ??
            'Пользователь';

        const role =
            payload[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
            ] ??
            payload.role;

        const id =
            payload[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
            ] ??
            payload.nameid ??
            payload.sub;

        return {
            id,
            name,
            role,
        };
    } catch {
        return {
            name: 'Пользователь',
        };
    }
}