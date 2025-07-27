// Auto-setup script for Lemongrass API key
import { useProjectStore } from '../state/useProjectStore';
import { initializeLemongrass } from './lemongrass';

// Your Lemongrass API key
const LEMONGRASS_API_KEY = 'FIMAaMZUihzi9im1UxSyhnFwLrSJzTnm';

export function setupLemongrass() {
  // Initialize the store with the API key
  const { setLemongrassApiKey } = useProjectStore.getState();
  
  if (LEMONGRASS_API_KEY) {
    setLemongrassApiKey(LEMONGRASS_API_KEY);
    initializeLemongrass(LEMONGRASS_API_KEY);
    console.log('✅ Lemongrass API initialized with provided key');
  }
}

// Auto-setup on import
if (typeof window !== 'undefined') {
  // Run setup after a short delay to ensure store is ready
  setTimeout(setupLemongrass, 100);
}
