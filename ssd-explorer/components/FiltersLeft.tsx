'use client';
import React, { useMemo } from 'react';

type Props = {
  brands: string[];
  selectedBrands: string[];
  onToggleBrand: (b: string) => void;
};

export default function BrandFiltersPanel({
  brands,
  selectedBrands,
  onToggleBrand,
}: Props) {
  const brandsMapByLetter = useMemo(() => {
    return brands.reduce((acc, brand) => {
      const letter = brand[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(brand);
      return acc;
    }, {} as Record<string, string[]>);
  }, [brands]);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h3 className="font-semibold text-primary">Brands</h3>

      {Object.keys(brandsMapByLetter)
        .sort()
        .map((letter) => (
          <div key={letter}>
            <h5 className="text-sm font-bold pl-1 text-muted-foreground/80">
              {letter}
            </h5>

            <div className="flex flex-wrap gap-2 mt-1">
              {brandsMapByLetter[letter].map((b) => {
                const active = selectedBrands.includes(b);

                return (
                  <button
                    key={b}
                    onClick={() => onToggleBrand(b)}
                    className={`
                      px-3 py-1.5 text-sm rounded-md border-2
                      transition-colors
                      ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'hover:bg-muted'
                      }
                    `}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}