import type { ProductAnalysis } from '../services/products/types';

const JEWELRY_TERMS = [
  'jewel',
  'jewellery',
  'jewelry',
  'ring',
  'earring',
  'necklace',
  'pendant',
  'bracelet',
  'bangle',
  'brooch',
  'anklet',
  'gemstone',
  'diamond',
];

export type JewelrySubtype =
  | 'ring'
  | 'earrings'
  | 'necklace'
  | 'pendant'
  | 'bracelet'
  | 'bangle'
  | 'brooch'
  | 'anklet'
  | 'other';

export function isJewelryProduct(
  analysis: ProductAnalysis | null | undefined,
): boolean {
  if (!analysis) {
    return false;
  }

  const category = analysis.category?.trim().toLowerCase();
  if (category === 'jewelry' || category === 'jewellery') {
    return true;
  }

  const productType = analysis.productType?.trim().toLowerCase() ?? '';
  return JEWELRY_TERMS.some(term => productType.includes(term));
}

export function inferJewelrySubtype(
  productType: string | null | undefined,
): JewelrySubtype {
  const value = productType?.toLowerCase() ?? '';
  if (value.includes('earring')) return 'earrings';
  if (value.includes('necklace')) return 'necklace';
  if (value.includes('pendant')) return 'pendant';
  if (value.includes('bracelet')) return 'bracelet';
  if (value.includes('bangle')) return 'bangle';
  if (value.includes('brooch')) return 'brooch';
  if (value.includes('anklet')) return 'anklet';
  if (value.includes('ring')) return 'ring';
  return 'other';
}

export function isJewelleryGeneration(generation: {
  jewelryFidelity?: unknown;
} | null | undefined): boolean {
  return Boolean(generation?.jewelryFidelity);
}
