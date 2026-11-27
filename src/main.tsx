import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './styles.css';
import { unlockSpeech } from './i18n/speech';
import { sfx } from './game/world/Audio';

// browsers only allow sound/speech after the first user gesture
const unlock = () => {
  unlockSpeech();
  sfx.ensure();
};
for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(ev, unlock, { capture: true, passive: true });

createRoot(document.getElementById('root')!).render(<App />);

// dev-only hooks for in-browser inspection
if (import.meta.env.DEV) {
  Promise.all([import('three'), import('./game/world/character'), import('./game/world/Vehicles'), import('three/examples/jsm/environments/RoomEnvironment.js')]).then(([three, ch, veh, env]) => {
    Object.assign(window as unknown as Record<string, unknown>, { __THREE: three, __Humanoid: ch.Humanoid, __buildVehicle: veh.buildVehicleMesh, __RoomEnv: env.RoomEnvironment });
  });
}
