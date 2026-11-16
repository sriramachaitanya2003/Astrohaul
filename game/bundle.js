const fs = require('fs');
const path = require('path');

const files = [
  'js/engine/Vector2D.js',
  'js/engine/Camera.js',
  'js/engine/Input.js',
  'js/engine/SpatialHash.js',
  'js/audio/SoundEngine.js',
  'js/vfx/ParticleSystem.js',
  'js/world/Starfield.js',
  'js/economy/Economy.js',
  'js/economy/Missions.js',
  'js/entities/Station.js',
  'js/entities/Mineral.js',
  'js/entities/Asteroid.js',
  'js/entities/Projectile.js',
  'js/entities/Torpedo.js',
  'js/entities/Derelict.js',
  'js/entities/BlackHole.js',
  'js/entities/Enemy.js',
  'js/entities/Ship.js',
  'js/ui/HUD.js',
  'js/ui/StationUI.js',
  'js/main.js'
];

let bundle = '/* Solar Drift: Void Miner - Autonomous Offline Bundle */\n(() => {\n\n';

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Strip imports: import ... from '...';
  content = content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\r?\n/gm, '');

  // Strip exports: export class Foo -> class Foo, export const Foo -> const Foo, export function -> function
  content = content.replace(/^export\s+(class|const|let|var|function|default)\s+/gm, '$1 ');

  // Strip export { ... };
  content = content.replace(/^export\s*\{[\s\S]*?\};?\r?\n/gm, '');

  bundle += `/* --- ${relPath.replace(/\\/g, '/')} --- */\n` + content.trim() + '\n\n';
}

bundle += '})();\n';

fs.writeFileSync(path.join(__dirname, 'game.js'), bundle, 'utf8');
console.log('Successfully bundled game.js! Size:', bundle.length, 'bytes');

