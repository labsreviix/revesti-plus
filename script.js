const fileInput = document.getElementById('photoInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const intensityEl = document.getElementById('intensity');
const patternButtons = document.querySelectorAll('.patterns button');

let baseImg = new Image();
let patternImg = new Image();
let currentPattern = 'none';
let baseLoaded = false;
let patternLoaded = false;

const patterns = {
  none: null,
  // Padrões SVG data-URI simples
  subway: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'>
      <rect width='40' height='20' fill='white'/>
      <rect x='0' y='0' width='38' height='18' fill='none' stroke='black' stroke-width='2'/>
    </svg>` ,
  hex: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='34' height='30' viewBox='0 0 34 30'>
      <defs>
        <polygon id='h' points='17,0 34,8.5 34,21.5 17,30 0,21.5 0,8.5' fill='white' stroke='black' stroke-width='1'/>
      </defs>
      <use href='#h'/>
    </svg>`
};

function fitCanvasToImage(img) {
  const maxW = 1200;
  const ratio = img.width / img.height;
  const w = Math.min(maxW, img.width);
  const h = Math.round(w / ratio);
  canvas.width = w; canvas.height = h;
}

function draw() {
  if (!baseLoaded) return;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

  if (currentPattern !== 'none' && patternLoaded) {
    const pattern = ctx.createPattern(patternImg, 'repeat');
    if (pattern) {
      ctx.save();
      ctx.globalAlpha = parseInt(intensityEl.value, 10) / 100;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  baseImg = new Image();
  baseImg.onload = () => { baseLoaded = true; fitCanvasToImage(baseImg); draw(); };
  baseImg.src = url;
});

intensityEl.addEventListener('input', draw);

patternButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentPattern = btn.dataset.pattern;
    if (currentPattern === 'none') { draw(); return; }
    patternImg = new Image();
    patternLoaded = false;
    patternImg.onload = () => { patternLoaded = true; draw(); };
    patternImg.src = patterns[currentPattern];
  });
});
