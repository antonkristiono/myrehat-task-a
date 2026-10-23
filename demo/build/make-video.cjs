/**
 * Assembles the final demo video:
 *   intro card -> screen recording -> outro card, with the Indonesian
 *   voice-over placed at the recorded marks and per-step captions burned in.
 *
 * Inputs : demo/build/marks.json, demo/build/durations.json, demo/build/raw/*.webm
 * Output : demo/video/tropic-hiking-trails-demo.mp4
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BUILD = path.join(ROOT, 'demo/build');
const FONT = '/usr/share/fonts/noto/NotoSans-Bold.ttf';

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const probe = (file, entry) =>
  execFileSync('ffprobe', ['-v', 'error', '-show_entries', entry, '-of', 'csv=p=0', file]).toString().trim();

const { introCard, outroCard, marks } = JSON.parse(fs.readFileSync(path.join(BUILD, 'marks.json'), 'utf8'));
const durations = JSON.parse(fs.readFileSync(path.join(BUILD, 'durations.json'), 'utf8'));
const narration = JSON.parse(fs.readFileSync('demo/narration.json', 'utf8'));

const raw = fs.readdirSync(path.join(BUILD, 'raw')).filter(f => f.endsWith('.webm'));
if (raw.length !== 1) throw new Error('expected exactly one webm, found ' + raw.length);
const recording = path.join(BUILD, 'raw', raw[0]);
const recDur = parseFloat(probe(recording, 'format=duration'));

// The screen recording starts a fraction of a second before the first mark.
const OFFSET = 0.25;
const shift = introCard + OFFSET;
const total = introCard + recDur + outroCard;

console.log(`recording ${recDur.toFixed(2)}s · total ${total.toFixed(2)}s`);

/* ------------------------------------------------------------------ audio */
const audioArgs = ['-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=r=24000:cl=mono'];
const chains = [];
durations.forEach((d, i) => {
  const mark = marks.find(m => m.i === i);
  if (!mark) throw new Error('missing mark for segment ' + i);
  audioArgs.push('-i', path.join(ROOT, d.file));
  const startAt = mark.i === 0 ? introCard + 0.35 : shift + mark.t;
  const at = Math.round(startAt * 1000);
  chains.push(`[${i + 1}:a]adelay=${at}|${at},volume=1.0[a${i}]`);
});
const mixes = ['[0:a]'].concat(durations.map((_, i) => `[a${i}]`)).join('');
const audioFilter = chains.join(';') + ';' + mixes + `amix=inputs=${durations.length + 1}:normalize=0:duration=first[aout]`;

fs.writeFileSync(path.join(BUILD, 'audio.filter'), audioFilter);
run([...audioArgs, '-filter_complex', audioFilter, '-map', '[aout]', '-ar', '44100', path.join(BUILD, 'narration.wav')]);

/* ------------------------------------------------------------------ video */
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/%/g, '\\%');

const captionFilters = marks.map((m, idx) => {
  const start = m.i === 0 ? introCard + 0.35 : shift + m.t;
  const end = idx + 1 < marks.length ? shift + marks[idx + 1].t : shift + recDur;
  return (
    `drawtext=fontfile=${FONT}:text='${esc(narration[idx].caption)}':fontcolor=white:fontsize=26:` +
    `x=(w-text_w)/2:y=h-92:box=1:boxcolor=black@0.55:boxborderw=16:` +
    `enable='between(t,${start.toFixed(2)},${end.toFixed(2)})'`
  );
});

// The recording switches to a 390x844 viewport at mark 7: crop that part and
// pillarbox it, otherwise Chromium leaves a large grey area in the 1280 frame.
const mobileStart = marks.find(m => m.i === 7).t;

const videoFilter = [
  '[0:v]scale=1280:800,setsar=1,fps=25,format=yuv420p[v0]',
  '[1:v]setsar=1,fps=25,format=yuv420p,split=2[recA][recB]',
  `[recA]trim=start=0:end=${mobileStart.toFixed(2)},setpts=PTS-STARTPTS[desk]`,
  `[recB]trim=start=${mobileStart.toFixed(2)},setpts=PTS-STARTPTS,crop=390:800:0:0,scale=-2:800,pad=1280:800:(ow-iw)/2:0:color=0x0d1512[mob]`,
  '[2:v]scale=1280:800,setsar=1,fps=25,format=yuv420p[v2]',
  '[v0][desk][mob][v2]concat=n=4:v=1:a=0[cat]',
  `[cat]${captionFilters.join(',')},fade=t=in:st=0:d=0.6,fade=t=out:st=${(total - 0.7).toFixed(2)}:d=0.7[vout]`,
].join(';');

fs.writeFileSync(path.join(BUILD, 'video.filter'), videoFilter);

run([
  '-loop', '1', '-t', String(introCard), '-i', path.join(BUILD, 'cards/intro.png'),
  '-i', recording,
  '-loop', '1', '-t', String(outroCard), '-i', path.join(BUILD, 'cards/outro.png'),
  '-filter_complex', videoFilter,
  '-map', '[vout]', '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p',
  path.join(BUILD, 'video.mp4'),
]);

/* ------------------------------------------------------------------- mux */
const outDir = path.join(ROOT, 'demo/video');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'tropic-hiking-trails-demo.mp4');

run([
  '-i', path.join(BUILD, 'video.mp4'),
  '-i', path.join(BUILD, 'narration.wav'),
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
  '-movflags', '+faststart', '-shortest',
  out,
]);

console.log('wrote', out, probe(out, 'format=duration') + 's', (fs.statSync(out).size / 1048576).toFixed(1) + ' MB');
