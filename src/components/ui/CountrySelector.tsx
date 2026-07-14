'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, X, AlertCircle } from 'lucide-react';
import { COUNTRIES, MAX_COUNTRIES, type Country } from '@/lib/countries';

interface CountrySelectorProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  compact?: boolean;
}

export default function CountrySelector({ selectedCountries, onChange, compact = false }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      onChange(selectedCountries.filter((c) => c !== code));
    } else {
      if (selectedCountries.length >= MAX_COUNTRIES) return;
      onChange([...selectedCountries, code]);
    }
  };

  const removeCountry = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedCountries.filter((c) => c !== code));
  };

  const getCountry = (code: string) => COUNTRIES.find((c) => c.code === code);
  const atLimit = selectedCountries.length >= MAX_COUNTRIES;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o); }}
        className={`flex items-center gap-2 rounded-lg border transition-all duration-150 cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        } ${
          selectedCountries.length > 0
            ? 'border-primary/40 bg-primary/5 text-foreground'
            : 'border-border bg-input text-muted-foreground hover:text-foreground hover:border-primary/30'
        }`}
      >
        <Globe size={compact ? 12 : 14} className={selectedCountries.length > 0 ? 'text-primary' : ''} />
        {selectedCountries.length === 0 ? (
          <span className="font-sans font-medium">Location</span>
        ) : (
          <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
            {selectedCountries.map((code) => {
              const c = getCountry(code);
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[11px] font-sans font-semibold"
                >
                  {c?.flag} {c?.code}
                  <button
                    onClick={(e) => removeCountry(code, e)}
                    className="hover:text-red-400 transition-colors ml-0.5"
                  >
                    <X size={9} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <ChevronDown
          size={compact ? 10 : 12}
          className={`ml-auto flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono-custom uppercase tracking-widest text-muted-foreground">
                Select Countries
              </p>
              <span
                className={`text-[10px] font-mono-custom font-bold px-2 py-0.5 rounded-full ${
                  atLimit
                    ? 'bg-red-500/10 text-red-500' :'bg-primary/10 text-primary'
                }`}
              >
                {selectedCountries.length}/{MAX_COUNTRIES}
              </span>
            </div>
            {atLimit && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-sans mb-2">
                <AlertCircle size={11} />
                Max {MAX_COUNTRIES} countries reached
              </div>
            )}
            <input
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground font-sans text-center py-4">No countries found</p>
            ) : (
              filtered.map((country) => {
                const selected = selectedCountries.includes(country.code);
                const disabled = !selected && atLimit;
                return (
                  <button
                    key={country.code}
                    onClick={() => toggleCountry(country.code)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors text-sm font-sans ${
                      selected
                        ? 'bg-primary/10 text-primary'
                        : disabled
                        ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-[10px] font-mono-custom text-muted-foreground">{country.code}</span>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {selectedCountries.length > 0 && (
            <div className="px-3 py-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-sans">
                Showing trends for selected countries only
              </span>
              <button
                onClick={() => { onChange([]); setOpen(false); }}
                className="text-[11px] text-red-400 hover:text-red-500 font-sans font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
