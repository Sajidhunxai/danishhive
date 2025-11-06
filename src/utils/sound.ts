/**
 * Sound notification utility
 * Plays a notification sound when messages are received or sent
 */

let audioInstance: HTMLAudioElement | null = null;

export const playMessageSound = () => {
  try {
    // Create audio instance if it doesn't exist
    if (!audioInstance) {
      audioInstance = new Audio('/notification.mp3');
      audioInstance.volume = 0.5; // Set volume to 50%
      audioInstance.preload = 'auto';
    }

    // Play the sound
    audioInstance.play().catch((error) => {
      console.error('Error playing notification sound:', error);
      // If playing fails, try to reset and play again
      audioInstance?.load();
      audioInstance?.play().catch(() => {
        console.warn('Could not play notification sound - user interaction may be required');
      });
    });
  } catch (error) {
    console.error('Error initializing notification sound:', error);
  }
};

export const preloadSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio('/notification.mp3');
      audioInstance.preload = 'auto';
    }
  } catch (error) {
    console.error('Error preloading sound:', error);
  }
};

