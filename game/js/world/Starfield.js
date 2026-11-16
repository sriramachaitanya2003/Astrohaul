/**
 * Starfield - JWST Deep-Space Cosmic Nebula & Photorealistic Stellar Field
 * Features Quad-Mirrored Seamless Tiling of User's Nebula Photograph with
 * Moody Deep-Space Atmospheric Darkening and Cinematic Cockpit Vignette.
 * Authored by: agency-technical-artist, agency-visual-storyteller & agency-senior-developer
 */
export class Starfield {
  constructor(sectorSize = 8000) {
    this.sectorSize = sectorSize;
    this.halfSize = sectorSize * 0.5;

    // Generate immediate procedural fallback with matching deep copper/amber/emerald palette
    this.galaxyCanvas = this._generateProceduralNebula();

    // Load user's authentic JWST nebula photograph
    this._initNebulaImage();

    // Subtle foreground parallax star layers (pinpoint crisp stars, not glaring)
    this.foregroundLayers = [
      this._generateLayer(90, 0.08, 1.2, ['#ffffff', '#ffd085', '#70e0ff', '#ffaa66', '#aaffdd'], 0.7), // Midground
      this._generateLayer(40, 0.22, 1.8, ['#ffffff', '#fff0d0', '#90e8ff', '#ffcc88'], 0.85)             // Near field
    ];

    // Floating stellar dust motes drifting across the viewport
    this.dustMotes = [];
    for (let i = 0; i < 60; i++) {
      this.dustMotes.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 1600,
        size: 0.7 + Math.random() * 1.3,
        alpha: 0.12 + Math.random() * 0.35,
        color: Math.random() > 0.4 ? '#ffd499' : '#a8eeff',
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 3
      });
    }
  }

  _initNebulaImage() {
    const imgEl = typeof document !== 'undefined' ? document.getElementById('nebula-bg-asset') : null;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      this._buildFromImage(imgEl);
      return;
    }

    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => this._buildFromImage(img);
      img.src = 'nebula.jpg';

      if (imgEl && !imgEl.complete) {
        imgEl.addEventListener('load', () => this._buildFromImage(imgEl));
      }
    }
  }

  _buildFromImage(img) {
    try {
      const w = img.naturalWidth || 1024;
      const h = img.naturalHeight || 614;

      // Create a 2x2 mirrored quad canvas for 100% mathematically seamless infinite tiling
      const canvas = document.createElement('canvas');
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');

      // 1. Deep space void base
      ctx.fillStyle = '#020104';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw mirrored tiles
      // Tile 1: Top-Left (Original)
      ctx.drawImage(img, 0, 0, w, h);

      // Tile 2: Top-Right (Horizontal Flip)
      ctx.save();
      ctx.translate(w * 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Tile 3: Bottom-Left (Vertical Flip)
      ctx.save();
      ctx.translate(0, h * 2);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // Tile 4: Bottom-Right (Both Flipped)
      ctx.save();
      ctx.translate(w * 2, h * 2);
      ctx.scale(-1, -1);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      // 3. Deep-Space Atmosphere Filter: Tones down the blinding brightness
      // while retaining all the rich copper, amber, and teal cosmic dust filaments
      ctx.fillStyle = 'rgba(2, 3, 6, 0.46)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Overlay subtle JWST 6-point diffraction stars
      this._renderJWSTStars(ctx, canvas.width, canvas.height);

      this.galaxyCanvas = canvas;
    } catch (e) {
      console.warn('Nebula canvas generation deferred to procedural fallback', e);
    }
  }

  _renderJWSTStars(ctx, w, h) {
    ctx.save();

    // Refined subtle hero stars
    const starCount = 32;
    for (let i = 0; i < starCount; i++) {
      const x = 50 + ((i * 137.5 + 43) % (w - 100));
      const y = 40 + ((i * 97.3 + 19) % (h - 80));
      const size = 1.3 + ((i * 3.7) % 2.0);
      const isHeroStar = (i % 6 === 0);
      const spikeLength = isHeroStar ? 38 + (i % 20) : 18 + (i % 14);

      const colorSeed = i % 4;
      const starColor = colorSeed === 0 ? '#ffffff' : (colorSeed === 1 ? '#ffe8b5' : (colorSeed === 2 ? '#b8edff' : '#ffc080'));

      // Soft halo bloom
      const haloGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 4.5);
      haloGrad.addColorStop(0, 'rgba(255, 240, 210, 0.45)');
      haloGrad.addColorStop(0.35, 'rgba(255, 180, 100, 0.16)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(x, y, size * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Diamond stellar core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // JWST Hexagonal 6-Point Spikes
      ctx.strokeStyle = starColor;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = isHeroStar ? 0.55 : 0.32;

      for (let s = 0; s < 3; s++) {
        const rad = (s * Math.PI) / 3;
        const dx = Math.cos(rad) * spikeLength;
        const dy = Math.sin(rad) * spikeLength;
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }

      if (isHeroStar) {
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.25;
        const dx = spikeLength * 0.6;
        ctx.beginPath();
        ctx.moveTo(x - dx, y); ctx.lineTo(x + dx, y);
        ctx.moveTo(x, y - dx); ctx.lineTo(x, y + dx);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _generateProceduralNebula() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1228;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    // Deep cosmic space void matching dark JWST backdrop
    ctx.fillStyle = '#020104';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm copper / burnt orange dust clouds
    const copperPlumes = [
      { x: cx - 250, y: cy - 80, r: 520, c: 'rgba(175, 75, 32, 0.28)' },
      { x: cx + 300, y: cy + 120, r: 600, c: 'rgba(145, 55, 20, 0.24)' },
      { x: cx - 100, y: cy + 240, r: 480, c: 'rgba(195, 95, 38, 0.26)' }
    ];
    for (const p of copperPlumes) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.c);
      g.addColorStop(0.5, 'rgba(110, 35, 14, 0.15)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dusky emerald / teal filaments
    const tealPlumes = [
      { x: cx + 200, y: cy - 220, r: 480, c: 'rgba(28, 65, 52, 0.22)' },
      { x: cx - 350, y: cy - 180, r: 420, c: 'rgba(20, 55, 45, 0.18)' }
    ];
    for (const p of tealPlumes) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, p.c);
      g.addColorStop(0.6, 'rgba(12, 38, 30, 0.10)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    this._renderJWSTStars(ctx, canvas.width, canvas.height);
    return canvas;
  }

  _generateLayer(count, parallax, baseSize, colorPalette, baseAlpha) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      stars.push({
        x: (Math.random() - 0.5) * 3600,
        y: (Math.random() - 0.5) * 2400,
        size: baseSize * (0.65 + Math.random() * 0.75),
        color: color,
        alpha: baseAlpha * (0.5 + Math.random() * 0.5),
        twinkleSpeed: 0.8 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
    return { stars, parallax };
  }

  render(ctx, camera, time = 0) {
    ctx.save();

    // 1. Render Deep Space Cosmic Nebula in Screen Space with Parallax
    if (this.galaxyCanvas) {
      ctx.save();
      // Reset transform to pure screen pixel coordinates
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const sw = ctx.canvas.width;
      const sh = ctx.canvas.height;
      const gw = this.galaxyCanvas.width;
      const gh = this.galaxyCanvas.height;
      const parallax = 0.04; // Smooth cinematic deep-space parallax

      // Deep space background fill
      ctx.fillStyle = '#020204';
      ctx.fillRect(0, 0, sw, sh);

      const scx = sw * 0.5;
      const scy = sh * 0.5;

      const shiftX = (-camera.pos.x * parallax + camera.shakeOffset.x);
      const shiftY = (-camera.pos.y * parallax + camera.shakeOffset.y);

      const startX = ((scx - gw * 0.5 + shiftX) % gw + gw) % gw - gw;
      const startY = ((scy - gh * 0.5 + shiftY) % gh + gh) % gh - gh;

      // Draw seamless nebula with rich atmospheric luminosity
      ctx.globalAlpha = 0.82;
      for (let x = startX; x < sw; x += gw) {
        for (let y = startY; y < sh; y += gh) {
          ctx.drawImage(this.galaxyCanvas, x, y);
        }
      }
      ctx.globalAlpha = 1.0;

      // 2. Cinematic Cockpit Vignette: Darkens screen edges for true deep-space immersion
      const vignette = ctx.createRadialGradient(scx, scy, Math.min(sw, sh) * 0.38, scx, scy, Math.max(sw, sh) * 0.82);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.55, 'rgba(2, 4, 8, 0.40)');
      vignette.addColorStop(1, 'rgba(1, 2, 4, 0.85)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, sw, sh);

      ctx.restore();
    }

    // 3. Render Foreground Parallax Stars
    for (const layer of this.foregroundLayers) {
      for (const s of layer.stars) {
        const px = s.x - camera.pos.x * layer.parallax;
        const py = s.y - camera.pos.y * layer.parallax;

        const range = 2400;
        const halfR = range * 0.5;
        const relX = ((px - camera.pos.x + halfR) % range + range) % range - halfR + camera.pos.x;
        const relY = ((py - camera.pos.y + halfR) % range + range) % range - halfR + camera.pos.y;

        if (!camera.isVisible(relX, relY, 10)) continue;

        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.25;
        ctx.globalAlpha = Math.max(0.15, Math.min(1.0, s.alpha + twinkle));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(relX, relY, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render Drifting Stellar Dust Motes
    for (const mote of this.dustMotes) {
      mote.x += mote.speedX * 0.016;
      mote.y += mote.speedY * 0.016;

      const px = mote.x - camera.pos.x * 0.55;
      const py = mote.y - camera.pos.y * 0.55;

      const rangeX = 2200;
      const rangeY = 1500;
      const relX = ((px - camera.pos.x + rangeX * 0.5) % rangeX + rangeX) % rangeX - rangeX * 0.5 + camera.pos.x;
      const relY = ((py - camera.pos.y + rangeY * 0.5) % rangeY + rangeY) % rangeY - rangeY * 0.5 + camera.pos.y;

      if (camera.isVisible(relX, relY, 5)) {
        ctx.globalAlpha = mote.alpha;
        ctx.fillStyle = mote.color;
        ctx.beginPath();
        ctx.arc(relX, relY, mote.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Render Sector Boundaries
    ctx.globalAlpha = 0.40;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([20, 15]);
    ctx.strokeRect(-this.halfSize, -this.halfSize, this.sectorSize, this.sectorSize);
    ctx.setLineDash([]);

    // Corner beacon warnings
    const corners = [
      { x: -this.halfSize, y: -this.halfSize, label: 'NW BEACON' },
      { x: this.halfSize, y: -this.halfSize, label: 'NE BEACON' },
      { x: this.halfSize, y: this.halfSize, label: 'SE BEACON' },
      { x: -this.halfSize, y: this.halfSize, label: 'SW BEACON' }
    ];

    ctx.fillStyle = '#ffaa44';
    ctx.font = 'bold 11px "Courier New", monospace';
    for (const c of corners) {
      if (camera.isVisible(c.x, c.y, 100)) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(c.label, c.x + 14, c.y + 4);
      }
    }

    ctx.restore();
  }
}
