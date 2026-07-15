'use client';

export type SlideType = 'cover' | 'bignum' | 'numbered' | 'free' | 'outro';
export type TextPos = 'center' | 'bottom';
export type Scrim = 'bottom' | 'full' | 'none';
export type Format = '3:4' | '4:5' | '1:1' | '9:16';

export interface Slide {
  id: string;
  img: null | string;
  imgScale: number;
  imgPosX: number;
  imgPosY: number;
  type: SlideType;
  textPos: TextPos;
  kicker: string;
  num: string;
  title: string;
  body: string;
  sig: string;
  bignum: string;
  bigsuffix: string;
  toplabel: string;
  accent: string;
  labelColor: string;
  scrim: Scrim;
}

export interface FormatDimension {
  w: number;
  h: number;
  previewW: number;
  previewH: number;
  label: string;
}

export const FORMAT_DIMENSIONS: Record<Format, FormatDimension> = {
  '3:4':  { w: 2160, h: 2880, previewW: 324, previewH: 432,  label: 'IG 3:4' },
  '4:5':  { w: 2160, h: 2700, previewW: 324, previewH: 405,  label: 'LI 4:5' },
  '1:1':  { w: 2160, h: 2160, previewW: 324, previewH: 324,  label: '1:1' },
  '9:16': { w: 2160, h: 3840, previewW: 182, previewH: 324,  label: '9:16' },
};

export const ACCENT_COLORS = [
  { hex: '#002FA7', label: 'Primary Blue' },
  { hex: '#EA7112', label: 'Orange' },
  { hex: '#0D9488', label: 'Teal' },
  { hex: '#7C3AED', label: 'Purple' },
  { hex: '#FFFFFF', label: 'White' },
];

export function defaultSlide(sig = '@nemo'): Slide {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    img: null,
    imgScale: 100,
    imgPosX: 50,
    imgPosY: 50,
    type: 'cover',
    textPos: 'bottom',
    kicker: '',
    num: '',
    title: '',
    body: '',
    sig,
    bignum: '',
    bigsuffix: '',
    toplabel: '',
    accent: '#002FA7',
    labelColor: '#EA7112',
    scrim: 'full',
  };
}
