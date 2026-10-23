export type Run = { x: number; y: number; velocity: number; score: number; crashed: boolean };
export const newRun = (): Run => ({ x: 540, y: 0, velocity: 0, score: 0, crashed: false });
export function jump(run: Run): Run {
  return run.y === 0 && !run.crashed ? { ...run, velocity: 440 } : run;
}
export function advance(run: Run, seconds: number): Run {
  if (run.crashed) return run;
  const dt = Math.min(Math.max(seconds, 0), 0.032);
  const velocity = run.velocity - 1200 * dt;
  const y = Math.max(0, run.y + velocity * dt);
  let x = run.x - (210 + Math.min(run.score * 8, 100)) * dt;
  let score = run.score;
  const crashed = x < 110 && x + 22 > 74 && y < 28;
  if (x < -22) {
    x = 540;
    score += 1;
  }
  return { x, y, velocity: y === 0 ? 0 : velocity, score, crashed };
}
