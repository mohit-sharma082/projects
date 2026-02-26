'use client';
import React from 'react';

type Props = {
  interfaces: string[];
  nandTypes: string[];
  selectedInterfaces: string[];
  selectedNandTypes: string[];
  onToggleInterface: (i: string) => void;
  onToggleNandType: (n: string) => void;
  selectedCapacity: string | null;
  onSelectCapacity: (cap: string | null) => void;
};

const CAPACITY_PRESETS = [
  { id: '0-128', label: '≤ 128GB' },
  { id: '129-512', label: '129–512GB' },
  { id: '513-2048', label: '512GB–2TB' },
  { id: '2049-999999', label: '≥ 2TB' },
];

export default function TechnicalFiltersPanel({
  interfaces,
  nandTypes,
  selectedInterfaces,
  selectedNandTypes,
  onToggleInterface,
  onToggleNandType,
  selectedCapacity,
  onSelectCapacity,
}: Props) {
  return (
    <div className="space-y-4">

      {/* Capacity */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h4 className="font-medium">Capacity</h4>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelectCapacity(null)}
            className={`
              text-left px-3 py-1.5 rounded-md transition
              ${selectedCapacity === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'}
            `}
          >
            All
          </button>

          {CAPACITY_PRESETS.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCapacity(c.id)}
              className={`
                text-left px-3 py-1.5 rounded-md transition
                ${selectedCapacity === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'}
              `}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interface */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h4 className="font-medium">Interface</h4>

        <div className="flex flex-wrap gap-2">
          {interfaces.map((i) => {
            const active = selectedInterfaces.includes(i);

            return (
              <button
                key={i}
                onClick={() => onToggleInterface(i)}
                className={`
                  px-3 py-1.5 text-sm rounded-md border-2
                  transition-colors
                  ${active
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'hover:bg-muted'}
                `}
              >
                {i}
              </button>
            );
          })}
        </div>
      </div>

      {/* NAND */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h4 className="font-medium">NAND</h4>

        <div className="flex flex-wrap gap-2">
          {nandTypes.map((n) => {
            const active = selectedNandTypes.includes(n);

            return (
              <button
                key={n}
                onClick={() => onToggleNandType(n)}
                className={`
                  px-3 py-1.5 text-sm rounded-md border-2
                  transition-colors
                  ${active
                    ? 'bg-primary text-primary-foreground border-primary font-bold'
                    : 'hover:bg-muted'}
                `}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}