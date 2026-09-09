/**
 * Holographic & Geometric HUD Visualizer for AI BAS Assistant
 * Renders 3D wireframe geometries, animated guidance paths, holographic rings,
 * spatial grids, and coordinate telemetry onto the webcam overlay.
 */

export interface HologramRenderOptions {
  width: number;
  height: number;
  stepNumber: number | null; // 1 to 5
  timeSec: number;
  motionScore: number;
  activeDetectionLabel?: string | null;
  showHologramStructure?: boolean;
}

// 3D Point projection helper
interface Point3D {
  x: number;
  y: number;
  z: number;
}

function project3D(
  p: Point3D,
  center: { x: number; y: number },
  fov: number = 280
): { x: number; y: number; scale: number } {
  const distance = fov / (fov + p.z);
  return {
    x: center.x + p.x * distance,
    y: center.y + p.y * distance,
    scale: distance,
  };
}

export function drawHolographicOverlay(
  ctx: CanvasRenderingContext2D,
  options: HologramRenderOptions
) {
  const { width, height, stepNumber, timeSec, motionScore } = options;

  ctx.save();

  // 1. Holographic Laser Scanning Line
  const scanY = ((timeSec * 70) % height);
  const scanGrad = ctx.createLinearGradient(0, scanY - 25, 0, scanY + 25);
  scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  scanGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
  scanGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 25, width, 50);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, scanY);
  ctx.lineTo(width, scanY);
  ctx.stroke();

  // 2. Holographic Ground Depth Grid (Perspective wireframe at bottom of chamber)
  const gridBottomY = height * 0.88;
  const gridTopY = height * 0.62;
  const gridCenterX = width * 0.5;

  ctx.strokeStyle = 'rgba(14, 165, 233, 0.18)';
  ctx.lineWidth = 1;
  // Longitudinal perspective rays
  for (let angle = -0.5; angle <= 0.5; angle += 0.125) {
    ctx.beginPath();
    ctx.moveTo(gridCenterX + angle * (width * 0.35), gridTopY);
    ctx.lineTo(gridCenterX + angle * (width * 0.95), gridBottomY);
    ctx.stroke();
  }
  // Transverse depth rungs
  for (let d = 0; d <= 5; d++) {
    const t = d / 5;
    const y = gridTopY + (gridBottomY - gridTopY) * Math.pow(t, 1.4);
    const span = (width * 0.35) + (width * 0.6) * Math.pow(t, 1.4);
    ctx.beginPath();
    ctx.moveTo(gridCenterX - span / 2, y);
    ctx.lineTo(gridCenterX + span / 2, y);
    ctx.stroke();
  }

  // 3. 3D Rotating Holographic Containment Cube / Hex-Lattice
  // Represents the 3D containment matrix inside the BAS chamber
  const cubeCenter = { x: width * 0.78, y: height * 0.34 };
  const cubeSize = 34;
  const rotY = timeSec * 0.8;
  const rotX = Math.sin(timeSec * 0.5) * 0.3 + 0.2;

  // 8 vertices of a 3D unit cube
  const rawVertices: Point3D[] = [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: 1, z: 1 },
  ];

  // Rotate and project vertices
  const projected = rawVertices.map((v) => {
    const x1 = v.x * Math.cos(rotY) - v.z * Math.sin(rotY);
    const z1 = v.x * Math.sin(rotY) + v.z * Math.cos(rotY);
    const y2 = v.y * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = v.y * Math.sin(rotX) + z1 * Math.cos(rotX);

    return project3D(
      { x: x1 * cubeSize, y: y2 * cubeSize, z: z2 * cubeSize },
      cubeCenter,
      240
    );
  });

  // Cube wireframe edges
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // front
    [4, 5], [5, 6], [6, 7], [7, 4], // back
    [0, 4], [1, 5], [2, 6], [3, 7], // connectors
  ];

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.lineWidth = 1.4;
  edges.forEach(([i, j]) => {
    ctx.beginPath();
    ctx.moveTo(projected[i].x, projected[i].y);
    ctx.lineTo(projected[j].x, projected[j].y);
    ctx.stroke();
  });

  // Nodes on vertices
  projected.forEach((p) => {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Label above holographic cube
  ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('3D BIO-MATRIX HAR', cubeCenter.x, cubeCenter.y - cubeSize - 10);

  // 4. Rotating Holographic Target Ring (Gimbal / Gyroscope rings on Tray Slot)
  const trayTargetX = width * 0.48;
  const trayTargetY = height * 0.52;

  // Outer segmented ring
  ctx.save();
  ctx.translate(trayTargetX, trayTargetY);
  ctx.rotate(timeSec * 0.4);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.65)'; // emerald holographic
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();

  // Inner counter-rotating ring
  ctx.rotate(-timeSec * 0.9);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.setLineDash([14, 8, 4, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. GEOMETRIC GUIDED TRAJECTORY PATH (Specific to current SOP Step)
  drawSOPGuidancePath(ctx, width, height, stepNumber || 1, timeSec);

  // 6. Geometric Corner HUD Brackets & Spatial Telemetry Coordinates
  const rx = width * 0.16;
  const ry = height * 0.18;
  const rw = width * 0.68;
  const rh = height * 0.68;

  // Outer glowing frame
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(rx, ry, rw, rh);

  // High-precision geometric reticles at 4 corners
  const cornerSize = 22;
  ctx.strokeStyle = '#22C55E';
  ctx.lineWidth = 2.5;

  // TL
  ctx.beginPath();
  ctx.moveTo(rx, ry + cornerSize);
  ctx.lineTo(rx, ry);
  ctx.lineTo(rx + cornerSize, ry);
  ctx.stroke();
  // TR
  ctx.beginPath();
  ctx.moveTo(rx + rw - cornerSize, ry);
  ctx.lineTo(rx + rw, ry);
  ctx.lineTo(rx + rw, ry + cornerSize);
  ctx.stroke();
  // BL
  ctx.beginPath();
  ctx.moveTo(rx, ry + rh - cornerSize);
  ctx.lineTo(rx, ry + rh);
  ctx.lineTo(rx + cornerSize, ry + rh);
  ctx.stroke();
  // BR
  ctx.beginPath();
  ctx.moveTo(rx + rw - cornerSize, ry + rh);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(rx + rw, ry + rh - cornerSize);
  ctx.stroke();

  // Telemetry HUD Metadata Strings
  ctx.fillStyle = '#22C55E';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ISRO GAGANYAAN // HAR SPATIAL TRACKER', rx + 6, ry - 8);

  ctx.fillStyle = '#38BDF8';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`VECTOR: [${(Math.sin(timeSec)*1.2).toFixed(2)}, ${(Math.cos(timeSec)*0.8).toFixed(2)}, 0.00]G`, rx + rw - 6, ry - 8);

  ctx.textAlign = 'left';
  ctx.fillText(`ROT-Z: ${(rotY * 57.3 % 360).toFixed(1)}°`, rx + 6, ry + rh + 14);
  ctx.textAlign = 'right';
  ctx.fillText(`OPTICAL INTENSITY: ${motionScore.toFixed(1)}%`, rx + rw - 6, ry + rh + 14);

  ctx.restore();
}

/**
 * Draws animated geometric vector paths customized for each of the 5 SOP steps:
 * - Step 1: Horizontal slide-out vector for sample tray latch
 * - Step 2: Vertical arc trajectory into Slot A-1
 * - Step 3: 90-degree micro-pipette vertical alignment vector
 * - Step 4: Inverse slide lock vector for vacuum chamber
 * - Step 5: Circular thermal resonance ring with radial wave vectors
 */
function drawSOPGuidancePath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stepNumber: number,
  timeSec: number
) {
  ctx.save();

  // Animate a pulsing holographic pulse bead along the spline
  const pulseT = (timeSec * 0.7) % 1;

  if (stepNumber === 1) {
    // Step 1: Open Tray -> Horizontal slide trajectory (Left to Center-Right)
    const p0 = { x: width * 0.26, y: height * 0.54 };
    const p1 = { x: width * 0.42, y: height * 0.51 };
    const p2 = { x: width * 0.62, y: height * 0.54 };

    drawCurvedTrajectory(ctx, [p0, p1, p2], pulseT, 'VECTOR 1: SLIDE TRAY OUTWARD', '#38BDF8');
  } else if (stepNumber === 2) {
    // Step 2: Insert Sample -> Arc path from glove staging area downward into ampoule slot
    const p0 = { x: width * 0.32, y: height * 0.32 };
    const p1 = { x: width * 0.42, y: height * 0.38 };
    const p2 = { x: width * 0.48, y: height * 0.58 };

    drawCurvedTrajectory(ctx, [p0, p1, p2], pulseT, 'VECTOR 2: AMPOULE INSERTION ARCH (SLOT A-1)', '#F59E0B');
  } else if (stepNumber === 3) {
    // Step 3: Add Reagent -> Strict 90 degree vertical pipette vector
    const p0 = { x: width * 0.48, y: height * 0.28 };
    const p1 = { x: width * 0.48, y: height * 0.44 };
    const p2 = { x: width * 0.48, y: height * 0.60 };

    drawCurvedTrajectory(ctx, [p0, p1, p2], pulseT, 'VECTOR 3: 90° VERTICAL PIPETTE ALIGNMENT', '#10B981');

    // Horizontal perpendicular indicator at pipette tip
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(width * 0.42, height * 0.44);
    ctx.lineTo(width * 0.54, height * 0.44);
    ctx.stroke();
  } else if (stepNumber === 4) {
    // Step 4: Close Container -> Slide in and engage dual vacuum lock
    const p0 = { x: width * 0.68, y: height * 0.54 };
    const p1 = { x: width * 0.48, y: height * 0.52 };
    const p2 = { x: width * 0.32, y: height * 0.54 };

    drawCurvedTrajectory(ctx, [p0, p1, p2], pulseT, 'VECTOR 4: VACUUM CHAMBER SEAL ENGAGEMENT', '#EC4899');
  } else {
    // Step 5: Start Incubator -> Thermal wave resonance vectors
    const centerX = width * 0.48;
    const centerY = height * 0.52;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ringRadius = 24 + i * 22 + ((timeSec * 30) % 22);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VECTOR 5: THERMAL CYCLE 37.0°C RADIATIVE VECTORS', centerX, centerY + 80);
  }

  ctx.restore();
}

/**
 * Helper to render a smooth spline path with arrow heads, waypoints, and a traveling pulse bead
 */
function drawCurvedTrajectory(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  pulseT: number,
  label: string,
  color: string
) {
  if (points.length < 3) return;

  const [start, control, end] = points;

  // 1. Draw glowing dashed guide line
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  ctx.stroke();

  // 2. Draw Start Point
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // 3. Draw Target End Point Reticle
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(end.x - 12, end.y);
  ctx.lineTo(end.x + 12, end.y);
  ctx.moveTo(end.x, end.y - 12);
  ctx.lineTo(end.x + 12, end.y);
  ctx.stroke();

  // 4. Moving holographic pulse particle along the quadratic bezier curve
  const t = pulseT;
  const beadX = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * control.x + Math.pow(t, 2) * end.x;
  const beadY = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * control.y + Math.pow(t, 2) * end.y;

  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(beadX, beadY, 5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Label along the trajectory
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, control.x, control.y - 10);

  ctx.restore();
}
