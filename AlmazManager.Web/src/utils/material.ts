const widthFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export type MaterialDisplaySource = {
    name?: string | null;
    materialName?: string | null;
    widthMeters?: number | null;
    kind?: string | null;
    colorCode?: string | null;
    colorName?: string | null;
};

export function formatWidth(widthMeters?: number | null) {
    return widthMeters == null
        ? ''
        : `${widthFormatter.format(widthMeters)} м`;
}

export function materialDisplayName(material: MaterialDisplaySource) {
    const originalName = material.name ?? material.materialName ?? 'Материал';
    const width = formatWidth(material.widthMeters);
    const baseName = width
        ? originalName.replace(/\s+-?\s*\d+(?:[.,]\d+)?\s*м\s*$/i, '').trim()
        : originalName;

    if (material.kind === 'Oracal641') {
        const color = [material.colorCode, material.colorName]
            .filter(Boolean)
            .join(' ');
        const label = color && !baseName.toLowerCase().includes(color.toLowerCase())
            ? `${baseName} ${color}`
            : baseName;

        return width ? `${label} - ${width}` : label;
    }

    return width ? `${baseName} - ${width}` : baseName;
}

export function filmCategoryParts(categoryName: string) {
    const normalized = categoryName.toLowerCase();
    const isFilm = normalized.includes('плён') || normalized.includes('плен');

    return {
        isFilm,
        base: normalized.includes('прозрач') ? 'Transparent' : 'White',
        finish: normalized.includes('глян') ? 'Glossy' : 'Matte',
    } as const;
}

export function findFilmCategoryId(
    categories: Array<{ id: string; name: string; isActive: boolean }>,
    base: 'White' | 'Transparent',
    finish: 'Matte' | 'Glossy',
) {
    return categories.find((category) => {
        if (!category.isActive) return false;
        const parts = filmCategoryParts(category.name);
        return parts.isFilm && parts.base === base && parts.finish === finish;
    })?.id ?? '';
}
