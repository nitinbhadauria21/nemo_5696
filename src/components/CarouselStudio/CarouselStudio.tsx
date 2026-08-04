'use client';

import React, { useState, useCallback, useEffect } from 'react';

import { toast } from 'sonner';
import {
  Slide,
  Format,
  SlideType,
  TextPos,
  Scrim,
  FORMAT_DIMENSIONS,
  ACCENT_COLORS,
  defaultSlide,
} from './types';
import SlideCanvas from './SlideCanvas';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const BRAND_ORANGE = '#EA7112';
const BRAND_DARK = '#1A1A2E';

// ─── Helpers ────────────────────────────────────────────────────────────────

function SectionDivider() {
  return <div className="border-t border-border my-1" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/45 mb-3 mt-1">
      {children}
    </p>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap"
      style={{
        background: active ? BRAND_ORANGE : 'transparent',
        color: active ? '#fff' : undefined,
      }}
    >
      {children}
    </button>
  );
}

function ColorSwatch({
  hex,
  selected,
  onClick,
}: {
  hex: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={hex}
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: hex,
        border: selected ? `3px solid ${BRAND_DARK}` : '2px solid #e5e7eb',
        outline: selected ? `2px solid ${BRAND_ORANGE}` : 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-foreground/65 mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-orange-400 transition-colors ${className}`}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-orange-400 transition-colors resize-none"
    />
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 gap-3">
        <span className="text-[0.75rem] font-semibold text-foreground/65 uppercase tracking-[0.06em]">
          {label}
        </span>
        <span className="text-[0.8125rem] font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="premium-range"
        style={{ ['--range-progress' as string]: `${progress}%` }}
      />
      <p className="mt-1.5 text-[0.6875rem] text-foreground/45 font-medium">
        Drag the handle left or right to adjust
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface CarouselStudioProps {
  initialTopic?: string;
  defaultSig?: string;
}

export default function CarouselStudio({
  initialTopic = '',
  defaultSig = '@nemo',
}: CarouselStudioProps) {
  const [format, setFormat] = useState<Format>('3:4');
  const [slides, setSlides] = useState<Slide[]>([defaultSlide(defaultSig)]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (initialTopic) {
      setSlides((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], title: initialTopic };
        return updated;
      });
    }
  }, [initialTopic]);

  const slide = slides[currentIndex];

  const updateSlide = useCallback(
    (patch: Partial<Slide>) => {
      setSlides((prev) => {
        const updated = [...prev];
        updated[currentIndex] = { ...updated[currentIndex], ...patch };
        return updated;
      });
    },
    [currentIndex]
  );

  const addSlide = () => {
    const newSlide = defaultSlide(defaultSig);
    setSlides((prev) => {
      const updated = [...prev];
      updated.splice(currentIndex + 1, 0, newSlide);
      return updated;
    });
    setCurrentIndex((i) => i + 1);
    toast.success('Slide added');
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== currentIndex));
    setCurrentIndex((i) => Math.max(0, i - 1));
    toast('Slide deleted');
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateSlide({ img: e.target?.result as string });
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  };

  const exportSlide = async (slideIndex: number) => {
    const dims = FORMAT_DIMENSIONS[format];
    const html2canvas = (await import('html2canvas')).default;

    const previewEl = document.getElementById(`slide-preview-${slideIndex}`);
    if (!previewEl) return;

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${dims.w}px;
      height: ${dims.h}px;
      container-type: size;
      overflow: hidden;
    `;

    const clone = previewEl.cloneNode(true) as HTMLElement;
    clone.style.width = dims.w + 'px';
    clone.style.height = dims.h + 'px';
    clone.style.containerType = 'size';
    container.appendChild(clone);
    document.body.appendChild(container);

    await document.fonts.ready;

    const canvas = await html2canvas(container, {
      width: dims.w,
      height: dims.h,
      scale: 1,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    document.body.removeChild(container);

    const link = document.createElement('a');
    link.download = `carousel_slide_${String(slideIndex + 1).padStart(2, '0')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportCurrent = async () => {
    setExporting(true);
    try {
      await exportSlide(currentIndex);
      toast.success('Slide exported as PNG ✓');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      for (let i = 0; i < slides.length; i++) {
        setCurrentIndex(i);
        await exportSlide(i);
        await new Promise((r) => setTimeout(r, 400));
      }
      toast.success(`All ${slides.length} slides exported ✓`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const dims = FORMAT_DIMENSIONS[format];

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-0 flex-1">
      {/* ── LEFT PANEL ── */}
      <div
        className="w-full lg:w-[320px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 130px)' }}
      >
        <div className="px-4 py-4 space-y-0">
          {/* §01 FORMAT */}
          <div className="pb-4">
            <SectionTitle>§01 Format</SectionTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['3:4', '4:5', '1:1', '9:16'] as Format[]).map((f) => (
                <SegBtn key={f} active={format === f} onClick={() => setFormat(f)}>
                  {FORMAT_DIMENSIONS[f].label}
                </SegBtn>
              ))}
            </div>
          </div>

          <SectionDivider />

          {/* §02 IMAGE */}
          <div className="py-4">
            <SectionTitle>§02 Image for This Slide</SectionTitle>
            {!slide.img ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('img-upload')?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
              >
                <p className="text-sm text-foreground/60">Drop image here or click to upload</p>
                <p className="text-xs text-foreground/40 mt-1">PNG, JPG, WEBP</p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.img}
                  alt="Uploaded slide background"
                  className="w-full h-24 object-cover"
                />
                <button
                  onClick={() => updateSlide({ img: null })}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md hover:bg-black/80 transition-all"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              id="img-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            <div className="mt-4">
              <Slider
                label="Image Scale"
                value={slide.imgScale}
                min={100}
                max={220}
                step={1}
                unit="%"
                onChange={(v) => updateSlide({ imgScale: v })}
              />
              <Slider
                label="Horizontal Position"
                value={slide.imgPosX}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => updateSlide({ imgPosX: v })}
              />
              <Slider
                label="Vertical Position"
                value={slide.imgPosY}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => updateSlide({ imgPosY: v })}
              />
            </div>
          </div>

          <SectionDivider />

          {/* §03 LAYOUT & TEXT */}
          <div className="py-4">
            <SectionTitle>§03 Layout &amp; Text</SectionTitle>

            {/* Slide type */}
            <div className="mb-1">
              <FieldLabel>Slide Type</FieldLabel>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(['cover', 'bignum', 'numbered', 'free', 'outro'] as SlideType[]).map((t) => {
                  const labels: Record<SlideType, string> = {
                    cover: 'Cover',
                    bignum: 'Big №',
                    numbered: 'Num',
                    free: 'Free',
                    outro: 'Outro',
                  };
                  return (
                    <SegBtn
                      key={t}
                      active={slide.type === t}
                      onClick={() => updateSlide({ type: t })}
                    >
                      {labels[t]}
                    </SegBtn>
                  );
                })}
              </div>
            </div>

            {/* Text position */}
            <div className="mt-3 mb-4">
              <FieldLabel>Text Position</FieldLabel>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(['center', 'bottom'] as TextPos[]).map((p) => (
                  <SegBtn
                    key={p}
                    active={slide.textPos === p}
                    onClick={() => updateSlide({ textPos: p })}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SegBtn>
                ))}
              </div>
            </div>

            {/* Conditional fields */}
            <div className="space-y-3">
              {slide.type !== 'bignum' && (
                <div>
                  <FieldLabel>Kicker</FieldLabel>
                  <TextInput
                    value={slide.kicker}
                    onChange={(v) => updateSlide({ kicker: v })}
                    placeholder="SHORT LABEL"
                  />
                </div>
              )}

              {slide.type === 'numbered' && (
                <div>
                  <FieldLabel>Slide Number</FieldLabel>
                  <TextInput
                    value={slide.num}
                    onChange={(v) => updateSlide({ num: v })}
                    placeholder="01"
                  />
                </div>
              )}

              {slide.type === 'bignum' && (
                <div>
                  <FieldLabel>Big Number Fields</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-foreground/50 mb-1">Number</p>
                      <TextInput
                        value={slide.bignum}
                        onChange={(v) => updateSlide({ bignum: v })}
                        placeholder="47"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground/50 mb-1">Suffix</p>
                      <TextInput
                        value={slide.bigsuffix}
                        onChange={(v) => updateSlide({ bigsuffix: v })}
                        placeholder="%"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-foreground/50 mb-1">Label</p>
                      <TextInput
                        value={slide.toplabel}
                        onChange={(v) => updateSlide({ toplabel: v })}
                        placeholder="label"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <FieldLabel>
                  Title{' '}
                  <span className="normal-case font-normal text-foreground/40">
                    (*word* = italic)
                  </span>
                </FieldLabel>
                <TextArea
                  rows={3}
                  value={slide.title}
                  onChange={(v) => updateSlide({ title: v })}
                  placeholder="Your main headline here..."
                />
              </div>

              <div>
                <FieldLabel>Body (optional)</FieldLabel>
                <TextArea
                  rows={3}
                  value={slide.body}
                  onChange={(v) => updateSlide({ body: v })}
                  placeholder="Supporting paragraph text..."
                />
              </div>

              {slide.type === 'outro' && (
                <div>
                  <FieldLabel>Signature / Handle</FieldLabel>
                  <TextInput
                    value={slide.sig}
                    onChange={(v) => updateSlide({ sig: v })}
                    placeholder="@nemo"
                  />
                </div>
              )}
            </div>
          </div>

          <SectionDivider />

          {/* §04 STYLE */}
          <div className="py-4">
            <SectionTitle>§04 Style</SectionTitle>

            <div className="mb-4">
              <FieldLabel>Accent Color</FieldLabel>
              <div className="flex items-center gap-2 mt-1">
                {ACCENT_COLORS.map((c) => (
                  <ColorSwatch
                    key={`accent-${c.hex}`}
                    hex={c.hex}
                    selected={slide.accent === c.hex}
                    onClick={() => updateSlide({ accent: c.hex })}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Label Color</FieldLabel>
              <div className="flex items-center gap-2 mt-1">
                {ACCENT_COLORS.map((c) => (
                  <ColorSwatch
                    key={`label-${c.hex}`}
                    hex={c.hex}
                    selected={slide.labelColor === c.hex}
                    onClick={() => updateSlide({ labelColor: c.hex })}
                  />
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Gradient Overlay</FieldLabel>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mt-1">
                {(['bottom', 'full', 'none'] as Scrim[]).map((s) => (
                  <SegBtn
                    key={s}
                    active={slide.scrim === s}
                    onClick={() => updateSlide({ scrim: s })}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SegBtn>
                ))}
              </div>
            </div>
          </div>

          <SectionDivider />

          {/* §05 EXPORT */}
          <div className="py-4">
            <SectionTitle>§05 Export</SectionTitle>
            <div className="space-y-2">
              <button
                onClick={handleExportCurrent}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
              >
                📥 Export This Slide
              </button>
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: BRAND_ORANGE }}
              >
                📦 Export All Slides ({slides.length})
              </button>
            </div>
            <p className="text-[11px] italic text-foreground/40 mt-3 leading-relaxed">
              Images stay local in your browser. Nothing is uploaded to Nemo servers.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT AREA (Preview) ── */}
      <div className="flex-1 flex flex-col items-center bg-background overflow-y-auto p-4 sm:p-6">
        {/* Slide navigation bar */}
        <div className="flex items-center gap-2 mb-5 bg-card border border-border rounded-xl px-3 py-2 w-full max-w-xl">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-foreground">
            Slide {currentIndex + 1} of {slides.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={currentIndex === slides.length - 1}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
          >
            Next →
          </button>
          <button
            onClick={addSlide}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
          >
            + Add
          </button>
          <button
            onClick={deleteSlide}
            disabled={slides.length <= 1}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
          >
            🗑
          </button>
        </div>

        {/* Preview shell */}
        <div
          className="rounded-xl overflow-hidden flex-shrink-0"
          style={{
            width: dims.previewW,
            height: dims.previewH,
            backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%)',
            backgroundSize: '16px 16px',
          }}
        >
          <SlideCanvas slide={slide} format={format} id={`slide-preview-${currentIndex}`} />
        </div>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5 mt-4">
            {slides.map((_, i) => (
              <button
                key={`dot-${i}`}
                onClick={() => setCurrentIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === currentIndex ? 20 : 8,
                  height: 8,
                  background: i === currentIndex ? BRAND_ORANGE : '#d1d5db',
                }}
              />
            ))}
          </div>
        )}

        {/* Format info */}
        <p className="text-xs text-foreground/40 mt-3">
          {dims.label} · Preview {dims.previewW}×{dims.previewH}px · Export {dims.w}×{dims.h}px
        </p>
      </div>
    </div>
  );
}
