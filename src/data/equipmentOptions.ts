/**
 * Interface for equipment option sets
 */
interface EquipmentOption {
  items: string[];
}

/**
 * Type for mapping character classes to their equipment options
 */
type ClassEquipmentMap = {
  [key: string]: EquipmentOption[];
};

/**
 * Starting equipment options for each character class
 */
const classStartingEquipment: ClassEquipmentMap = {
  Fighter: [
    {
      items: [
        'Chain mail',
        'Longsword',
        'Shield',
        'Light crossbow and 20 bolts',
        'Dungeoneer\'s pack',
      ]
    },
    {
      items: [
        'Leather armor',
        'Two handaxes',
        'Longbow and 20 arrows',
        'Explorer\'s pack',
      ]
    }
  ],
  Wizard: [
    {
      items: [
        'Spellbook',
        'Quarterstaff',
        'Component pouch',
        'Scholar\'s pack',
      ]
    },
    {
      items: [
        'Spellbook',
        'Dagger',
        'Arcane focus',
        'Explorer\'s pack',
      ]
    }
  ],
  // Add more classes and their equipment options here
};

/**
 * Gets the starting equipment options for a given character class
 * @param className The name of the character class
 * @returns Array of equipment options for the class
 */
export const getStartingEquipment = (className: string): EquipmentOption[] => {
  return classStartingEquipment[className] || [];
};