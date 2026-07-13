/* ============================
   BACHILLERATO – MAIN SCRIPT
   ============================ */

// ── Selector de Curso (frames principales) ──────────────────
function showCurso(num) {
  document.querySelectorAll('.curso-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.curso-frame').forEach(f => f.classList.remove('active'));
  document.querySelector(`.curso-tab[data-curso="${num}"]`).classList.add('active');
  document.getElementById(`curso-${num}`).classList.add('active');
  // actualizar label en header
  const labels = { 1: '1° Bachillerato', 2: '2° Bachillerato', 3: '3° Bachillerato' };
  const el = document.getElementById('header-curso');
  if (el) el.textContent = labels[num] || '';
}

// ── Tabs internos (dentro de 2°) ────────────────────────────
function showTab(id, el) {
  document.querySelectorAll('.isection').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.itab').forEach(t => t.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  el.classList.add('on');
}

// ── Accordion de niveles ─────────────────────────────────────
function toggleN(id) {
  const d = document.getElementById(id);
  const isOpen = d.style.display === 'block';
  d.style.display = isOpen ? 'none' : 'block';
}

// ── Stepper 2×2 ─────────────────────────────────────────────
const steps2 = [
  {
    h: 'Paso 1 — Elegir qué despejar',
    body: `
      <p><strong>Regla fija para que no duden:</strong> "Elijan la ecuación que tenga el número más pequeño delante de la letra, mejor si es 1 o −1."</p>
      <code class="eq">① x + 2y = 8<br>② 2x − y = 1</code>
      <p style="margin-top:8px">→ En ① la x tiene coeficiente 1. <span class="pill pg">✓ Ganadora</span></p>
      <div class="card card-warn" style="margin-top:10px">
        <p><span class="pill pw">Ojo</span> Si la x está negativa (−x), multiplica toda la ecuación por −1 antes de despejar.</p>
      </div>
    `
  },
  {
    h: 'Paso 2 — Despejar (dejar sola la letra)',
    body: `
      <p>Aplicamos la regla del semáforo. El +2y está sumando, pasa restando:</p>
      <code class="eq">x + 2y = 8 &nbsp;→&nbsp; <span class="b">x = 8 − 2y</span></code>
      <div class="card card-warn" style="margin-top:10px">
        <p><strong>Diles en voz alta:</strong> "El +2y estaba sumando, ahora pasa restando." Que ellos lo repitan.</p>
      </div>
    `
  },
  {
    h: 'Paso 3 — Sustituir (meter el disfraz)',
    body: `
      <p>Donde ven una x en la ecuación ②, ponen entre <strong>PARÉNTESIS</strong> lo que vale x:</p>
      <code class="eq">2x − y = 1 &nbsp;→&nbsp; 2<span class="b">(8 − 2y)</span> − y = 1</code>
      <div class="card card-red" style="margin-top:10px">
        <p><strong>Oblígales a escribir siempre el paréntesis.</strong> Sin él, cometerán errores de signo. ¡El paréntesis es su mejor amigo!</p>
      </div>
    `
  },
  {
    h: 'Paso 4 — Resolver con una incógnita',
    body: `
      <p>Distribuir el 2 dentro del paréntesis (leerlo en voz alta):</p>
      <code class="eq">"El 2 por +8 es +16"<br>"El 2 por −2y es −4y"<br>"Bajo el −y"</code>
      <code class="eq">16 − 4y − y = 1 &nbsp;→&nbsp; 16 − 5y = 1 &nbsp;→&nbsp; −5y = −15 &nbsp;→&nbsp; <span class="g">y = 3</span></code>
      <p style="margin-top:8px"><span class="pill pw">Si queda −y = −2</span> "multiplica ambos lados por −1 → y = 2"</p>
    `
  },
  {
    h: 'Paso 5 — Calcular la otra variable',
    body: `
      <p>Usamos la expresión despejada del Paso 2. Solo reemplazamos y por su valor:</p>
      <code class="eq">x = 8 − 2<span class="b">(3)</span> = 8 − 6 = <span class="g">2</span></code>
      <div class="card card-ok" style="margin-top:10px">
        <p><strong>Verificar siempre en AMBAS ecuaciones:</strong></p>
        <code class="eq">① 2 + 2(3) = 8 ✓ &nbsp;&nbsp; ② 2(2) − 3 = 1 ✓</code>
        <p style="margin-top:6px">Si falla en una, hay un error en los pasos anteriores. La verificación es el hábito más valioso.</p>
      </div>
    `
  }
];

const steps3 = [
  {
    h: 'Sistema de partida',
    body: `
      <code class="eq">① x + y + z = 6<br>② 2x − y + z = 3<br>③ −x + 2y − z = 0</code>
      <p style="margin-top:10px">La estrategia: despejar x de la ecuación más sencilla (①, coeficiente 1) y sustituir en las otras dos.</p>
    `
  },
  {
    h: 'Paso 1 — Despejar x de ①',
    body: `
      <p>Elegimos ① porque la x tiene coeficiente 1:</p>
      <code class="eq">x + y + z = 6 &nbsp;→&nbsp; <span class="b">x = 6 − y − z</span></code>
      <p style="margin-top:8px">Ahora tenemos el "disfraz" de x. Lo meteremos en ② y en ③.</p>
    `
  },
  {
    h: 'Paso 2 — Sustituir en ② y simplificar',
    body: `
      <code class="eq">2<span class="b">(6−y−z)</span> − y + z = 3</code>
      <code class="eq">12 − 2y − 2z − y + z = 3</code>
      <code class="eq"><span class="o">−3y − z = −9</span> &nbsp;&nbsp; ← Nueva ecuación A</code>
      <div class="card card-warn" style="margin-top:10px">
        <p><span class="pill pw">Insiste:</span> el 2 multiplica TODO el paréntesis, no solo el primer término.</p>
      </div>
    `
  },
  {
    h: 'Paso 3 — Sustituir en ③ y simplificar',
    body: `
      <code class="eq"><span class="b">(6−y−z)</span> · (−1) + 2y − z = 0</code>
      <code class="eq">−6 + y + z + 2y − z = 0</code>
      <code class="eq"><span class="o">3y = 6 → <span class="g">y = 2</span></span> &nbsp;&nbsp; ← ¡Ya tenemos y!</code>
      <p style="margin-top:8px"><span class="pill pg">Punto clave:</span> Ahora tenemos un sistema de 2 incógnitas. ¡Ya saben hacerlo!</p>
    `
  },
  {
    h: 'Paso 4 — Resolver para z',
    body: `
      <p>Sustituimos y = 2 en la ecuación A:</p>
      <code class="eq">−3<span class="b">(2)</span> − z = −9 &nbsp;→&nbsp; −6 − z = −9</code>
      <code class="eq">−z = −3 &nbsp;→&nbsp; <span class="g">z = 3</span></code>
    `
  },
  {
    h: 'Paso 5 — Calcular x y verificar todo',
    body: `
      <p>Sustituimos y = 2 y z = 3 en el despeje original:</p>
      <code class="eq">x = 6 − <span class="b">2</span> − <span class="b">3</span> = <span class="g">1</span></code>
      <p style="margin-top:10px"><strong>Verificar en las 3 ecuaciones:</strong></p>
      <code class="eq">① 1+2+3 = 6 ✓<br>② 2(1)−2+3 = 3 ✓<br>③ −1+2(2)−3 = 0 ✓</code>
      <div class="card card-ok" style="margin-top:10px">
        <p>Para 3 incógnitas la verificación en las 3 ecuaciones es <strong>obligatoria</strong>.</p>
      </div>
    `
  }
];

let i2 = 0, i3 = 0;

function render2() {
  const s = steps2[i2];
  document.getElementById('s2h').textContent = s.h + ' (' + (i2+1) + '/' + steps2.length + ')';
  document.getElementById('s2body').innerHTML = s.body;
  document.getElementById('p2').disabled = i2 === 0;
  const n2 = document.getElementById('n2');
  n2.textContent = i2 === steps2.length - 1 ? '✓ Completado' : 'Siguiente →';
  n2.disabled = i2 === steps2.length - 1;
  document.getElementById('d2').innerHTML = steps2.map((_, j) =>
    `<div class="dot ${j === i2 ? 'on' : ''}"></div>`).join('');
}

function mv2(d) { i2 = Math.max(0, Math.min(steps2.length - 1, i2 + d)); render2(); }

function render3() {
  const s = steps3[i3];
  document.getElementById('s3h').textContent = s.h + ' (' + (i3+1) + '/' + steps3.length + ')';
  document.getElementById('s3body').innerHTML = s.body;
  document.getElementById('p3').disabled = i3 === 0;
  const n3 = document.getElementById('n3');
  n3.textContent = i3 === steps3.length - 1 ? '✓ Completado' : 'Siguiente →';
  n3.disabled = i3 === steps3.length - 1;
  document.getElementById('d3').innerHTML = steps3.map((_, j) =>
    `<div class="dot ${j === i3 ? 'on' : ''}"></div>`).join('');
}

function mv3(d) { i3 = Math.max(0, Math.min(steps3.length - 1, i3 + d)); render3(); }

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  showCurso(2);  // arranca en 2° por defecto
  render2();
  render3();
});
