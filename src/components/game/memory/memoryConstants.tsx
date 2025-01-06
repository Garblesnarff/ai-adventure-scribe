import React from 'react';
import { MapPin, User, Calendar, Package, FileText } from 'lucide-react';
import { MemoryCategory, MemoryType } from './types';

/**
 * Memory categories with their associated icons and labels
 */
export const MEMORY_CATEGORIES: MemoryCategory[] = [
  {
    type: 'location',
    label: 'Location',
    icon: <MapPin className="h-4 w-4" />
  },
  {
    type: 'character',
    label: 'Character',
    icon: <User className="h-4 w-4" />
  },
  {
    type: 'event',
    label: 'Event',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    type: 'item',
    label: 'Item',
    icon: <Package className="h-4 w-4" />
  },
  {
    type: 'general',
    label: 'General',
    icon: <FileText className="h-4 w-4" />
  }
];