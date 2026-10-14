import { initials } from '@/lib/format';

const TONES = ['#DCE8E5', '#E8DDE2', '#E6E3D3', '#DAE2EC', '#E9DFD6', '#DDE6D8'];
const INKS = ['#1E4D4A', '#7A2E47', '#6B5A1E', '#2D4A70', '#7A4A24', '#3C6A3C'];

/** Initials on a quiet tone. Stable per person, no photos stored in the MVP. */
export function Avatar({ person, size = 40 }: { person: { id: string; firstName: string; lastName: string }; size?: number }) {
  const n = [...person.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TONES.length;
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, background: TONES[n], color: INKS[n], fontSize: size * 0.38 }}
    >
      {initials(person)}
    </span>
  );
}
