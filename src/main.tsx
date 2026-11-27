import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);

// dev-only hooks for in-browser inspection
if (import.meta.env.DEV) {
  Promise.all([import('three'), import('./game/world/character'), import('./game/world/Vehicles'), import('three/examples/jsm/environments/RoomEnvironment.js')]).then(([three, ch, veh, env]) => {
    Object.assign(window as unknown as Record<string, unknown>, { __THREE: three, __Humanoid: ch.Humanoid, __buildVehicle: veh.buildVehicleMesh, __RoomEnv: env.RoomEnvironment });
  });
}
