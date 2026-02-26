/**
 * Normalizes hostel block strings to standardized display names.
 * Maps variants like "B", "Block B", "B1" to "Hostel B1", etc.
 */
export function normalizeHostelDisplay(raw: string): string {
  if (!raw) return raw;
  const val = raw.trim().toLowerCase().replace(/\s+/g, ' ');

  // Already correct
  if (/^hostel [bg]\d$/i.test(raw.trim())) return raw.trim();

  // "B1", "B2", "G1", "G2"
  const match = val.match(/^([bg])(\d)$/);
  if (match) return `Hostel ${match[1].toUpperCase()}${match[2]}`;

  // "Block B1", "Block G2", etc.
  const blockMatch = val.match(/^block\s+([bg])(\d)$/);
  if (blockMatch) return `Hostel ${blockMatch[1].toUpperCase()}${blockMatch[2]}`;

  // Ambiguous: "B", "Block B" → default to "Hostel B1"
  if (val === 'b' || val === 'block b') return 'Hostel B1';
  if (val === 'g' || val === 'block g') return 'Hostel G1';

  // Return as-is if no match
  return raw.trim();
}
