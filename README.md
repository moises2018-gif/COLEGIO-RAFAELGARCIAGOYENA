# Aula Virtual — U.E. Dr. Rafael García Goyena

Página web estática que muestra tus documentos PDF organizados por
**grado → materia → documento**, en formato de foro. No necesitas
programar nada para agregar contenido: solo subes PDF a GitHub y la
página los detecta sola.

## 1. Cómo funciona (en resumen)

1. Tú subes un PDF a la carpeta `documentos/{grado}/{materia}/` en GitHub.
2. Un robot (GitHub Action) se activa automáticamente, escanea esa
   carpeta y reescribe `manifest.json` con la lista actualizada.
3. La página web (`index.html`) lee `manifest.json` y muestra el
   documento nuevo en el foro correspondiente — normalmente en menos
   de un minuto, sin que tengas que tocar código.

No hay base de datos ni servidor: todo es HTML/CSS/JS simple servido
por GitHub Pages.

## 2. Estructura de carpetas

```
documentos/
  1ro-bgu/
    matematicas/
      tema-1-sistemas-de-ecuaciones.pdf
      tema-2-funciones.pdf
    etica-legislacion/
      unidad-1.pdf   (aún por subir)
      unidad-2.pdf   (aún por subir)
      ...            hasta unidad-6.pdf
    aplicaciones-de-ofimatica/
      unidad-1.pdf   (aún por subir)
      unidad-2.pdf   (aún por subir)
      ...            hasta unidad-6.pdf
  2do-bgu/
    ...
  3ro-bgu/
    ...
```

Las carpetas `etica-legislacion/` y `aplicaciones-de-ofimatica/` ya
están creadas (con un `.gitkeep` para que no se pierdan en Git) pero
todavía no tienen PDF adentro, así que **no aparecerán en la página
todavía** — el sitio solo lista una materia una vez que tiene al menos
un documento real. Para que cada una muestre sus 6 unidades, sube los
PDF con nombres `unidad-1.pdf`, `unidad-2.pdf`, ... `unidad-6.pdf`
dentro de la carpeta correspondiente (ver sección 3).

- Los tres grados (`1ro-bgu`, `2do-bgu`, `3ro-bgu`) ya existen — no los
  borres, aunque estén vacíos (por eso tienen un archivo `.gitkeep`).
- El nombre de la carpeta de materia (`matematicas`, `ingles`, etc.)
  es lo que define la materia. Usa minúsculas, sin espacios (usa
  guiones `-`), y sin tildes idealmente para evitar problemas de URL.
- **Una materia nueva se crea sola** en cuanto subes el primer PDF
  dentro de una carpeta con ese nombre. No necesitas "registrarla" en
  ningún lado.

## 3. Cómo subir un PDF (sin usar la terminal)

1. Entra a tu repositorio en github.com.
2. Ve a `documentos/1ro-bgu/` (o el grado que corresponda).
3. Si la materia ya existe, entra a esa carpeta. Si es nueva, crea la
   carpeta escribiendo su nombre seguido de `/` al nombrar el archivo
   al subirlo (GitHub la crea automáticamente).
4. Botón **Add file → Upload files**, arrastra tu PDF, y confirma con
   **Commit changes**.
5. Espera unos 30–60 segundos y recarga la página web: el documento
   ya debería aparecer.

## 4. Primer despliegue en GitHub Pages

1. Sube todo este proyecto a un repositorio nuevo en GitHub (puede ser
   público; si es privado, GitHub Pages necesita un plan que lo
   permita).
2. En el repositorio: **Settings → Actions → General → Workflow
   permissions**, selecciona **Read and write permissions** y guarda.
   (Esto permite que el robot pueda actualizar `manifest.json` solo).
3. En **Settings → Pages**: en "Source" elige **Deploy from a branch**,
   rama `main`, carpeta `/(root)`, y guarda.
4. En 1–2 minutos tu sitio estará en
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

## 5. Notas importantes

- **Tamaño de los PDF:** evita archivos escaneados enormes. GitHub
  rechaza archivos de más de 100 MB, y para que la página cargue
  rápido en el celular de los estudiantes, lo ideal es mantener cada
  PDF por debajo de 10–15 MB. Si un documento pesa mucho, comprímelo
  antes de subirlo (hay herramientas gratuitas en línea para
  comprimir PDF).
- **Fecha del documento:** se toma automáticamente de cuándo lo
  subiste a GitHub (no hace falta escribirla a mano).
- **Nombre del archivo = título del foro:** el sistema convierte
  `tema-1-sistemas-de-ecuaciones.pdf` en el título "Tema 1 Sistemas De
  Ecuaciones". Nómbralo pensando en cómo lo verán los estudiantes.
- **Si el manifest no se actualiza:** revisa la pestaña **Actions** del
  repositorio — ahí puedes ver si el robot tuvo algún error (casi
  siempre es el permiso del paso 4.2 que falta activar).
- **Probar localmente antes de subir:** puedes ejecutar
  `node scripts/generate-manifest.js` en tu computadora (con Node.js
  instalado) para regenerar el listado a mano si quieres revisar algo
  sin esperar a GitHub Actions.
