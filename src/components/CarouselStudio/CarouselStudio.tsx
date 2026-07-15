'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

import { toast } from 'sonner';
import {
  Slide, Format, SlideType, TextPos, Scrim,
  FORMAT_DIMENSIONS, ACCENT_COLORS, defaultSlide,
} from './types';
import SlideCanvas from './SlideCanvas';

// ─── Helpers ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-mono-custom font-bold uppercase tracking-widest text-foreground/55 mb-3">
      {children}
    </p>
  );
}

function SegBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 text-sm font-bold font-sans rounded-lg transition-all"
      style={{
        background: active ? '#002FA7' : undefined,
        color: active ? '#fff' : undefined,
      }}
    >
      {children}
    </button>
  );
}

function ColorSwatch({
  hex, selected, onClick,
}: { hex: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={hex}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: hex,
        border: selected ? '3px solid #1A1A2E' : '2px solid #e5e7eb',
        outline: selected ? '2px solid #002FA7' : 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    />
  );
}

function Slider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-sans font-semibold text-foreground/70">{label}</span>
        <span className="text-sm font-mono-custom font-bold text-foreground">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#002FA7' }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface CarouselStudioProps {
  initialTopic?: string;
  defaultSig?: string;
}

export default function CarouselStudio({ initialTopic = '', defaultSig = '@nemo' }: CarouselStudioProps) {
  const [format, setFormat] = useState<Format>('3:4');
  const [slides, setSlides] = useState<Slide[]>([defaultSlide(defaultSig)]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pre-fill title from topic param on first load
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

  const updateSlide = useCallback((patch: Partial<Slide>) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], ...patch };
      return updated;
    });
  }, [currentIndex]);

  // ── Slide navigation ──────────────────────────────────────────────────────

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

  // ── Image upload ──────────────────────────────────────────────────────────

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

  // ── Export ────────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-0 flex-1">

      {/* ── LEFT PANEL ── */}
      <div
        className="w-full lg:w-[340px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 130px)' }}
      >
        <div className="p-4 space-y-5">

          {/* §01 FORMAT */}
          <div>
            <SectionTitle>§01 Format</SectionTitle>
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {(['3:4', '4:5', '1:1', '9:16'] as Format[]).map((f) => (
                <SegBtn key={f} active={format === f} onClick={() => setFormat(f)}>
                  {FORMAT_DIMENSIONS[f].label}
                </SegBtn>
              ))}
            </div>
          </div>

          {/* §02 IMAGE */}
          <div>
            <SectionTitle>§02 Image for This Slide</SectionTitle>
            {!slide.img ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('img-upload')?.click()}
                className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <p className="text-sm font-sans text-foreground/60">Drop image here or click to upload</p>
                <p className="text-xs text-foreground/40 mt-1">PNG, JPG, WEBP</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border-2 border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.img} alt="Uploaded slide background" className="w-full h-28 object-cover" />
                <button
                  onClick={() => updateSlide({ img: null })}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/80 transition-all"
                >
                  Remove image
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
            <div className="mt-3 space-y-1">
              <Slider label="Image Scale" value={slide.imgScale} min={100} max={220} step={1} unit="%" onChange={(v) => updateSlide({ imgScale: v })} />
              <Slider label="Horizontal Position" value={slide.imgPosX} min={0} max={100} step={1} unit="%" onChange={(v) => updateSlide({ imgPosX: v })} />
              <Slider label="Vertical Position" value={slide.imgPosY} min={0} max={100} step={1} unit="%" onChange={(v) => updateSlide({ imgPosY: v })} />
            </div>
          </div>

          {/* §03 LAYOUT & TEXT */}
          <div>
            <SectionTitle>§03 Layout &amp; Text</SectionTitle>

            {/* Slide type */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 mb-3">
              {(['cover', 'bignum', 'numbered', 'free', 'outro'] as SlideType[]).map((t) => {
                const labels: Record<SlideType, string> = { cover: 'Cover', bignum: 'Big №', numbered: 'Numbered', free: 'Free', outro: 'Outro' };
                return (
                  <SegBtn key={t} active={slide.type === t} onClick={() => updateSlide({ type: t })}>
                    {labels[t]}
                  </SegBtn>
                );
              })}
            </div>

            {/* Text position */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 mb-4">
              {(['center', 'bottom'] as TextPos[]).map((p) => (
                <SegBtn key={p} active={slide.textPos === p} onClick={() => updateSlide({ textPos: p })}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SegBtn>
              ))}
            </div>

            {/* Conditional fields */}
            <div className="space-y-3">

              {/* Kicker (hidden on bignum) */}
              {slide.type !== 'bignum' && (
                <div>
                  <label className="block text-sm font-bold font-sans text-foreground/70 mb-1">Kicker</label>
                  <input
                    type="text"
                    value={slide.kicker}
                    onChange={(e) => updateSlide({ kicker: e.target.value })}
                    placeholder="SHORT LABEL"
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              )}

              {/* Slide number (numbered only) */}
              {slide.type === 'numbered' && (
                <div>
                  <label className="block text-sm font-bold font-sans text-foreground/70 mb-1">Slide Number</label>
                  <input
                    type="text"
                    value={slide.num}
                    onChange={(e) => updateSlide({ num: e.target.value })}
                    placeholder="01"
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              )}

              {/* Big Number fields */}
              {slide.type === 'bignum' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold font-sans text-foreground/70 mb-1">Number</label>
                    <input
                      type="text"
                      value={slide.bignum}
                      onChange={(e) => updateSlide({ bignum: e.target.value })}
                      placeholder="47"
                      className="w-full px-2 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold font-sans text-foreground/70 mb-1">Suffix</label>
                    <input
                      type="text"
                      value={slide.bigsuffix}
                      onChange={(e) => updateSlide({ bigsuffix: e.target.value })}
                      placeholder="%"
                      className="w-full px-2 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold font-sans text-foreground/70 mb-1">Label</label>
                    <input
                      type="text"
                      value={slide.toplabel}
                      onChange={(e) => updateSlide({ toplabel: e.target.value })}
                      placeholder="label"
                      className="w-full px-2 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-bold font-sans text-foreground/70 mb-1">
                  Title <span className="text-foreground/40 font-normal">(*word* = italic)</span>
                </label>
                <textarea
                  rows={3}
                  value={slide.title}
                  onChange={(e) => updateSlide({ title: e.target.value })}
                  placeholder="Your main headline here..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-bold font-sans text-foreground/70 mb-1">Body (optional)</label>
                <textarea
                  rows={3}
                  value={slide.body}
                  onChange={(e) => updateSlide({ body: e.target.value })}
                  placeholder="Supporting paragraph text..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>

              {/* Signature (outro only) */}
              {slide.type === 'outro' && (
                <div>
                  <label className="block text-sm font-bold font-sans text-foreground/70 mb-1">Signature / Handle</label>
                  <input
                    type="text"
                    value={slide.sig}
                    onChange={(e) => updateSlide({ sig: e.target.value })}
                    placeholder="@nemo"
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-sans text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* §04 STYLE */}
          <div>
            <SectionTitle>§04 Style</SectionTitle>

            <div className="mb-4">
              <p className="text-sm font-bold font-sans text-foreground/70 mb-2">Accent Color</p>
              <div className="flex items-center gap-2">
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
              <p className="text-sm font-bold font-sans text-foreground/70 mb-2">Label Color</p>
              <div className="flex items-center gap-2">
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
              <p className="text-sm font-bold font-sans text-foreground/70 mb-2">Gradient Overlay</p>
              <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                {(['bottom', 'full', 'none'] as Scrim[]).map((s) => (
                  <SegBtn key={s} active={slide.scrim === s} onClick={() => updateSlide({ scrim: s })}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SegBtn>
                ))}
              </div>
            </div>
          </div>

          {/* §05 EXPORT */}
          <div>
            <SectionTitle>§05 Export</SectionTitle>
            <div className="space-y-2">
              <button
                onClick={handleExportCurrent}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-border text-sm font-bold font-sans text-foreground hover:bg-muted transition-all disabled:opacity-50"
              >
                📥 Export This Slide
              </button>
              <button
                onClick={handleExportAll}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold font-sans text-white transition-all disabled:opacity-50"
                style={{ background: '#002FA7' }}
              >
                📦 Export All Slides ({slides.length})
              </button>
            </div>
            <p className="text-xs italic text-foreground/45 mt-2 leading-relaxed">
              Images stay local in your browser. Nothing is uploaded to Nemo servers.
            </p>
          </div>

        </div>
      </div>

      {/* ── RIGHT AREA (Preview) ── */}
      <div className="flex-1 flex flex-col items-center bg-background overflow-y-auto p-4 sm:p-6">

        {/* Slide navigation bar */}
        <div className="flex items-center gap-2 mb-5 bg-card border-2 border-border rounded-2xl px-4 py-2.5 w-full max-w-xl">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-bold font-sans border-2 border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="flex-1 text-center text-sm font-mono-custom font-bold text-foreground">
            Slide {currentIndex + 1} of {slides.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={currentIndex === slides.length - 1}
            className="px-3 py-1.5 rounded-lg text-sm font-bold font-sans border-2 border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
          >
            Next →
          </button>
          <button
            onClick={addSlide}
            className="px-3 py-1.5 rounded-lg text-sm font-bold font-sans border-2 border-border text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
          >
            + Add Slide
          </button>
          <button
            onClick={deleteSlide}
            disabled={slides.length <= 1}
            className="px-3 py-1.5 rounded-lg text-sm font-bold font-sans border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
          >
            🗑
          </button>
        </div>

        {/* Preview shell */}
        <div
          className="rounded-2xl overflow-hidden flex-shrink-0"
          style={{
            width: dims.previewW,
            height: dims.previewH,
            backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%)',
            backgroundSize: '16px 16px',
          }}
        >
          <SlideCanvas
            slide={slide}
            format={format}
            id={`slide-preview-${currentIndex}`}
          />
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
                  background: i === currentIndex ? '#002FA7' : '#d1d5db',
                }}
              />
            ))}
          </div>
        )}

        {/* Format info */}
        <p className="text-xs font-mono-custom text-foreground/40 mt-3">
          {dims.label} · Preview {dims.previewW}×{dims.previewH}px · Export {dims.w}×{dims.h}px
        </p>
      </div>
    </div>
  );
}
