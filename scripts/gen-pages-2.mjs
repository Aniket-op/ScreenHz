import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pagesDir = join(root, 'src', 'pages');
const guidesDir = join(pagesDir, 'guides');

if (!existsSync(guidesDir)) mkdirSync(guidesDir, { recursive: true });

// ─── Astro page template ────────────────────────────────────────────────────────
function astroPage({ slug, component, title, description, articleH2, articleBody, jsonLdFeatures }) {
  const importLine = component ? `import ${component} from '../components/benchmarks/${component}.tsx';` : '';
  const componentTag = component ? `<${component} client:load />` : '';

  return `---
import Base from '../layouts/Base.astro';
${importLine}

const title = "${title}";
const description = "${description}";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": title,
  "url": "https://screenhz.com/${slug}",
  "description": description,
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web Browser",
  "featureList": [${(jsonLdFeatures || ['Interactive canvas benchmark']).map(f => `"${f}"`).join(', ')}],
  "offers": { "@type": "Offer", "price": "0" }
};
---

<Base title={title} description={description} jsonLd={jsonLd}>
  <div class="bench-page" style="display: flex; flex-direction: column; height: 100vh; background: #0c0c0c; color: #e8e8e8; font-family: 'IBM Plex Mono', monospace;">
    <div class="bench-header" style="height: 48px; border-bottom: 1px solid #222; display: flex; align-items: center; padding: 0 24px; flex-shrink: 0;">
      <a href="/" class="bench-back" style="color: #555; text-decoration: none; margin-right: 16px;">← Back</a>
      <h1 class="bench-title" style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 0;">{title}</h1>
    </div>
    
    <div style="flex-grow: 1; display: flex; flex-direction: column; min-height: 0;">
      ${componentTag}
    </div>

    ${articleH2 ? `<section class="seo-article" style="padding: 32px 24px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #e8e8e8;">
      <h2 style="font-size: 20px; margin-bottom: 16px;">${articleH2}</h2>
      ${articleBody}
    </section>` : ''}
  </div>
</Base>
`;
}

// ─── Generate Astro Pages ─────────────────────────────────────────────────────
const pages = [
  {
    slug: 'black-frame-insertion',
    component: 'BFITest',
    title: 'Black Frame Insertion Test',
    description: "Test display motion clarity with simulated Black Frame Insertion (BFI) and variable duty cycles.",
    articleH2: 'What is Black Frame Insertion?',
    articleBody: `<p style="margin-bottom: 16px;">Black Frame Insertion (BFI) is a technique used by modern displays to reduce motion blur by inserting a black frame between every rendered frame. This forces the screen to behave more like a CRT, reducing sample-and-hold persistence.</p>`
  },
  {
    slug: 'persistence',
    component: 'PersistenceTest',
    title: 'Persistence of Vision Test',
    description: "Visualize display persistence and motion clarity using a high-speed rotating spoke wheel pattern.",
    articleH2: 'Understanding Display Persistence',
    articleBody: `<p style="margin-bottom: 16px;">Persistence refers to how long a pixel remains illuminated after a frame is rendered. High persistence causes moving images to appear smeared across the retina.</p>`
  },
  {
    slug: 'eye-tracking-blur',
    component: 'EyeTrackingBlur',
    title: 'Eye Tracking Motion Blur Test',
    description: "Measure perceived motion blur by tracking a moving object across the screen.",
    articleH2: 'Eye Tracking and Blur',
    articleBody: `<p style="margin-bottom: 16px;">Because your eyes smoothly track moving objects, but the display holds static frames (sample-and-hold), the image gets smeared across your retina during the frame time.</p>`
  },
  {
    slug: 'phantom-array',
    component: 'PhantomArray',
    title: 'Phantom Array Effect Test',
    description: "Test your display for the phantom array effect (stroboscopic stepping) during fast mouse movement.",
    articleH2: 'The Phantom Array Effect',
    articleBody: `<p style="margin-bottom: 16px;">Also known as the stroboscopic effect, this occurs when a high-contrast object moves quickly across the screen, appearing as a series of discrete, repeating steps rather than a smooth blur.</p>`
  },
  {
    slug: 'stutter-tearing',
    component: 'StutterTearing',
    title: 'Stutter & Tearing Test',
    description: "Detect micro-stutters and screen tearing with sub-millisecond precision frame pacing analysis.",
    articleH2: 'Stuttering vs Tearing',
    articleBody: `<p style="margin-bottom: 16px;">Stuttering happens when frames are delayed and displayed for varying amounts of time. Tearing happens when the display reads from the frame buffer while the GPU is still writing a new frame.</p>`
  },
  {
    slug: 'vrr-simulation',
    component: 'VRRSimulation',
    title: 'Variable Refresh Rate Test',
    description: "Simulate Variable Refresh Rate (VRR) to see how dynamic frame times affect motion smoothness.",
    articleH2: 'Variable Refresh Rate (VRR)',
    articleBody: `<p style="margin-bottom: 16px;">VRR technologies like G-Sync and FreeSync synchronize the monitor's refresh rate with the game's fluctuating frame rate, eliminating tearing without adding the input lag of V-Sync.</p>`
  },
  {
    slug: 'resolution-scaling',
    component: 'ResolutionScaling',
    title: 'Screen Resolution & DPI Test',
    description: "Verify display resolution, subpixel rendering, and CSS scaling with 1:1 pixel test patterns.",
    articleH2: 'Resolution and Scaling',
    articleBody: `<p style="margin-bottom: 16px;">Modern operating systems use display scaling (DPI scaling) to make text readable on high-resolution screens. This test verifies if the browser is mapping 1 CSS pixel to 1 physical device pixel.</p>`
  },
  {
    slug: 'chroma-subsampling',
    component: 'ChromaSubsampling',
    title: 'Chroma Subsampling Test',
    description: "Test if your display or HDMI/DisplayPort cable is compressing color data using 4:2:2 or 4:2:0 chroma subsampling.",
    articleH2: 'What is Chroma Subsampling?',
    articleBody: `<p style="margin-bottom: 16px;">To save bandwidth, video signals sometimes send color data at a lower resolution than brightness data. This makes fine colored text look blurry or artifacted on PC monitors.</p>`
  },
  {
    slug: 'hdr',
    component: 'HDRTest',
    title: 'HDR & Wide Color Gamut Test',
    description: "Check if your browser and display correctly render High Dynamic Range (HDR) and Wide Color Gamut.",
    articleH2: 'High Dynamic Range (HDR)',
    articleBody: `<p style="margin-bottom: 16px;">HDR allows displays to output much brighter highlights and deeper blacks, along with a wider range of deeply saturated colors (DCI-P3 or Rec.2020) than standard SDR.</p>`
  },
  {
    slug: 'ghosting',
    component: 'GhostingTest',
    title: 'Monitor Ghosting Test',
    description: "Test your monitor's pixel response time and overdrive settings for trailing ghost artifacts.",
    articleH2: 'Monitor Ghosting',
    articleBody: `<p style="margin-bottom: 16px;">Ghosting is the faint trail left behind moving objects. It happens because liquid crystals (LCDs) take time to physically twist and change color from one frame to the next.</p>`
  },
  {
    slug: 'local-dimming',
    component: 'LocalDimming',
    title: 'Local Dimming & Blooming Test',
    description: "Test Full Array Local Dimming (FALD) and Mini-LED displays for blooming/halo artifacts around bright objects.",
    articleH2: 'Local Dimming and Blooming',
    articleBody: `<p style="margin-bottom: 16px;">To achieve deep blacks, advanced LCDs dim the backlight in dark areas. However, because the dimming zones are larger than individual pixels, bright objects on dark backgrounds can have a glowing "halo" or bloom.</p>`
  },
  {
    slug: 'mprt',
    component: 'MPRTTest',
    title: 'Moving Picture Response Time Test',
    description: "Measure perceived motion blur and calculate the Moving Picture Response Time (MPRT) of your display.",
    articleH2: 'MPRT vs GtG',
    articleBody: `<p style="margin-bottom: 16px;">While GtG (Grey-to-Grey) measures how fast a pixel can change color, MPRT measures how long a pixel is visible to the eye. On a standard 60Hz display, MPRT is always at least 16.67ms, regardless of GtG speed.</p>`
  },
  {
    slug: 'color-ghosting',
    component: 'ColorGhosting',
    title: 'Color Ghosting Test',
    description: "Test different color transitions for uneven pixel response times causing colored trailing (corona artifacts).",
    articleH2: 'Uneven Pixel Transitions',
    articleBody: `<p style="margin-bottom: 16px;">Different colors require different voltage levels to drive the liquid crystals. Sometimes, transitioning to Red takes longer than transitioning to Green, leaving a red-tinted trail behind moving objects.</p>`
  },
  {
    slug: 'black-levels',
    component: 'BlackLevels',
    title: 'Black Level Test (PLUGE)',
    description: "Calibrate your monitor's black levels and contrast using a classic PLUGE pattern.",
    articleH2: 'Calibrating Black Levels',
    articleBody: `<p style="margin-bottom: 16px;">A properly calibrated monitor should be able to distinguish between pure black (RGB 0) and near-black (RGB 1-5). If near-black details are crushed into pure black, your brightness or gamma is set too low.</p>`
  },
  {
    slug: 'white-levels',
    component: 'WhiteLevels',
    title: 'White Level Clipping Test',
    description: "Test if your monitor is clipping high-end white details (crushed highlights) at maximum brightness.",
    articleH2: 'White Clipping',
    articleBody: `<p style="margin-bottom: 16px;">If your monitor's contrast is set too high, it will "clip" bright details, making light grey (RGB 250) look exactly the same as pure white (RGB 255). You lose detail in clouds, snow, and bright skies.</p>`
  },
  {
    slug: 'moving-line',
    component: 'MovingLine',
    title: 'Moving Line & PWM Flicker Test',
    description: "Detect Pulse-Width Modulation (PWM) flicker by observing a fast-moving thin vertical line.",
    articleH2: 'PWM Dimming',
    articleBody: `<p style="margin-bottom: 16px;">Many monitors and phones lower brightness by rapidly turning the backlight on and off (PWM). If the frequency is too low, it causes eye strain and makes moving objects appear to have multiple distinct trailing copies.</p>`
  },
  {
    slug: 'moving-photo',
    component: 'MovingPhoto',
    title: 'Moving Photo Test',
    description: "Test motion clarity using complex, high-contrast, procedurally generated geometric patterns.",
    articleH2: 'Complex Motion Clarity',
    articleBody: `<p style="margin-bottom: 16px;">Simple shapes don't always reveal the full extent of motion blur. Complex, high-frequency details (like text and fine lines) are much more sensitive to blur, simulating the experience of panning a camera in a detailed video game.</p>`
  },
  {
    slug: 'chase-squares',
    component: 'ChaseSquares',
    title: 'Chase Squares Pixel Response Test',
    description: "Identify slow pixel response times and smearing by tracking a rapidly moving lit square through a grid.",
    articleH2: 'Grid Chase Testing',
    articleBody: `<p style="margin-bottom: 16px;">By rapidly cycling a lit square through a grid, slow pixel transitions become immediately obvious as a smeared, comet-like tail following the active square.</p>`
  },
  {
    slug: 'aliasing',
    component: 'AliasingTest',
    title: 'Aliasing & Subpixel Rendering Test',
    description: "Test display subpixel layout and OS-level font smoothing/anti-aliasing algorithms.",
    articleH2: 'Subpixel Rendering',
    articleBody: `<p style="margin-bottom: 16px;">Operating systems use the physical layout of the red, green, and blue subpixels inside your monitor to smooth the edges of text (ClearType / Quartz). If your monitor uses an unusual subpixel layout (like BGR or WRGB), text will look fringed and blurry.</p>`
  },
  {
    slug: 'strobe-crosstalk',
    component: 'StrobeCrosstalk',
    title: 'Strobe Crosstalk Test',
    description: "Measure strobe crosstalk (double images) caused by backlight strobing being out of sync with pixel scan-out.",
    articleH2: 'Strobe Crosstalk',
    articleBody: `<p style="margin-bottom: 16px;">When using blur reduction features (ULMB, DyAc, ELMB), the backlight flashes briefly. If the flash happens while the LCD pixels are still transitioning, you will see a sharp double-image (crosstalk) either above or below the moving object.</p>`
  },
  {
    slug: 'inversion-artifacts',
    component: 'InversionArtifacts',
    title: 'LCD Inversion Artifacts Test',
    description: "Test for voltage inversion artifacts, pixel walk, and checkerboard flicker on LCD panels.",
    articleH2: 'LCD Voltage Inversion',
    articleBody: `<p style="margin-bottom: 16px;">To prevent LCD crystals from burning in, monitors rapidly alternate the polarity of the voltage applied to the pixels. If the positive and negative voltages are slightly imbalanced, specific pixel patterns (like fine checkerboards) will visibly flicker.</p>`
  },
  {
    slug: 'scan-out',
    component: 'ScanOut',
    title: 'Scan-Out Pattern Test',
    description: "Visualize how your monitor draws frames from top to bottom using precise alternating stripes.",
    articleH2: 'Display Scan-Out',
    articleBody: `<p style="margin-bottom: 16px;">Monitors do not update the whole screen instantly. They draw the image line-by-line from top to bottom. Pointing a slow-motion phone camera at this test will clearly reveal the dark scanning band traveling down the screen.</p>`
  },
  {
    slug: 'flicker',
    component: 'FlickerTest',
    title: 'Display Flicker Test',
    description: "Generate high-frequency visual flicker to test camera shutter speeds, PWM, and oscilloscope sensors.",
    articleH2: 'Testing Flicker',
    articleBody: `<p style="margin-bottom: 16px;">This tool alternates the entire screen between two brightness levels at a precise frequency. It is primarily useful for hardware reviewers testing light sensors or camera rolling shutter effects.</p>`
  },
  {
    slug: 'rtings-test',
    component: 'CalibrationPatterns',
    title: 'Display Calibration Test Patterns',
    description: "A suite of full-screen static color fields and calibration patterns to check for dead pixels and uniformity.",
    articleH2: 'Screen Uniformity',
    articleBody: `<p style="margin-bottom: 16px;">Full-screen solid colors are the best way to spot dead pixels, stuck pixels, backlight bleed, dirty screen effect (DSE), and color tinting on the edges of your display.</p>`
  },
  {
    slug: 'crt-simulator',
    component: 'CRTCanvas',
    title: 'CRT Electron Beam Simulator',
    description: "Simulate the scanning electron beam and phosphor decay of a classic CRT television.",
    articleH2: 'Why CRTs had Zero Motion Blur',
    articleBody: `<p style="margin-bottom: 16px;">CRTs fired an electron beam that caused the screen phosphors to glow for just a fraction of a millisecond. Because the screen was completely black for the rest of the frame, the eye did not perceive any sample-and-hold motion blur.</p>`
  },
  {
    slug: 'lcd-pixel-response',
    component: 'LCDPixelResponse',
    title: 'LCD Pixel Response Simulator',
    description: "Visualize the difference between 1ms, 4ms, and 16ms Grey-to-Grey (GtG) pixel transitions and overdrive overshoot.",
    articleH2: 'Pixel Response and Overdrive',
    articleBody: `<p style="margin-bottom: 16px;">To make liquid crystals transition faster, monitors apply a voltage spike called "overdrive." If the voltage is too high, the pixel overshoots its target color, creating a bright inverse ghosting trail (corona artifact).</p>`
  },
  {
    slug: 'color-rainbow',
    component: 'ColorRainbow',
    title: 'Color Sequential Rainbow Effect Test',
    description: "Test for the DLP/OLED rainbow effect and color fringing on high-contrast moving edges.",
    articleH2: 'The Rainbow Effect',
    articleBody: `<p style="margin-bottom: 16px;">Because red, green, and blue subpixels sometimes transition at different speeds, or are drawn sequentially (as in single-chip DLP projectors), fast eye tracking across a high contrast edge will spread the white light into a distinct RGB rainbow.</p>`
  },
  {
    slug: 'video-interlacing',
    component: 'VideoInterlacing',
    title: 'Video Interlacing Test',
    description: "Simulate the combing artifacts of interlaced video (1080i) compared to progressive scan (1080p).",
    articleH2: 'Interlaced vs Progressive',
    articleBody: `<p style="margin-bottom: 16px;">Legacy TV broadcasts send half the picture at a time (alternating odd and even horizontal lines). When motion occurs between the fields, the lines no longer align, causing jagged "combing" artifacts that must be repaired by a deinterlacer.</p>`
  },
  {
    slug: 'gtg-vs-mprt',
    component: 'GtGvsMPRT',
    title: 'GtG vs MPRT Comparison',
    description: "Visualize the difference between pixel transition blur (GtG) and persistence blur (MPRT).",
    articleH2: 'The Two Types of Blur',
    articleBody: `<p style="margin-bottom: 16px;">Motion blur on modern displays comes from two sources: the physical time it takes the pixel to change color (GtG), and the time the frame remains static on the screen while your eye is moving (MPRT).</p>`
  },
  {
    slug: 'blur-busters-law',
    component: 'BlurBustersLaw',
    title: 'Blur Busters Law Calculator',
    description: "Calculate and visualize exact motion blur trailing distances in pixels using the Blur Busters Law formula.",
    articleH2: 'The Blur Busters Law',
    articleBody: `<p style="margin-bottom: 16px;">1ms of persistence equals 1 pixel of motion blur per 1000 pixels/second of motion. To halve the motion blur, you must double the frame rate (and refresh rate), or use a strobe backlight to halve the persistence time.</p>`
  },
  {
    slug: 'scan-out-skew',
    component: 'ScanOutSkew',
    title: 'Scan-Out Skew & Jelly Effect Test',
    description: "Visualize the \"jelly effect\" tilt caused by displays scanning from top to bottom while panning horizontally.",
    articleH2: 'Scan-Out Skew',
    articleBody: `<p style="margin-bottom: 16px;">Because the bottom of the screen is drawn several milliseconds after the top, fast horizontal camera panning causes vertical lines to appear tilted diagonally. This is identical to the "rolling shutter" effect on digital cameras.</p>`
  },
  {
    slug: 'browser-timing',
    component: 'BrowserTimingPlot',
    title: 'Browser Animation Timing Precision',
    description: "Graph the microsecond variance and jank of your browser's requestAnimationFrame loop.",
    articleH2: 'Timer Precision and Jank',
    articleBody: `<p style="margin-bottom: 16px;">Even if your monitor is perfectly smooth, the browser engine might drop frames or suffer from timer jitter due to CPU load, background tabs, or poor OS-level timer resolution. This scatter plot exposes that software-level instability.</p>`
  },
  {
    slug: 'dpi-calculator',
    component: 'DPICalculator',
    title: 'Mouse DPI Calculator',
    description: "Calculate your mouse's true DPI and eDPI by dragging a measured physical distance.",
    articleH2: 'Measuring True DPI',
    articleBody: `<p style="margin-bottom: 16px;">Mice often deviate slightly from their advertised DPI (e.g., an 800 DPI mouse might actually be 815 DPI). By measuring the physical distance moved on your desk and dividing by the pixels moved on screen, you can find the exact value.</p>`
  },
  {
    slug: 'aim-trainer',
    component: 'AimCanvas',
    title: 'Aim Trainer',
    description: "Test your raw mechanical aim, tracking, and reaction time in a 30-second target-clicking scenario.",
    articleH2: 'Hardware and Aim',
    articleBody: `<p style="margin-bottom: 16px;">High refresh rates and low system latency directly improve your ability to acquire targets and react to sudden movements. Measure your baseline score here to see the impact of hardware upgrades.</p>`
  },
  {
    slug: 'setup-score',
    component: 'SetupScore',
    title: 'Setup Score',
    description: "Generate an aggregate score for your gaming setup based on Hz, mouse poll rate, and human reaction time.",
    articleH2: 'The Setup Score',
    articleBody: `<p style="margin-bottom: 16px;">This test combines the three most critical factors for competitive gaming: visual fluidity (Hz), input precision (Poll Rate), and human latency (Reaction Time) into a single benchmark score.</p>`
  },
  {
    slug: 'leaderboard',
    component: 'LeaderboardTable',
    title: 'ScreenHz Leaderboard',
    description: "Compare your display and peripheral performance scores against the global leaderboard.",
    articleH2: 'Global Rankings',
    articleBody: `<p style="margin-bottom: 16px;">See how your setup and reaction time stack up against other users. Remember that while hardware can raise your skill ceiling, practice and consistency matter most.</p>`
  }
];

pages.forEach(p => {
  writeFileSync(join(pagesDir, p.slug + '.astro'), astroPage(p));
  console.log('✓ ' + p.slug + '.astro');
});

// ─── Generate Guide Pages ─────────────────────────────────────────────────────

const guideTemplate = (title, description, body) => `---
import Base from '../../layouts/Base.astro';

const title = "${title}";
const description = "${description}";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": description,
  "author": { "@type": "Organization", "name": "ScreenHz" }
};
---

<Base title={title} description={description} jsonLd={jsonLd}>
  <div class="bench-page" style="display: flex; flex-direction: column; min-height: 100vh; background: #0c0c0c; color: #e8e8e8; font-family: 'IBM Plex Mono', monospace;">
    <div class="bench-header" style="height: 48px; border-bottom: 1px solid #222; display: flex; align-items: center; padding: 0 24px; flex-shrink: 0; position: sticky; top: 0; background: #0c0c0c; z-index: 100;">
      <a href="/" class="bench-back" style="color: #555; text-decoration: none; margin-right: 16px;">← Back</a>
      <span style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; color: #555;">Guide</span>
    </div>
    
    <article style="max-width: 680px; margin: 0 auto; padding: 40px 24px; width: 100%;">
      <h1 style="font-size: 32px; margin-bottom: 8px; color: #e8e8e8;">{title}</h1>
      <div style="font-size: 12px; color: #555; margin-bottom: 40px;">5 min read · Display Benchmarks</div>
      
      <div class="article-content" style="font-size: 14px; line-height: 1.8; color: #e8e8e8;">
        ${body}
      </div>
    </article>
  </div>
</Base>

<style is:global>
  .article-content h2 { font-size: 20px; margin-top: 40px; margin-bottom: 16px; color: #e8e8e8; }
  .article-content p { margin-bottom: 24px; }
  .article-content a { color: #e8e8e8; text-decoration: underline; text-decoration-color: #555; }
  .article-content a:hover { color: #fff; text-decoration-color: #fff; }
  .article-content details { margin-bottom: 16px; border: 1px solid #222; padding: 16px; border-radius: 4px; }
  .article-content summary { cursor: pointer; font-weight: bold; color: #e8e8e8; outline: none; }
</style>
`;

const guides = [
  {
    slug: 'refresh-rate',
    title: 'What is Refresh Rate? Hz vs FPS Explained',
    description: "Learn the difference between monitor refresh rate (Hz) and game frame rate (FPS), and why they matter for motion clarity.",
    body: `<p>Refresh rate is the number of times your monitor updates the image on screen per second, measured in Hertz (Hz). A 60Hz monitor draws 60 images per second, while a 240Hz monitor draws 240.</p>
<h2>Hz vs FPS</h2>
<p>While Hz is determined by your monitor hardware, FPS (Frames Per Second) is determined by your PC's graphics card. If your PC generates 120 FPS but your monitor is only 60Hz, you will only see 60 images per second. The excess frames are either dropped or lead to screen tearing.</p>
<details><summary>Does a higher refresh rate make me a better gamer?</summary><p style="margin-top:8px;color:#555">Yes, up to a point. Upgrading from 60Hz to 144Hz significantly reduces input lag and motion blur, making target tracking much easier.</p></details>`
  },
  {
    slug: 'mouse-dpi',
    title: 'What is Mouse DPI? Sensitivity for Gamers',
    description: "Understand DPI, eDPI, and how to find the perfect mouse sensitivity for competitive gaming.",
    body: `<p>DPI stands for Dots Per Inch. It measures how many pixels your cursor moves on screen for every inch you move your mouse physically on the pad.</p>
<h2>eDPI (Effective DPI)</h2>
<p>eDPI is calculated by multiplying your mouse DPI by your in-game sensitivity. This provides a standardized number that allows players to compare sensitivities across different games and DPI settings.</p>`
  },
  {
    slug: 'improve-fps',
    title: 'How to Improve Gaming FPS — 2025 Guide',
    description: "Actionable steps to increase your frame rate, reduce stuttering, and optimize your PC for gaming.",
    body: `<p>Maximizing FPS is crucial for competitive gaming. Higher FPS means lower input latency and smoother visual feedback.</p>
<h2>Key Optimizations</h2>
<p>Ensure XMP/EXPO is enabled in your BIOS for maximum RAM speed. Disable background apps, and consider using upscaling technologies like DLSS or FSR if your GPU is struggling to maintain your monitor's native refresh rate.</p>`
  },
  {
    slug: 'poll-rate',
    title: 'What is Mouse Poll Rate? 125Hz vs 1000Hz',
    description: "Learn why mouse polling rate matters for input lag and how high refresh rate monitors require higher polling rates.",
    body: `<p>Polling rate determines how often your mouse reports its position to your computer, measured in Hertz (Hz). A 125Hz polling rate reports every 8ms, while 1000Hz reports every 1ms.</p>
<h2>The 4000Hz and 8000Hz Debate</h2>
<p>Modern gaming mice support polling rates up to 8000Hz (0.125ms delay). While the jump from 1000Hz to 8000Hz is mathematically small, it ensures that your mouse inputs perfectly align with the rendering pipeline of extremely high refresh rate (360Hz+) monitors.</p>`
  },
  {
    slug: 'gsync-vs-freesync',
    title: 'G-Sync vs FreeSync — Full Comparison',
    description: "A breakdown of Variable Refresh Rate (VRR) technologies and how they eliminate screen tearing.",
    body: `<p>Variable Refresh Rate (VRR) allows your monitor to dynamically change its refresh rate to match the exact FPS your graphics card is producing.</p>
<h2>Tearing and V-Sync</h2>
<p>Without VRR, if your GPU pushes a frame while the monitor is in the middle of drawing one, the screen "tears" horizontally. V-Sync fixes this but adds significant input lag. G-Sync and FreeSync solve both problems simultaneously.</p>`
  },
  {
    slug: 'motion-blur',
    title: 'Monitor Motion Blur & Ghosting Explained',
    description: "Discover why LCD and OLED screens exhibit motion blur, MPRT vs GtG, and how strobe backlights work.",
    body: `<p>Motion blur on modern displays is primarily caused by "sample-and-hold" technology. The image is drawn and remains static on the screen until the next frame is ready.</p>
<h2>Persistence Blur</h2>
<p>As your eyes smoothly track a moving object across the screen, the static image gets smeared across your retina. The only ways to reduce this persistence blur are to increase the frame rate (and refresh rate) or use a strobing backlight to insert black frames.</p>`
  }
];

guides.forEach(g => {
  writeFileSync(join(guidesDir, g.slug + '.astro'), guideTemplate(g.title, g.description, g.body));
  console.log('✓ /guides/' + g.slug + '.astro');
});

console.log('\n✅ All Astro pages generated!');
