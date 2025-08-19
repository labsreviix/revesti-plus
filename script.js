// === Revesti+ MVP — câmera + galeria + padrões + seleção de área (polígono) + download ===
const fileInput = document.getElementById('photoInput');
const shootBtn = document.getElementById('shootBtn');
const openCameraBtn = document.getElementById('openCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const video = document.getElementById('video');
const cameraWrap = document.querySelector('.camera-wrap');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const intensityEl = document.getElementById('intensity');
const patternButtons = document.querySelectorAll('.patterns button');
const downloadBtn = document.getElementById('downloadBtn');

const selectAreaBtn = document.getElementById('selectAreaBtn');
const finishSelectionBtn = document.getElementById('finishSelectionBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const selectionHint = document.getElementById('selectionHint');

let baseImg = new Image();
let patternImg = new Image();
let currentPattern = 'none';
let baseLoaded = false;
let patternLoaded = false;
let stream = null;

// Estado de seleção da área (polígono)
let isSelecting = false;
let selectionPoints = []; // [{x,y}, ...]

// --------- Padrões ----------
const patterns = {
  none: null,
  subway: `data:image/svg+xml;utf8,
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'>
      <rect width='40' height='20' fill='white'/>
      <rect x='0' y='0' width='38' height='18' fill='none' stroke='black' stroke-width='2'/>
    </svg>`,
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
        <linearGradient id='g' x1='0' y='0' x2='0' y2='1'>
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
  // Cimento queimado
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

// --------- Utilitários ----------
function fitCanvasToImage(img) {
  const maxW = 1200;
  const ratio = img.width / img.height;
  const w = Math.min(maxW, img.width);
  const h = Math.round(w / ratio);
  canvas.width = w; canvas.height = h;
}

function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  // Suporta toque e mouse
  const e = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
  return {
    x: Math.round((e.clientX - rect.left) * (canvas.width / rect.width)),
    y: Math.round((e.clientY - rect.top) * (canvas.height / rect.height))
  };
}

function buildSelectionPath() {
  if (selectionPoints.length < 2) return null;
  const p = new Path2D();
  p.moveTo(selectionPoints[0].x, selectionPoints[0].y);
  for (let i = 1; i < selectionPoints.length; i++) {
    p.lineTo(selectionPoints[i].x, selectionPoints[i].y);
  }
  // não fecha aqui; só ao concluir
  return p;
}

function drawSelectionOverlay() {
  if (!selectionPoints.length) return;
  // linhas/ pontos de seleção em cima da imagem
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(96,165,250,0.9)'; // azul
  ctx.fillStyle = 'rgba(96,165,250,0.25)';

  // linhas entre os pontos
  const path = buildSelectionPath();
  if (path) ctx.stroke(path);

  // pontos
  for (const pt of selectionPoints) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --------- Desenho principal ----------
function draw() {
  if (!baseLoaded) return;

  // foto base
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

  // pattern (com ou sem recorte)
  if (currentPattern !== 'none' && patternLoaded) {
    ctx.save();

    // se já houver polígono fechado, use clip
    if (selectionPoints.length >= 3 && !isSelecting) {
      ctx.beginPath();
      ctx.moveTo(selectionPoints[0].x, selectionPoints[0].y);
      for (let i = 1; i < selectionPoints.length; i++) {
        ctx.lineTo(selectionPoints[i].x, selectionPoints[i].y);
      }
      ctx.closePath();
      ctx.clip(); // aplica o corte
    }

    // desenha o pattern
    const pat = ctx.createPattern(patternImg, 'repeat');
    if (pat) {
      ctx.globalAlpha = parseInt(intensityEl.value, 10) / 100;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  }

  // se estiver selecionando (marcando pontos), mostra a sobreposição
  if (isSelecting || selectionPoints.length) {
    drawSelectionOverlay();
  }
}

// --------- Uploads ---------
shootBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    baseImg = new Image();
    baseImg.onload = () => { 
      baseLoaded = true; 
      fitCanvasToImage(baseImg); 
      // limpamos seleção ao trocar a imagem
      selectionPoints = [];
      isSelecting = false;
      updateSelectionUI();
      draw(); 
    };
    baseImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// --------- Câmera ---------
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    cameraWrap.style.display = '';
    captureBtn.style.display = '';
    openCameraBtn.style.display = 'none';
  } catch (err) {
    alert('Não foi possível acessar a câmera. Use a galeria ou dê permissão ao navegador.');
    console.error(err);
  }
}
function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  cameraWrap.style.display = 'none';
  captureBtn.style.display = 'none';
  openCameraBtn.style.display = '';
}
function capturePhoto() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  const maxW = 1200, ratio = vw / vh, w = Math.min(maxW, vw), h = Math.round(w / ratio);
  canvas.width = w; canvas.height = h;
  ctx.drawImage(video, 0, 0, w, h);
  baseImg = new Image();
  baseImg.onload = () => { 
    baseLoaded = true; 
    // limpamos seleção ao trocar a imagem
    selectionPoints = [];
    isSelecting = false;
    updateSelectionUI();
    draw(); 
  };
  baseImg.src = canvas.toDataURL('image/png');
  stopCamera();
}
openCameraBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', capturePhoto);

// --------- Intensidade / Padrão ---------
intensityEl.addEventListener('input', draw);

patternButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentPattern = btn.dataset.pattern;
    if (currentPattern === 'none') { draw(); return; }
    patternImg =

