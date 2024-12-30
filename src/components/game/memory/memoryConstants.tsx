import { MapPin, User, Calendar, Archive, List } from 'lucide-react';
import { MemoryCategory } from './types';

/**
 * Memory categories with their respective icons and labels
 * Used for filtering and displaying memories by type
 */
export const MEMORY_CATEGORIES: MemoryCategory[] = [
  { type: 'location', label: 'Locations', icon: <MapPin className="h-4 w-4" /> },
  { type: 'character', label: 'Characters', icon: <User className="h-4 w-4" /> },
  { type: 'event', label: 'Events', icon: <Calendar className="h-4 w-4" /> },
  { type: 'item', label: 'Items', icon: <Archive className="h-4 w-4" /> },
  { type: 'general', label: 'General', icon: <List className="h-4 w-4" /> },
];