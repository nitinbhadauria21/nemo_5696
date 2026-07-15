'use client';

import React from 'react';
import { Slide, Format, FORMAT_DIMENSIONS } from './types';

interface SlideCanvasProps {
  slide: Slide;
  format: Format;
  isExport?: boolean;
  id?: string;
}

function parseTitle(title: string): React.ReactNode[] {
  const parts = title.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em
          key={`title-em-${i}`}
          style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: 'inherit' }}
        >
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={`title-span-${i}`}>{part}</span>;
  });
}

export default function SlideCanvas({ slide, format, isExport = false, id }: SlideCanvasProps) {
  const dims = FORMAT_DIMENSIONS[format];
  const w = isExport ? dims.w : dims.previewW;
  const h = isExport ? dims.h : dims.previewH;

  const scrimStyle: React.CSSProperties = (() => {
    if (slide.scrim === 'bottom') {
      return {
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
      };
    }
    if (slide.scrim === 'full') {
      return {
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 100%)',
      };
    }
    return {};
  })();

  const textJustify = slide.textPos === 'center' ? 'center' : 'flex-end';

  return (
    <div
      id={id}
      style={{
        width: w,
        height: h,
        position: 'relative',
        overflow: 'hidden',
        background: '#1A1A2E',
        containerType: 'size',
        flexShrink: 0,
      }}
    >
      {/* Background image layer */}
      {slide.img && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${slide.img})`,
            backgroundSize: 'cover',
            backgroundPosition: `${slide.imgPosX}% ${slide.imgPosY}%`,
            transform: `scale(${slide.imgScale / 100})`,
            transformOrigin: `${slide.imgPosX}% ${slide.imgPosY}%`,
          }}
        />
      )}

      {/* Gradient overlay */}
      {slide.scrim !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            ...scrimStyle,
          }}
        />
      )}

      {/* Big Number type — absolute positioned */}
      {slide.type === 'bignum' && (
        <div
          style={{
            position: 'absolute',
            top: '4cqw',
            left: '4cqw',
            lineHeight: 1,
            color: slide.accent,
            fontSize: '26cqw',
            fontWeight: 900,
          }}
        >
          {slide.bignum}
          {slide.bigsuffix && (
            <sup
              style={{
                fontSize: '8cqw',
                verticalAlign: 'super',
                color: slide.accent,
              }}
            >
              {slide.bigsuffix}
            </sup>
          )}
        </div>
      )}

      {/* Text content layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '5cqw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: textJustify,
        }}
      >
        {/* Big Number label */}
        {slide.type === 'bignum' && slide.toplabel && (
          <p
            style={{
              fontSize: '3cqw',
              color: slide.labelColor,
              marginTop: '1cqw',
              maxWidth: '60%',
              marginBottom: '2cqw',
            }}
          >
            {slide.toplabel}
          </p>
        )}

        {/* Kicker (hidden on bignum) */}
        {slide.type !== 'bignum' && slide.kicker && (
          <p
            style={{
              fontSize: '2cqw',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: slide.accent,
              marginBottom: '2cqw',
            }}
          >
            {slide.kicker}
          </p>
        )}

        {/* Slide number (numbered type) */}
        {slide.type === 'numbered' && slide.num && (
          <p
            style={{
              fontSize: '3.5cqw',
              fontWeight: 700,
              color: slide.accent,
              marginBottom: '1cqw',
            }}
          >
            {slide.num}
          </p>
        )}

        {/* Title */}
        {slide.title && (
          <h2
            style={{
              fontSize: '7cqw',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#FFFFFF',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              margin: 0,
            }}
          >
            {parseTitle(slide.title)}
          </h2>
        )}

        {/* Body */}
        {slide.body && (
          <p
            style={{
              fontSize: '2.8cqw',
              fontWeight: 400,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.85)',
              marginTop: '2cqw',
            }}
          >
            {slide.body}
          </p>
        )}

        {/* Signature (outro type) */}
        {slide.type === 'outro' && slide.sig && (
          <p
            style={{
              fontSize: '3cqw',
              color: slide.accent,
              fontWeight: 600,
              marginTop: '3cqw',
            }}
          >
            {slide.sig}
          </p>
        )}
      </div>
    </div>
  );
}
