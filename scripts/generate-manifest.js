/**
 * generate-manifest.js
 * ---------------------------------------------------------
 * Escanea la carpeta /documentos y genera manifest.json con
 * la estructura: grado -> materia -> lista de PDFs.
 * Este script lo ejecuta automáticamente la GitHub Action
 * cada vez que se sube un archivo a documentos/. También se
 * puede ejecutar a mano con: node scripts/generate-manifest.js
 * ---------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'documentos');

const GRADOS = [
  { slug: '1ro-bgu', label: '1ro BGU' },
  { slug: '2do-bgu', label: '2do BGU' },
  { slug: '3ro-bgu', label: '3ro BGU' }
];

function humanize(name) {
  const clean = name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
  return clean.replace(/\b\w/g, c => c.toUpperCase());
}

function getGitDate(absPath) {
  try {
    const rel = path.relative(ROOT, absPath);
    const out = execSync(`git log -1 --format=%aI -- "${rel}"`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

function buildManifest() {
  const manifest = { _generatedAt: new Date().toISOString() };

  GRADOS.forEach(({ slug, label }) => {
    const gradoPath = path.join(DOCS_DIR, slug);
    manifest[slug] = { label, materias: {} };
    if (!fs.existsSync(gradoPath)) return;

    const materiaDirs = fs.readdirSync(gradoPath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    materiaDirs.forEach(dirent => {
      const materiaSlug = dirent.name;
      const materiaPath = path.join(gradoPath, materiaSlug);

      const pdfFiles = fs.readdirSync(materiaPath)
        .filter(f => f.toLowerCase().endsWith('.pdf'));

      if (pdfFiles.length === 0) return; // materia sin documentos aún: no se lista

      const posts = pdfFiles.map(f => {
        const filePath = path.join(materiaPath, f);
        const stat = fs.statSync(filePath);
        return {
          name: humanize(f),
          file: f,
          path: `documentos/${slug}/${materiaSlug}/${f}`.split(path.sep).join('/'),
          size: stat.size,
          date: getGitDate(filePath) || stat.mtime.toISOString()
        };
      });

      manifest[slug].materias[materiaSlug] = {
        label: humanize(materiaSlug),
        posts
      };
    });
  });

  return manifest;
}

const manifest = buildManifest();
fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('manifest.json generado correctamente.');
