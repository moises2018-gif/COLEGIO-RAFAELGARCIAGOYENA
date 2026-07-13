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
        ${isOpen ? `<div class="post-preview"><iframe src="${escapeHtml(post.path)}" title="${escapeHtml(post.name)}"></iframe></div>` : ''}
      </li>
    `;
  }).join('');
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
  renderAll();
});

document.getElementById('materiaList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-materia]');
  if (!btn) return;
  currentMateria = btn.dataset.materia;
  openPreviewId = null;
  renderAll();
});

document.getElementById('postList').addEventListener('click', (e) => {
  const toggleBtn = e.target.closest('[data-toggle-preview]');
  if (!toggleBtn) return;
  const id = toggleBtn.dataset.togglePreview;
  openPreviewId = (openPreviewId === id) ? null : id;
  renderForum();
});

/* ---------- Inicio ---------- */
(async function init() {
  await loadManifest();
  renderAll();
})();
