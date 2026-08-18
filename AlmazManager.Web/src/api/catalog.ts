import api from './api';

type CatalogPage<T> = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: T[];
};

export async function loadAllMaterialCatalogItems<T>(
    query: Record<string, string | number | boolean> = {},
) {
    const items: T[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const params = new URLSearchParams();

        Object.entries(query).forEach(([key, value]) => {
            params.set(key, String(value));
        });

        params.set('page', String(page));
        params.set('pageSize', '100');

        const response = await api.get<CatalogPage<T>>(
            `/materials/catalog?${params.toString()}`,
        );

        items.push(...(response.data.items ?? []));
        totalPages = response.data.totalPages;
        page += 1;
    } while (page <= totalPages);

    return items;
}
