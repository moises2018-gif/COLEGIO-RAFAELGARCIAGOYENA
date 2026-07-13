/* =========================================================
   Aula Virtual — U.E. Dr. Rafael García Goyena
   Lee manifest.json (generado automáticamente por una
   GitHub Action cada vez que se sube un PDF) y renderiza:
     Grado (fijo: 1ro/2do/3ro BGU)
       └─ Materia (carpeta dinámica)
            └─ Documentos PDF (posts del foro)
   No requiere backend: todo se sirve como archivos estáticos.
   ========================================================= */

const GRADOS = [
  { slug: '1ro-bgu', label: '1ro BGU' },
  { slug: '2do-bgu', label: '2do BGU' },
  { slug: '3ro-bgu', label: '3ro BGU' }
];

let manifest = null;
let currentGrado = GRADOS[0].slug;
let currentMateria = null;
let openPreviewId = null;

/* ---------- Visor PDF (PDF.js) ---------- */
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const PDF_MIN_ZOOM = 0.5;
const PDF_MAX_ZOOM = 3;
const PDF_ZOOM_STEP = 0.15;

let pdfViewer = {
  postId: null,
  pdfDoc: null,
  pageNum: 1,
  baseScale: 1,
  zoomFactor: 1,
  renderTask: null
};
let pdfResizeRaf = null;

/* ---------- Utilidades ---------- */
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fmtDate(iso) {
  if (!iso) return 'fecha desconocida';
  const d = new Date(iso);
  if (isNaN(d)) return 'fecha desconocida';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function resetPdfViewer() {
  if (pdfViewer.renderTask) {
    try { pdfViewer.renderTask.cancel(); } catch (e) { /* ya finalizado */ }
  }
  if (pdfViewer.pdfDoc) {
    try { pdfViewer.pdfDoc.destroy(); } catch (e) { /* ignorar */ }
  }
  pdfViewer = { postId: null, pdfDoc: null, pageNum: 1, baseScale: 1, zoomFactor: 1, renderTask: null };
}

function setPdfStatus(kind, message) {
  const statusEl = document.querySelector('[data-pdf-status]');
  const canvas = document.querySelector('[data-pdf-canvas]');
  const toolbar = document.querySelector('[data-pdf-toolbar]');
  if (!statusEl || !canvas) return;
  if (kind === 'ready') {
    statusEl.classList.add('hidden');
    canvas.classList.remove('hidden');
    if (toolbar) toolbar.classList.remove('pdf-toolbar-disabled');
  } else {
    statusEl.textContent = message || '';
    statusEl.classList.remove('hidden');
    statusEl.classList.toggle('pdf-status-error', kind === 'error');
    canvas.classList.add('hidden');
    if (toolbar) toolbar.classList.add('pdf-toolbar-disabled');
  }
}

function updatePageIndicator() {
  const pageEl = document.querySelector('[data-pdf-page]');
  if (pageEl) pageEl.textContent = pdfViewer.pageNum;
  const prevBtn = document.querySelector('[data-pdf-action="prev"]');
  const nextBtn = document.querySelector('[data-pdf-action="next"]');
  if (prevBtn) prevBtn.disabled = pdfViewer.pageNum <= 1;
  if (nextBtn) nextBtn.disabled = !pdfViewer.pdfDoc || pdfViewer.pageNum >= pdfViewer.pdfDoc.numPages;
}

function updateZoomIndicator() {
  const zoomEl = document.querySelector('[data-pdf-zoom]');
  if (zoomEl) zoomEl.textContent = Math.round(pdfViewer.zoomFactor * 100) + '%';
  const zoomInBtn = document.querySelector('[data-pdf-action="zoom-in"]');
  const zoomOutBtn = document.querySelector('[data-pdf-action="zoom-out"]');
  if (zoomInBtn) zoomInBtn.disabled = pdfViewer.zoomFactor >= PDF_MAX_ZOOM;
  if (zoomOutBtn) zoomOutBtn.disabled = pdfViewer.zoomFactor <= PDF_MIN_ZOOM;
}

async function renderPdfPage() {
  const { pdfDoc, pageNum, postId } = pdfViewer;
  if (!pdfDoc) return;
  const canvas = document.querySelector('[data-pdf-canvas]');
  const wrap = document.querySelector('[data-pdf-canvas-wrap]');
  if (!canvas || !wrap) return;

  try {
    const page = await pdfDoc.getPage(pageNum);
    if (pdfViewer.postId !== postId) return; // el visor cambió mientras cargaba la página

    const unscaledViewport = page.getViewport({ scale: 1 });
    const availableWidth = wrap.clientWidth || 600;
    pdfViewer.baseScale = availableWidth / unscaledViewport.width;
    const scale = pdfViewer.baseScale * pdfViewer.zoomFactor;
    const viewport = page.getViewport({ scale });

    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    const ctx = canvas.getContext('2d');
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    if (pdfViewer.renderTask) {
      try { pdfViewer.renderTask.cancel(); } catch (e) { /* ya finalizado */ }
    }

    const task = page.render({ canvasContext: ctx, viewport, transform });
    pdfViewer.renderTask = task;
    await task.promise;
    if (pdfViewer.postId !== postId) return;
    pdfViewer.renderTask = null;
    setPdfStatus('ready');
    updatePageIndicator();
    updateZoomIndicator();
  } catch (err) {
    if (err && err.name === 'RenderingCancelledException') return;
    console.error('Error al renderizar la página del PDF:', err);
    setPdfStatus('error', 'Ocurrió un error al mostrar esta página del documento.');
  }
}

async function initPdfViewer(post) {
  resetPdfViewer();
  pdfViewer.postId = post.path;

  if (!window.pdfjsLib) {
    setPdfStatus('error', 'No se pudo cargar el visor de documentos (PDF.js no está disponible).');
    return;
  }

  setPdfStatus('loading', 'Cargando documento…');

  try {
    const loadingTask = pdfjsLib.getDocument(post.path);
    const pdfDoc = await loadingTask.promise;
    if (pdfViewer.postId !== post.path) return; // se cerró/cambió mientras cargaba
    pdfViewer.pdfDoc = pdfDoc;
    pdfViewer.pageNum = 1;
    const countEl = document.querySelector('[data-pdf-count]');
    if (countEl) countEl.textContent = pdfDoc.numPages;
    await renderPdfPage();
  } catch (err) {
    console.error('Error al cargar el PDF:', err);
    setPdfStatus('error', 'No se pudo cargar el documento. El archivo podría estar dañado o la ruta ser incorrecta.');
  }
}

function handlePdfAction(action) {
  if (!pdfViewer.pdfDoc) return;
  if (action === 'prev' && pdfViewer.pageNum > 1) {
    pdfViewer.pageNum -= 1;
    renderPdfPage();
  } else if (action === 'next' && pdfViewer.pageNum < pdfViewer.pdfDoc.numPages) {
    pdfViewer.pageNum += 1;
    renderPdfPage();
  } else if (action === 'zoom-in') {
    pdfViewer.zoomFactor = Math.min(PDF_MAX_ZOOM, +(pdfViewer.zoomFactor + PDF_ZOOM_STEP).toFixed(2));
    renderPdfPage();
  } else if (action === 'zoom-out') {
    pdfViewer.zoomFactor = Math.max(PDF_MIN_ZOOM, +(pdfViewer.zoomFactor - PDF_ZOOM_STEP).toFixed(2));
    renderPdfPage();
  }
}

window.addEventListener('resize', () => {
  if (!pdfViewer.pdfDoc) return;
  if (pdfResizeRaf) cancelAnimationFrame(pdfResizeRaf);
  pdfResizeRaf = requestAnimationFrame(() => renderPdfPage());
});

/* ---------- Carga del manifiesto ---------- */
async function loadManifest() {
  try {
    const res = await fetch('manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest.json no encontrado');
    manifest = await res.json();
  } catch (e) {
    console.error('No se pudo cargar manifest.json:', e);
    manifest = {};
  }
  const updatedEl = document.getElementById('manifestUpdated');
  if (manifest && manifest._generatedAt) {
    updatedEl.textContent = fmtDate(manifest._generatedAt);
  } else {
    updatedEl.textContent = 'aún no generado';
  }
}

/* ---------- Render: pestañas de grado ---------- */
function renderGradoTabs() {
  document.querySelectorAll('.grado-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.grado === currentGrado);
  });
  const gradoInfo = GRADOS.find(g => g.slug === currentGrado);
  document.getElementById('gradoLabel').textContent = gradoInfo.label;
}

/* ---------- Render: lista de materias ---------- */
function getMaterias() {
  const gradoData = manifest && manifest[currentGrado];
  if (!gradoData || !gradoData.materias) return [];
  return Object.entries(gradoData.materias).map(([slug, m]) => ({
    slug,
    label: m.label || slug,
    posts: m.posts || []
  }));
}

function renderMateriaList() {
  const materias = getMaterias();
  const list = document.getElementById('materiaList');
  const gradoInfo = GRADOS.find(g => g.slug === currentGrado);

  document.getElementById('materiaCount').textContent =
    materias.length === 1 ? '1 materia' : `${materias.length} materias`;
  document.getElementById('pathExample').textContent =
    `documentos/${currentGrado}/matematicas/tema-1.pdf`;

  if (materias.length === 0) {
    list.innerHTML = `<p class="materia-empty-hint">Aún no hay materias en ${gradoInfo.label}. Sube un PDF a GitHub dentro de <code>documentos/${currentGrado}/nombre-materia/</code> para crear la primera.</p>`;
    return;
  }

  list.innerHTML = materias.map(m => `
    <button class="materia-item ${m.slug === currentMateria ? 'active' : ''}" data-materia="${escapeHtml(m.slug)}">
      <span>${escapeHtml(m.label)}</span>
      <span class="count">${m.posts.length}</span>
    </button>
  `).join('');
}

/* ---------- Render: foro de una materia ---------- */
function renderForum() {
  const materias = getMaterias();
  const materia = materias.find(m => m.slug === currentMateria);

  const empty = document.getElementById('emptyState');
  const noMaterias = document.getElementById('noMaterias');
  const forum = document.getElementById('forumView');

  if (materias.length === 0) {
    empty.classList.add('hidden');
    noMaterias.classList.remove('hidden');
    forum.classList.add('hidden');
    return;
  }
  noMaterias.classList.add('hidden');

  if (!materia) {
    empty.classList.remove('hidden');
    forum.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  forum.classList.remove('hidden');

  const gradoInfo = GRADOS.find(g => g.slug === currentGrado);
  document.getElementById('crumb').textContent = `${gradoInfo.label} / Materia`;
  document.getElementById('materiaTitle').textContent = materia.label;
  document.getElementById('forumPostCount').textContent =
    materia.posts.length === 1 ? '1 documento' : `${materia.posts.length} documentos`;

  const list = document.getElementById('postList');
  if (materia.posts.length === 0) {
    list.innerHTML = '<p class="materia-empty-hint">Esta materia todavía no tiene documentos.</p>';
    return;
  }

  const sorted = [...materia.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = sorted.map(post => {
    const id = post.path;
    const isOpen = id === openPreviewId;
    return `
      <li class="post" data-post-id="${escapeHtml(id)}">
        <div class="post-head">
          <div class="post-title-row">
            <span class="post-icon">📄</span>
            <div>
              <p class="post-title">${escapeHtml(post.name)}</p>
              <p class="post-meta">${fmtSize(post.size)} · subido el ${fmtDate(post.date)}</p>
            </div>
          </div>
          <div class="post-actions">
            <button class="btn-view ${isOpen ? 'active' : ''}" data-toggle-preview="${escapeHtml(id)}">
              ${isOpen ? 'Ocultar' : 'Ver documento'}
            </button>
            <a class="btn-download" href="${escapeHtml(post.path)}" download>Descargar</a>
          </div>
        </div>
        ${isOpen ? `
        <div class="post-preview">
          <div class="pdf-toolbar" data-pdf-toolbar>
            <div class="pdf-toolbar-group">
              <button type="button" class="pdf-btn" data-pdf-action="prev" title="Página anterior" aria-label="Página anterior">‹</button>
              <span class="pdf-page-indicator">Página <span data-pdf-page>1</span> de <span data-pdf-count>—</span></span>
              <button type="button" class="pdf-btn" data-pdf-action="next" title="Página siguiente" aria-label="Página siguiente">›</button>
            </div>
            <div class="pdf-toolbar-group">
              <button type="button" class="pdf-btn" data-pdf-action="zoom-out" title="Alejar" aria-label="Alejar">−</button>
              <span class="pdf-zoom-indicator" data-pdf-zoom>100%</span>
              <button type="button" class="pdf-btn" data-pdf-action="zoom-in" title="Acercar" aria-label="Acercar">+</button>
            </div>
          </div>
          <div class="pdf-canvas-wrap" data-pdf-canvas-wrap>
            <p class="pdf-status" data-pdf-status>Cargando documento…</p>
            <canvas class="pdf-canvas hidden" data-pdf-canvas></canvas>
          </div>
        </div>` : ''}
      </li>
    `;
  }).join('');

  const openPost = sorted.find(p => p.path === openPreviewId);
  if (openPost) {
    initPdfViewer(openPost);
  }
}

function renderAll() {
  renderGradoTabs();
  renderMateriaList();
  renderForum();
}

/* ---------- Eventos ---------- */
document.getElementById('gradoTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.grado-tab');
  if (!btn) return;
  currentGrado = btn.dataset.grado;
  currentMateria = null;
  openPreviewId = null;
  resetPdfViewer();
  renderAll();
});

document.getElementById('materiaList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-materia]');
  if (!btn) return;
  currentMateria = btn.dataset.materia;
  openPreviewId = null;
  resetPdfViewer();
  renderAll();
});

document.getElementById('postList').addEventListener('click', (e) => {
  const toggleBtn = e.target.closest('[data-toggle-preview]');
  if (toggleBtn) {
    const id = toggleBtn.dataset.togglePreview;
    if (openPreviewId === id) {
      openPreviewId = null;
      resetPdfViewer();
    } else {
      openPreviewId = id;
    }
    renderForum();
    return;
  }

  const actionBtn = e.target.closest('[data-pdf-action]');
  if (actionBtn && !actionBtn.disabled) {
    handlePdfAction(actionBtn.dataset.pdfAction);
  }
});

/* ---------- Inicio ---------- */
(async function init() {
  await loadManifest();
  renderAll();
})();
