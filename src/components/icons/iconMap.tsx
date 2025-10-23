import React from 'react';
import RefillIcon from './RefillIcon';
import GallonIcon from './GallonIcon';
import PickupIcon from './PickupIcon';
import WaterDropIcon from './WaterDropIcon';

export const iconMap: { [key: string]: React.FC<any> } = {
  RefillIcon,
  GallonIcon,
  PickupIcon,
  DefaultIcon: WaterDropIcon, // Fallback icon
};
