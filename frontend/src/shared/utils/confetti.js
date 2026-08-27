import confetti from 'canvas-confetti';

/**
 * Fires a celebratory burst of confetti in Evently's Deep Teal, Gold, and Emerald palette.
 */
export function fireCelebrationConfetti() {
  // Center burst
  confetti({
    particleCount: 70,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#035352', '#F59E0B', '#10B981', '#FEF08A', '#046C6A'],
    disableForReducedMotion: true,
  });

  // Secondary side cannons for a premium festival feel
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#035352', '#F59E0B', '#10B981'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#035352', '#F59E0B', '#10B981'],
      disableForReducedMotion: true,
    });
  }, 200);
}
