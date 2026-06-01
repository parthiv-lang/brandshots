import React from 'react';

import GenerationCard from './GenerationCard';
import type { PublicGeneration } from '../services/generations';
import type { ProductPreviewVariant } from './ProductPreviewPlaceholder';

type RecentGenerationCardProps = {
  generation: PublicGeneration;
  previewVariant: ProductPreviewVariant;
  width: number;
  onPress?: () => void;
};

function RecentGenerationCard({
  generation,
  previewVariant,
  width,
  onPress,
}: RecentGenerationCardProps) {
  return (
    <GenerationCard
      generation={generation}
      onPress={onPress}
      previewVariant={previewVariant}
      width={width}
    />
  );
}

export default RecentGenerationCard;
