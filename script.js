const fileInput = document.getElementById("photoInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let baseImg = null;
let baseLoaded = false;
let patternImg = null;
let pattern = null;
let intensity = 0.65;

// Seleção de área
let selecting = false;
let editing = false;
let polygonPoints = [];
let draggedPoint = null;

// Carregar foto da galeria/câmera
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    baseImg = new Image();
    baseImg.onload = () => {
      baseLoaded = true;
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      draw();
    };
    baseImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Carregar revestimento
document.querySelectorAll(".pattern").forEach((btn) => {
  btn.addEventListener("click", () => {
    const src = btn.getAttribute("data-src");
    patternImg = new Image();
    patternImg.onload = () => {
      const tempCanvas = document.createElement("canvas");
      const tctx = tempCanvas.getContext("2d");
      tempCanvas.width = patternImg.width;
      tempCanvas.height = patternImg.height;
      tctx.drawImage(patternImg, 0, 0);
      pattern = ctx.createPattern(tempCanvas, "repeat");
      draw();
    };
    patternImg.src = src;
  });
});

// Controle de intensidade
document.getElementById("intensity").addEventListener("input", (e) => {
  intensity = e.target.value / 100;
  draw();
});

// Seleção de área
document.getElementById("selectAreaBtn").addEventListener("click", () => {
  selecting = true;
  editing = false;
  polygonPoints = [];
  document.getElementById("selectionHint").style.display = "block";
  document.getElementById("finishSelectionBtn").style.display = "inline";
  document.getElementById("clearSelectionBtn").style.display = "inline";
});

document.getElementById("finishSelectionBtn").addEventListener("click", () => {
  selecting = false;
  document.getElementById("selectionHint").style.display = "none";
  document.getElementById("finishSelectionBtn").style.display = "none";
  document.getElementById("editModeBtn").style.display = "inline";
  draw();
});

document.getElementById("clearSelectionBtn").addEventListener("click", () => {
  polygonPoints = [];
  selecting = false;
  editing = false;
  document.getElementById("selectionHint").style.display = "none";
  document.getElementById("editHint").style.display = "none";
  document.getElementById("finishSelectionBtn").style.display = "none";
  document.getElementById("clearSelectionBtn").style.display = "none";
  document.getElementById("editModeBtn").style.display = "none";
  draw();
});

// Editar pontos
document.getElementById("editModeBtn").addEventListener("click", () => {
  editing = !editing;
  document.getElementById("editHint").style.display = editing
    ? "block"
    : "none";
});

// Desfazer último ponto
document.getElementById("undoPointBtn").addEventListener("click", () => {
  polygonPoints.pop();
  draw();
});

// Salvar seleção
document.getElementById("saveMaskBtn").addEventListener("click", () => {
  localStorage.setItem("savedMask", JSON.stringify(polygonPoints));
  alert("Seleção salva!");
});

// Carregar seleção
document.getElementById("loadMaskBtn").addEventListener("click", () => {
  const saved = localStorage.getItem("savedMask");
  if (saved) {
    polygonPoints = JSON.parse(saved);
    draw();
    alert("Seleção carregada!");
  } else {
    alert("Nenhuma seleção salva.");
  }
});

// Baixar imagem final
document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "preview.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// Interação no canvas
canvas.addEventListener("click", (e) => {
  if (selecting) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    polygonPoints.push({ x, y });
    draw();
  }
});

canvas.addEventListener("mousedown", (e) => {
  if (editing) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    polygonPoints.forEach((p) => {
      if (Math.hypot(p.x - x, p.y - y) < 10) {
        draggedPoint = p;
      }
    });
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (draggedPoint) {
    const rect = canvas.getBoundingClientRect();
    draggedPoint.x = e.clientX - rect.left;
    draggedPoint.y = e.clientY - rect.top;
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  draggedPoint = null;
});

// Desenhar tudo
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (baseLoaded && baseImg) {
    ctx.drawImage(baseImg, 0, 0);
  }

  if (pattern && polygonPoints.length > 2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
    ctx.clip();

    ctx.globalAlpha = intensity;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  }

  // desenhar polígono
  if (selecting || editing) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (polygonPoints.length > 0) {
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
    }
    ctx.stroke();

    polygonPoints.forEach((p) => {
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
