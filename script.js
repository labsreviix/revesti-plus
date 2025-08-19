// === Revesti+ MVP — câmera/galeria + padrões + download ===
const fileInput = document.getElementById('photoInput');
const shootBtn = document.getElementById('shootBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const intensityEl = document.getElementById('intensity');
const patternButtons = document.querySelectorAll('.patterns button');
const downloadBtn = document.getElementById('downloadBtn');

let baseImg = new Image();
let patternImg = new Image();
let currentPattern = 'none';
let baseLoaded = false;
let patternLoaded = false;

const patterns = {
  none: null,
  // Subway
  subway: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'>
      <rect width='40' height='20' fill='white'/>
      <rect x='0' y='0' width='38' height='18' fill='none' stroke='black' stroke-width='2'/>
    </svg>`,
  // Hex
  hex: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='34' height='30' viewBox='0 0 34 30'>
      <defs>
        <polygon id='h' points='17,0 34,8.5 34,21.5 17,30 0,21.5 0,8.5'
                 fill='white' stroke='black' stroke-width='1'/>
      </defs>
      <use href='#h'/>
    </svg>`,
  // Madeira
  wood: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='#8b5a2b'/>
          <stop offset='100%' stop-color='#5e3b1c'/>
        </linearGradient>
      </defs>
      <rect width='120' height='60' fill='url(#g)'/>
      <path d='M0 30 H120' stroke='#3e2a16' stroke-width='2' opacity='.25'/>
      <path d='M40 0 V60 M80 0 V60' stroke='#3e2a16' stroke-width='2' opacity='.25'/>
      <path d='M15 20 q10 -6 20 0 M65 10 q15 -8 30 0 M95 40 q10 6 20 0'
            fill='none' stroke='#2b1c0f' stroke-width='1' opacity='.25'/>
    </svg>`,
  // Mármore
  marble: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>
      <rect width='140' height='140' fill='#f5f5f7'/>
      <path d='M-10 60 C30 30, 60 90, 110 50 S160 70, 160 70'
            stroke='#cfcfd6' stroke-width='2' fill='none' opacity='.55'/>
      <path d='M-10 100 C20 80, 80 120, 130 90'
            stroke='#dcdce2' stroke-width='1.5' fill='none' opacity='.5'/>
      <path d='M20 0 C40 30, 60 10, 90 40'
            stroke='#e6e6ed' stroke-width='2' fill='none' opacity='.6'/>
    </svg>`,
  // Cimento
  concrete: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='#d2d2d2'/>
      <g fill='#bdbdbd' opacity='.45'>
        <circle cx='10' cy='15' r='1.5'/><circle cx='30' cy='25' r='1.2'/>
        <circle cx='55' cy='20' r='1.4'/><circle cx='80' cy='35' r='1.6'/>
        <circle cx='100' cy='18' r='1.1'/><circle cx='15' cy='60' r='1.3'/>
        <circle cx='35' cy='75' r='1.7'/><circle cx='65' cy='70' r='1.2'/>
        <circle cx='90' cy='85' r='1.5'/><circle cx='110' cy='65' r='1.3'/>
        <circle cx='25' cy='100' r='1.2'/><circle cx='70' cy='105' r='1.4'/>
      </g>
      <path d='M0 60 H120' stroke='#c7c7c7' stroke-width='1' opacity='.35'/>
      <path d='M60 0 V120' stroke='#c7c7c7' stroke-width='1' opacity='.35'/>
    </svg>`
};

// Ajusta o canvas ao tamanho da foto
function fitCanvasToImage(img) {
  const maxW = 1200;
  const ratio = img.width / img.height;
  const w = Math.min(maxW, img.width);
  const h = Math.round(w / ratio);
  canvas.width = w;
  canvas.height = h;
}

// Desenha foto + padrão escolhido
function draw() {
  if (!baseLoaded) return;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
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

// Abre câmera/galeria e carrega a foto automaticamente
shootBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    baseImg = new Image();
    baseImg.onload = () => { baseLoaded = true; fitCanvasToImage(baseImg); draw(); };
    baseImg.src = ev.target.result; // foto tirada/selecionada
  };
  reader.readAsDataURL(file);
});

// Ajuste de intensidade
intensityEl.addEventListener('input', draw);

// Troca de padrão
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

// Baixar preview (PNG)
downloadBtn.addEventListener('click', () => {
  if (!baseLoaded) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'revesti-preview.png';
  a.click();
});
