"use strict";

const $ = (s, r = document) => r.querySelector(s);
const esc = escaparTexto;
const pantalla = $("#pantalla");
const tabbar = $("#tabbar");
const capa = $("#capa");
const toastEl = $("#toast");

const memoria = {};
let hayLocal = false;
try { localStorage.setItem("lb_prueba", "1"); localStorage.removeItem("lb_prueba"); hayLocal = true; } catch (e) {}
const datos = {
  get(k, def) {
    if (hayLocal) {
      try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) {}
    }
    return k in memoria ? memoria[k] : def;
  },
  set(k, v) { memoria[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  quitar(k) { delete memoria[k]; try { localStorage.removeItem(k); } catch (e) {} },
};

const DEMO = { email: "cliente@labendicion.cr", clave: "bendicion123", nombre: "Ana Rodríguez" };
const COLORES_AVATAR = ["#2F6B4C", "#B5651D", "#7B4A8C", "#2E6A6E", "#8C6B3E", "#A23B2C"];

async function huella(clave) {
  const texto = "la-bendicion:" + clave;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381;
  for (const ch of texto) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return "h" + (h >>> 0).toString(16);
}
const usuarios = () => datos.get("lb_usuarios", {});
const guardarUsuarios = (u) => datos.set("lb_usuarios", u);
const sesion = () => { const e = datos.get("lb_sesion", null); return e ? usuarios()[e] || null : null; };
function actualizarUsuario(cambio) {
  const u = usuarios(), s = sesion();
  if (!s) return;
  cambio(u[s.email]);
  guardarUsuarios(u);
}
async function sembrarDemo() {
  const u = usuarios();
  if (u[DEMO.email]) return;
  const ahora = Date.now(), hora = 3600e3, dia = 86400e3;
  u[DEMO.email] = {
    nombre: DEMO.nombre, email: DEMO.email, hash: await huella(DEMO.clave),
    avatar: { tipo: "color", valor: "#2F6B4C" }, desde: "2026-03-14",
    favoritos: ["arnica", "manzanilla", "te-verde"],
    historial: [
      { id: "valeriana", t: ahora - 2 * hora }, { id: "arnica", t: ahora - 5 * hora },
      { id: "te-verde", t: ahora - 1.2 * dia }, { id: "champu-romero", t: ahora - 3 * dia },
      { id: "propoleo", t: ahora - 6 * dia },
    ],
  };
  guardarUsuarios(u);
}

const producto = (id) => PRODUCTOS.find((p) => p.id === id);
const categoria = (id) => CATEGORIAS.find((c) => c.id === id);
const normal = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const primerNombre = (n) => n.trim().split(/\s+/)[0];
const iniciales = (n) => n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
let sinRedDemo = false;
const sinRed = () => sinRedDemo || navigator.onLine === false;

function enlaceWhatsApp(mensaje) {
  const n = (CONTACTO.whatsapp || "").replace(/\D/g, "");
  return (n ? `https://wa.me/${n}` : "https://wa.me/") + "?text=" + encodeURIComponent(mensaje);
}
const enlaceFacebook = () => CONTACTO.facebook || CONTACTO.facebookBusqueda;
const enlaceMapa = () => `https://www.google.com/maps/search/?api=1&query=${CONTACTO.lat},${CONTACTO.lng}`;

function hora12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${sufijo}`;
}
function ahoraCR() {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Costa_Rica", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dias = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return { dia: dias[p.weekday], min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
}
const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
function estadoLocal() {
  const { dia, min } = ahoraCR();
  const hoy = CONTACTO.horario[dia];
  if (hoy.abre && min >= aMin(hoy.abre) && min < aMin(hoy.cierra)) {
    return { abierto: true, texto: `Abierto ahora, cierra a las ${hora12(hoy.cierra)}` };
  }
  if (hoy.abre && min < aMin(hoy.abre)) return { abierto: false, texto: `Cerrado, abre hoy a las ${hora12(hoy.abre)}` };
  for (let i = 1; i <= 7; i++) {
    const d = CONTACTO.horario[(dia + i) % 7];
    if (d.abre) {
      const cuando = i === 1 ? "mañana" : `el ${d.dia.toLowerCase()}`;
      return { abierto: false, texto: `Cerrado, abre ${cuando} a las ${hora12(d.abre)}` };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}
function fechaRelativa(t) {
  const d = new Date(t), hoy = new Date();
  const mismoDia = (a, b) => a.toDateString() === b.toDateString();
  const hora = d.toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" });
  if (mismoDia(d, hoy)) return `Hoy, ${hora}`;
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  if (mismoDia(d, ayer)) return `Ayer, ${hora}`;
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "long" });
}

const botonAtras = () => `<button class="boton-icono" data-accion="atras" aria-label="Volver">${icono("atras")}</button>`;
function barra(titulo, { atras = true, acciones = "" } = {}) {
  return `<header class="barra">${atras ? botonAtras() : ""}<h1>${titulo}</h1><div class="acciones">${acciones}</div></header>`;
}
function nicho(p, clase = "") {
  return `<div class="nicho ${clase}" style="background:${claro(p.tinte, 0.8)}">${envaseProducto(p)}</div>`;
}
function tarjetaProducto(p) {
  return `<a class="tarjeta-producto" href="#/producto/${p.id}">
    ${nicho(p)}
    <span class="nombre">${esc(p.nombre)}</span>
    <span class="estado ${p.disponible ? "" : "agotado"}">${p.disponible ? "Disponible" : "Agotado"}</span>
  </a>`;
}
function filaProducto(p, { detalle, boton = "" } = {}) {
  const contenido = `<div class="miniatura">${nicho(p)}</div>
    <div class="texto"><strong>${esc(p.nombre)}</strong><small>${detalle || esc(categoria(p.cat).nombre)}</small></div>`;
  return boton
    ? `<div class="fila"><a class="fila-enlace" href="#/producto/${p.id}">${contenido}</a>${boton}</div>`
    : `<a class="fila" href="#/producto/${p.id}">${contenido}${icono("siguiente", 20)}</a>`;
}
function avatarHtml(u, clase) {
  if (!u) return `<span class="${clase}" style="background:var(--hoja-2)">${icono("perfil", clase === "avatar-mini" ? 22 : 48)}</span>`;
  if (u.avatar && u.avatar.tipo === "foto") return `<span class="${clase}"><img src="${u.avatar.valor}" alt=""></span>`;
  const color = (u.avatar && u.avatar.valor) || COLORES_AVATAR[0];
  return `<span class="${clase}" style="background:${color}">${esc(iniciales(u.nombre))}</span>`;
}
function vacio({ simbolo, titulo, texto, botones = "" }) {
  return `<div class="vacio"><div class="simbolo">${icono(simbolo, 36)}</div><h2>${titulo}</h2><p>${texto}</p><div class="botones">${botones}</div></div>`;
}
function esqueletoCuadricula(texto) {
  const tarjeta = `<div><div class="esqueleto nicho"></div><div class="esqueleto linea"></div><div class="esqueleto linea corta"></div></div>`;
  return `<div class="cargando-texto" role="status"><span class="girador"></span>${texto}</div><div class="cuadricula">${tarjeta.repeat(4)}</div>`;
}
function esqueletoLista(texto, n = 4) {
  const fila = `<div class="fila"><div class="miniatura"><div class="esqueleto nicho"></div></div><div class="texto"><div class="esqueleto linea"></div><div class="esqueleto linea corta"></div></div></div>`;
  return `<div class="cargando-texto" role="status"><span class="girador"></span>${texto}</div><div class="lista">${fila.repeat(n)}</div>`;
}
const htmlSinConexion = () => vacio({
  simbolo: "sinred",
  titulo: "Sin conexión a internet",
  texto: "No pudimos cargar el contenido. Revise sus datos móviles o el wifi y vuelva a intentarlo.",
  botones: `<button class="boton primario" data-accion="reintentar">Reintentar</button>`,
});

const arcosBanner = `<svg class="arcos" viewBox="0 0 168 180" aria-hidden="true">
  <g fill="none" stroke-width="2">
    <path d="M10 180V84a74 74 0 0 1 148 0v96" stroke="#2F6B4C"/>
    <path d="M30 180V88a54 54 0 0 1 108 0v92" stroke="#3B7A58"/>
    <path d="M50 180V92a34 34 0 0 1 68 0v88" stroke="#4A8A66"/>
  </g>
  <g transform="translate(52 64) scale(1.05)">
    <path d="M32 112C32 84 34 58 42 34" stroke="#F2C77A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g fill="#F2C77A">
      <path d="M33 90c-16 2-26-7-28-18 15-2 24 6 28 18z"/><path d="M36 70c15-2 23-11 23-23-13 0-21 9-23 23z"/>
      <path d="M38 50c-14-3-19-13-18-22 13 3 18 12 18 22z"/><path d="M41 36c9-5 11-14 9-21-8 4-10 12-9 21z"/>
    </g>
  </g>
</svg>`;

const V = {};

V.apertura = {
  sinTab: true, estado: "verde",
  render(_, q) {
    return {
      html: `<section class="apertura" aria-label="Pantalla de apertura">
        <div class="marca-grande">${logo(120, "#FBF8EE", "#C9862A", "hoja-crece")}</div>
        <div class="entra">
          <h1>La Bendición</h1>
          <p class="lema">Tu salud está a un click de distancia</p>
        </div>
        <div class="pie"><div class="carga" aria-label="Cargando categorías"><i></i><i></i><i></i></div>Macrobiótica en el Mercado Central de San José</div>
      </section>`,
      montar() {
        CATEGORIAS.forEach((c) => (c._ilustracion = envaseCategoria(c)));
        if (!("pausa" in q)) setTimeout(() => { if (rutaActual === "apertura") navegar("/inicio", true); }, 2300);
      },
    };
  },
};

V.inicio = {
  tab: "inicio", datos: true,
  render() {
    const u = sesion();
    const local = estadoLocal();
    const t = TESTIMONIOS[0];
    return {
      html: `<header class="cabecera-inicio">
          ${logo(34)}<span class="nombre">La Bendición</span>
          <a href="#/perfil" aria-label="Mi perfil">${avatarHtml(u, "avatar-mini")}</a>
        </header>
        <div class="pagina">
          <h1 class="saludo">${u ? `Buenas, ${esc(primerNombre(u.nombre))}` : "Buenas, ¿qué busca hoy?"}</h1>
          <a class="buscador-falso" href="#/buscar">${icono("buscar", 22)}Buscar un producto</a>

          <section class="banner" aria-label="Bienvenida">
            ${arcosBanner}
            <h2>Lo natural, como siempre</h2>
            <p>Más de 35 años en el Mercado Central, ahora en su celular.</p>
            <a class="boton" href="#/catalogo">Ver catálogo</a>
          </section>

          <section class="panel-sintomas" aria-label="Recomendaciones por síntoma">
            <h2>¿Qué está sintiendo?</h2>
            <p>Elija una molestia y vea los productos que suelen recomendarse.</p>
            <div class="mosaico-sintomas">
              ${SINTOMAS.slice(0, 4).map((s) => `<a href="#/sintoma/${s.id}"><span class="circulo-icono">${icono(s.icono, 22)}</span>${s.nombre}</a>`).join("")}
            </div>
            <a class="enlace ambar" href="#/sintomas">Ver los ${SINTOMAS.length} síntomas</a>
          </section>

          <div class="seccion-titulo"><h2>Categorías</h2><a class="enlace" href="#/catalogo">Ver todas</a></div>
          <div class="carrusel">
            ${CATEGORIAS.map((c) => `<a class="acceso-cat" href="#/categoria/${c.id}">
              <div class="nicho" style="background:${claro(c.tinte, 0.8)}">${c._ilustracion || envaseCategoria(c)}</div><span>${c.nombre}</span></a>`).join("")}
          </div>

          <div class="seccion-titulo"><h2>Lo que dicen los clientes</h2><a class="enlace" href="#/testimonios">Ver todos</a></div>
          <figure class="cita" style="margin:0">${icono("comillas", 26)}<p>${esc(t.texto)}</p><figcaption class="autor">${esc(t.nombre)}</figcaption></figure>

          <a class="horario-tira" href="#/contacto">${icono("reloj", 26)}<div><strong>${local.texto}</strong>Mercado Central de San José</div>${icono("siguiente", 20)}</a>
        </div>`,
    };
  },
};

V.catalogo = {
  tab: "catalogo", datos: true,
  render() {
    return {
      html: `${barra("Catálogo", { atras: false })}
        <div class="pagina">
          <a class="buscador-falso" href="#/buscar" style="margin-bottom:18px">${icono("buscar", 22)}Buscar un producto</a>
          <div class="lista">
            ${CATEGORIAS.map((c) => {
              const n = PRODUCTOS.filter((p) => p.cat === c.id).length;
              return `<a class="fila" href="#/categoria/${c.id}">
                <div class="miniatura"><div class="nicho" style="background:${claro(c.tinte, 0.8)}">${envaseCategoria(c)}</div></div>
                <div class="texto"><strong>${c.nombre}</strong><small>${c.nota}, ${n} productos</small></div>${icono("siguiente", 20)}</a>`;
            }).join("")}
          </div>
        </div>`,
    };
  },
};

V.categoria = {
  tab: "catalogo", datos: true, carga: true,
  render({ id }) {
    const c = categoria(id);
    if (!c) return V.noEncontrado.render();
    const lista = PRODUCTOS.filter((p) => p.cat === c.id);
    const cabeza = `${barra(c.nombre)}<div class="pagina"><p class="intro" style="margin-bottom:18px">${c.nota}</p>`;
    return {
      esqueleto: `${cabeza}${esqueletoCuadricula("Cargando productos")}</div>`,
      html: `${cabeza}<p class="conteo">${lista.length} productos</p><div class="cuadricula">${lista.map(tarjetaProducto).join("")}</div></div>`,
    };
  },
};

V.producto = {
  sinTab: true, datos: true,
  render({ id }) {
    const p = producto(id);
    if (!p) return V.noEncontrado.render();
    const c = categoria(p.cat);
    const u = sesion();
    if (u) actualizarUsuario((x) => { x.historial = [{ id: p.id, t: Date.now() }, ...x.historial.filter((h) => h.id !== p.id)].slice(0, 30); });
    const fav = !!(u && u.favoritos.includes(p.id));
    const relacionados = PRODUCTOS.filter((x) => x.cat === p.cat && x.id !== p.id);
    const fondo = claro(p.tinte, 0.88);
    const mensaje = p.disponible
      ? `Hola, La Bendición. Me interesa el producto "${p.nombre}". ¿Me pueden dar más información?`
      : `Hola, La Bendición. ¿Cuándo vuelve a estar disponible el producto "${p.nombre}"?`;
    return {
      fondoEstado: fondo,
      html: `<section class="ficha-hero" style="background:${fondo}">
          <header class="barra">${botonAtras()}<h1 class="oculto">${esc(p.nombre)}</h1>
            <div class="acciones">
              <button class="boton-icono flotante" data-accion="compartir" data-id="${p.id}" aria-label="Compartir producto">${icono("compartir", 22)}</button>
              <button class="boton-icono flotante ${fav ? "activo" : ""}" data-accion="favorito" data-id="${p.id}" aria-pressed="${fav}" aria-label="${fav ? "Quitar de favoritos" : "Guardar en favoritos"}">${icono("corazon", 22)}</button>
            </div>
          </header>
          <div class="nicho" style="background:${claro(p.tinte, 0.7)}">${envaseProducto(p)}</div>
        </section>
        <div class="ficha-cuerpo">
          <div class="etiquetas">
            <a class="insignia cat" href="#/categoria/${c.id}">${c.nombre}</a>
            <span class="insignia ${p.disponible ? "ok" : "no"}">${p.disponible ? "Disponible" : "Agotado"}</span>
          </div>
          <h1>${esc(p.nombre)}</h1>
          ${p.disponible ? "" : `<div class="aviso">${icono("alerta", 22)}<div>Este producto está agotado por ahora. Puede preguntar por WhatsApp cuándo vuelve.</div></div>`}
          <div class="bloque-info"><h2>Descripción</h2><p>${esc(p.descripcion)}</p></div>
          <div class="bloque-info"><h2>Para qué sirve</h2><p>${esc(p.uso)}</p></div>
          <div class="bloque-info"><h2>Modo de uso</h2><p>${esc(p.modo)}</p></div>
          ${relacionados.length ? `<div class="seccion-titulo"><h2>También en ${c.nombre.toLowerCase()}</h2></div>
            <div class="carrusel relacionados">${relacionados.map(tarjetaProducto).join("")}</div>` : ""}
        </div>`,
      accion: `<a class="boton ${p.disponible ? "primario" : "ambar"} bloque" href="${enlaceWhatsApp(mensaje)}" target="_blank" rel="noopener">${icono("chat", 22)}${p.disponible ? "Pedir por WhatsApp" : "Preguntar cuándo vuelve"}</a>`,
    };
  },
};

V.sintomas = {
  tab: "sintomas", datos: true,
  render() {
    return {
      html: `${barra("Recomendaciones", { atras: false })}
        <div class="pagina">
          <h1 class="titulo-pagina">¿Qué está sintiendo?</h1>
          <p class="intro">Elija una molestia y le mostramos productos naturales que suelen recomendarse.</p>
          <div class="lista">
            ${SINTOMAS.map((s) => `<a class="fila" href="#/sintoma/${s.id}"><span class="circulo-icono">${icono(s.icono, 24)}</span>
              <div class="texto"><strong>${s.nombre}</strong><small>${s.productos.length} productos sugeridos</small></div>${icono("siguiente", 20)}</a>`).join("")}
          </div>
          <p class="nota-medica">${icono("alerta", 20)}<span>Estas sugerencias no sustituyen la consulta médica.</span></p>
        </div>`,
    };
  },
};

V.sintoma = {
  tab: "sintomas", datos: true, carga: true,
  render({ id }) {
    const s = SINTOMAS.find((x) => x.id === id);
    if (!s) return V.noEncontrado.render();
    const lista = s.productos.map(producto).filter(Boolean);
    const cabeza = `${barra(s.nombre)}<div class="pagina"><p class="intro">${s.texto}</p>`;
    return {
      esqueleto: `${cabeza}${esqueletoLista("Buscando productos sugeridos", lista.length)}</div>`,
      html: `${cabeza}<div class="lista">
          ${lista.map((p) => filaProducto(p, { detalle: `${esc(p.uso.split(".")[0])}.${p.disponible ? "" : " <b style='color:var(--rojo)'>Agotado</b>"}` })).join("")}
        </div>
        <p class="nota-medica">${icono("alerta", 20)}<span>Estas sugerencias no sustituyen la consulta médica. Si la molestia continúa, consulte a su médico.</span></p>
        <a class="boton secundario bloque" style="margin-top:16px" target="_blank" rel="noopener" href="${enlaceWhatsApp(`Hola, La Bendición. Quisiera una recomendación para: ${s.nombre.toLowerCase()}.`)}">${icono("chat", 22)}Consultar por WhatsApp</a>
      </div>`,
    };
  },
};

V.buscar = {
  tab: "catalogo", datos: true,
  render(_, q) {
    const inicial = q.q || "";
    return {
      html: `<header class="barra">${botonAtras()}
          <label class="campo-busqueda">${icono("buscar", 22)}<span class="oculto">Buscar producto</span>
            <input id="q" type="search" placeholder="Nombre del producto" autocomplete="off" enterkeyhint="search" value="${esc(inicial)}">
            <button class="boton-icono" data-accion="limpiar-busqueda" aria-label="Borrar texto" style="width:36px;height:36px">${icono("cerrar", 20)}</button>
          </label>
        </header>
        <div class="pagina" id="resultados" aria-live="polite"></div>`,
      montar() {
        const input = $("#q");
        const pintar = () => { $("#resultados").innerHTML = resultadosBusqueda(input.value); };
        input.addEventListener("input", pintar);
        pintar();
        if (!q.q) setTimeout(() => input.focus(), 50);
      },
    };
  },
};
function resultadosBusqueda(texto) {
  const t = normal(texto);
  if (!t) {
    return `<p class="intro" style="margin-top:8px">Escriba el nombre de un producto, por ejemplo «manzanilla».</p>
      <div class="chips">${["Manzanilla", "Árnica", "Valeriana", "Té verde", "Romero"].map((x) => `<button class="chip verde" data-accion="sugerencia" data-texto="${x}">${x}</button>`).join("")}</div>`;
  }
  const lista = PRODUCTOS.filter((p) => normal(p.nombre).includes(t) || normal(p.etiqueta).includes(t));
  if (!lista.length) {
    return vacio({
      simbolo: "buscar",
      titulo: "Sin resultados",
      texto: `No encontramos productos con «${esc(texto.trim())}». Revise cómo lo escribió o busque según lo que siente.`,
      botones: `<button class="boton primario" data-accion="buscar-de-nuevo">Buscar de nuevo</button><a class="boton secundario" href="#/sintomas">Ver síntomas</a>`,
    });
  }
  return `<p class="conteo" style="margin:4px 0 12px">${lista.length} ${lista.length === 1 ? "resultado" : "resultados"}</p><div class="lista">${lista.map((p) => filaProducto(p)).join("")}</div>`;
}

V.testimonios = {
  tab: "inicio", datos: true, carga: true,
  render() {
    const cabeza = `${barra("Testimonios")}<div class="pagina"><h1 class="titulo-pagina">Lo que dicen los clientes</h1>`;
    return {
      esqueleto: `${cabeza}<div class="cargando-texto" role="status"><span class="girador"></span>Cargando testimonios</div>
        <div class="testimonios">${'<div class="cita"><div class="esqueleto linea"></div><div class="esqueleto linea"></div><div class="esqueleto linea corta"></div></div>'.repeat(3)}</div></div>`,
      html: `${cabeza}<div class="testimonios">
          ${TESTIMONIOS.map((t) => `<figure class="cita" style="margin:0">${icono("comillas", 24)}<p>${esc(t.texto)}</p><figcaption class="autor">${esc(t.nombre)}</figcaption></figure>`).join("")}
        </div>
        <p class="letra-pequena">Testimonios de ejemplo para el prototipo.</p></div>`,
    };
  },
};

V.preguntas = {
  tab: "contacto",
  render() {
    return {
      html: `${barra("Preguntas frecuentes")}
        <div class="pagina">
          <p class="intro" style="margin-top:4px">Respuestas a las dudas más comunes sobre los productos naturales.</p>
          <div class="acordeon">
            ${PREGUNTAS.map((x, i) => `<details ${i === 0 ? "open" : ""}><summary>${x.p}${icono("siguiente", 20)}</summary><p>${x.r}</p></details>`).join("")}
          </div>
          <a class="boton secundario bloque" style="margin-top:8px" target="_blank" rel="noopener" href="${enlaceWhatsApp("Hola, La Bendición. Tengo una consulta:")}">${icono("chat", 22)}Hacer otra pregunta por WhatsApp</a>
        </div>`,
    };
  },
};

V.contacto = {
  tab: "contacto",
  render() {
    const local = estadoLocal();
    const { dia } = ahoraCR();
    return {
      html: `${barra("Contacto", { atras: false })}
        <div class="pagina">
          <h1 class="titulo-pagina">Visítenos en el Mercado Central</h1>
          <p class="intro">${CONTACTO.direccion}.</p>
          <div class="mapa">
            ${mapaMercado()}
            <div class="acciones-mapa">
              <button class="boton primario" data-accion="como-llegar">${icono("ruta", 20)}Cómo llegar</button>
              <a class="boton secundario" href="${enlaceMapa()}" target="_blank" rel="noopener">${icono("mapa", 20)}Abrir mapa</a>
            </div>
          </div>
          <div id="aviso-ubicacion"></div>

          <div class="seccion-titulo"><h2>Horario de atención</h2></div>
          <div class="estado-local ${local.abierto ? "abierto" : "cerrado"}">${local.texto}</div>
          <table class="tabla-horario"><tbody>
            ${CONTACTO.horario.map((h, i) => `<tr class="${i === dia ? "hoy" : ""}"><td>${h.dia}${i === dia ? " (hoy)" : ""}</td>
              <td class="${h.abre ? "" : "cerrado"}">${h.abre ? `${hora12(h.abre)} a ${hora12(h.cierra)}` : "Cerrado"}</td></tr>`).join("")}
          </tbody></table>

          <div class="seccion-titulo"><h2>Escríbanos</h2></div>
          <div class="lista">
            <a class="boton primario bloque" target="_blank" rel="noopener" href="${enlaceWhatsApp("Hola, La Bendición. Quisiera hacer una consulta.")}">${icono("chat", 22)}Escribir por WhatsApp</a>
            <a class="boton secundario bloque" target="_blank" rel="noopener" href="${enlaceFacebook()}">${icono("facebook", 22)}Ver página de Facebook</a>
            <a class="fila" href="#/preguntas"><span class="circulo-icono">${icono("pregunta", 24)}</span><div class="texto"><strong>Preguntas frecuentes</strong><small>Efectos, combinaciones, envíos y más</small></div>${icono("siguiente", 20)}</a>
          </div>
        </div>`,
    };
  },
};

V.perfil = {
  tab: "perfil", protegida: "perfil",
  render() {
    const u = sesion();
    const desde = new Date(u.desde + "T12:00:00").toLocaleDateString("es-CR", { month: "long", year: "numeric" });
    return {
      html: `${barra("Mi perfil", { atras: false })}
        <div class="pagina">
          <div class="perfil-cabecera">
            ${avatarHtml(u, "avatar-grande")}
            <h1>${esc(u.nombre)}</h1>
            <p>${esc(u.email)}</p>
            <p>Cliente desde ${desde}</p>
            <a class="boton secundario chico" href="#/editar-perfil" style="margin-top:14px">${icono("editar", 18)}Editar perfil</a>
          </div>
          <div class="lista">
            <a class="fila" href="#/favoritos"><span class="circulo-icono">${icono("corazon", 24)}</span><div class="texto"><strong>Mis favoritos</strong><small>Productos guardados</small></div><span class="contador">${u.favoritos.length}</span></a>
            <a class="fila" href="#/historial"><span class="circulo-icono">${icono("historial", 24)}</span><div class="texto"><strong>Historial</strong><small>Productos consultados</small></div><span class="contador">${u.historial.length}</span></a>
            <a class="fila" href="#/preguntas"><span class="circulo-icono">${icono("pregunta", 24)}</span><div class="texto"><strong>Preguntas frecuentes</strong></div>${icono("siguiente", 20)}</a>
            <a class="fila" target="_blank" rel="noopener" href="${enlaceWhatsApp("Hola, La Bendición. Quisiera hacer una consulta.")}"><span class="circulo-icono">${icono("chat", 24)}</span><div class="texto"><strong>Escribir por WhatsApp</strong><small>Consultas y pedidos</small></div>${icono("siguiente", 20)}</a>
          </div>
          <button class="boton peligro bloque" data-accion="cerrar-sesion" style="margin-top:22px">${icono("salir", 22)}Cerrar sesión</button>
        </div>`,
    };
  },
};

V.favoritos = {
  tab: "perfil", protegida: "favoritos",
  render() {
    const u = sesion();
    const lista = u.favoritos.map(producto).filter(Boolean);
    return {
      html: `${barra("Mis favoritos")}
        <div class="pagina">
          ${lista.length ? `<p class="conteo" style="margin:4px 0 14px">${lista.length} ${lista.length === 1 ? "producto guardado" : "productos guardados"}</p>
          <div class="lista">${lista.map((p) => filaProducto(p, {
            boton: `<button class="boton-icono activo" data-accion="quitar-favorito" data-id="${p.id}" aria-label="Quitar ${esc(p.nombre)} de favoritos">${icono("corazon", 22)}</button>`,
          })).join("")}</div>`
          : vacio({ simbolo: "corazon", titulo: "Todavía no tiene favoritos", texto: "Toque el corazón en la ficha de un producto para guardarlo aquí.", botones: `<a class="boton primario" href="#/catalogo">Ver catálogo</a>` })}
        </div>`,
    };
  },
};

V.historial = {
  tab: "perfil", protegida: "historial",
  render() {
    const u = sesion();
    const lista = u.historial.filter((h) => producto(h.id));
    return {
      html: `${barra("Historial", { acciones: lista.length ? `<button class="boton secundario chico" data-accion="borrar-historial">${icono("basura", 18)}Borrar</button>` : "" })}
        <div class="pagina">
          ${lista.length ? `<p class="conteo" style="margin:4px 0 14px">Productos que consultó</p>
          <div class="lista">${lista.map((h) => filaProducto(producto(h.id), { detalle: fechaRelativa(h.t) })).join("")}</div>`
          : vacio({ simbolo: "historial", titulo: "Su historial está vacío", texto: "Los productos que consulte aparecerán aquí.", botones: `<a class="boton primario" href="#/catalogo">Ver catálogo</a>` })}
        </div>`,
    };
  },
};

V["editar-perfil"] = {
  sinTab: true, protegida: "perfil",
  render() {
    const u = sesion();
    let avatar = { ...u.avatar };
    const pintarAvatar = () => {
      $("#vista-avatar").innerHTML = avatarHtml({ ...u, nombre: $("#nombre").value || u.nombre, avatar }, "avatar-grande");
      document.querySelectorAll(".colores-avatar button").forEach((b) => b.setAttribute("aria-pressed", String(avatar.tipo === "color" && avatar.valor === b.dataset.color)));
    };
    return {
      html: `${barra("Editar perfil")}
        <div class="pagina">
          <div class="perfil-cabecera" style="padding-bottom:6px">
            <div id="vista-avatar">${avatarHtml(u, "avatar-grande")}</div>
            <label class="boton secundario chico" style="margin-top:14px">${icono("camara", 18)}Cambiar foto
              <input id="foto" type="file" accept="image/jpeg,image/png,image/webp" class="oculto"></label>
            <div class="colores-avatar" role="group" aria-label="O elija un color">
              ${COLORES_AVATAR.map((c) => `<button type="button" data-color="${c}" style="background:${c}" aria-label="Color ${c}" aria-pressed="false"></button>`).join("")}
            </div>
            <div id="error-foto"></div>
          </div>
          <form class="form" id="form-perfil" novalidate>
            <div class="campo" id="campo-nombre"><label for="nombre">Nombre</label><div class="control"><input id="nombre" value="${esc(u.nombre)}" maxlength="40" autocomplete="name"></div></div>
            <div class="campo"><label for="correo">Correo</label><div class="control"><input id="correo" value="${esc(u.email)}" readonly></div><div class="ayuda">El correo no se puede cambiar.</div></div>
            <button class="boton primario bloque" type="submit">Guardar cambios</button>
            <a class="boton secundario bloque" href="#/perfil" data-accion="atras">Cancelar</a>
          </form>
        </div>`,
      montar() {
        pintarAvatar();
        document.querySelectorAll(".colores-avatar button").forEach((b) => b.addEventListener("click", () => { avatar = { tipo: "color", valor: b.dataset.color }; $("#error-foto").innerHTML = ""; pintarAvatar(); }));
        $("#nombre").addEventListener("input", () => { if (avatar.tipo === "color") pintarAvatar(); });
        $("#foto").addEventListener("change", (e) => {
          const f = e.target.files[0];
          e.target.value = "";
          if (!f) return;
          const err = (m) => ($("#error-foto").innerHTML = `<p class="error-general" style="margin-top:12px">${m}</p>`);
          if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return err("Ese archivo no es una foto válida. Use una imagen JPG, PNG o WEBP.");
          if (f.size > 5 * 1024 * 1024) return err("La foto pesa más de 5 MB. Elija una más liviana.");
          const lector = new FileReader();
          lector.onload = () => {
            const img = new Image();
            img.onload = () => {
              const lado = Math.min(img.width, img.height), cv = document.createElement("canvas");
              cv.width = cv.height = 256;
              cv.getContext("2d").drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
              avatar = { tipo: "foto", valor: cv.toDataURL("image/jpeg", 0.85) };
              $("#error-foto").innerHTML = "";
              pintarAvatar();
            };
            img.onerror = () => err("No pudimos abrir esa imagen. Pruebe con otra foto.");
            img.src = lector.result;
          };
          lector.readAsDataURL(f);
        });
        $("#form-perfil").addEventListener("submit", (e) => {
          e.preventDefault();
          const nombre = $("#nombre").value.trim().replace(/\s+/g, " ");
          const campo = $("#campo-nombre");
          campo.classList.remove("con-error");
          campo.querySelector(".error")?.remove();
          if (!nombre) {
            campo.classList.add("con-error");
            campo.insertAdjacentHTML("beforeend", `<div class="error">${icono("alerta", 18)}Escriba su nombre.</div>`);
            $("#nombre").focus();
            return;
          }
          actualizarUsuario((x) => { x.nombre = nombre; x.avatar = avatar; });
          navegar("/perfil", true);
          aviso("Cambios guardados");
        });
      },
    };
  },
};

const MOTIVOS = {
  favoritos: "Inicie sesión para guardar y ver sus favoritos.",
  historial: "Inicie sesión para ver su historial.",
  perfil: "Inicie sesión para ver su perfil.",
};
function campo(id, etiqueta, tipo, extra = "") {
  const ojo = tipo === "password" ? `<button type="button" class="boton-icono" data-accion="ver-clave" data-para="${id}" aria-label="Mostrar contraseña">${icono("ojo", 22)}</button>` : "";
  return `<div class="campo" id="campo-${id}"><label for="${id}">${etiqueta}</label><div class="control"><input id="${id}" type="${tipo}" ${extra}>${ojo}</div></div>`;
}
function marcarErrores(errores) {
  document.querySelectorAll(".campo").forEach((c) => { c.classList.remove("con-error"); c.querySelector(".error")?.remove(); });
  let primero = null;
  for (const [id, m] of Object.entries(errores)) {
    const c = $("#campo-" + id);
    if (!c) continue;
    c.classList.add("con-error");
    c.insertAdjacentHTML("beforeend", `<div class="error">${icono("alerta", 18)}<span>${m}</span></div>`);
    primero = primero || $("#" + id);
  }
  if (primero) primero.focus();
  return !primero;
}
const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);

V.ingresar = {
  sinTab: true,
  render(_, q) {
    const volver = q.volver || "/inicio";
    return {
      html: `${barra("", { atras: true })}
        <div class="pagina">
          <div class="cuenta-cabecera">${logo(56)}<h1>Ingresar</h1>
            <p>${MOTIVOS[q.motivo] || "Su cuenta guarda sus favoritos e historial en cualquier teléfono."}</p></div>
          <form class="form" id="form-ingresar" novalidate>
            <div id="error-general"></div>
            ${campo("email", "Correo", "email", 'autocomplete="email" inputmode="email" placeholder="nombre@correo.com"')}
            ${campo("clave", "Contraseña", "password", 'autocomplete="current-password"')}
            <a class="enlace" href="#/recuperar" style="justify-self:start">¿Olvidó su contraseña?</a>
            <button class="boton primario bloque" type="submit">Ingresar</button>
            <p class="separador">¿No tiene cuenta?</p>
            <a class="boton secundario bloque" href="#/registro?volver=${encodeURIComponent(volver)}">Crear cuenta</a>
            <a class="enlace" href="#/inicio" style="justify-self:center">Seguir sin cuenta</a>
          </form>
        </div>`,
      montar() {
        $("#form-ingresar").addEventListener("submit", async (e) => {
          e.preventDefault();
          const email = $("#email").value.trim().toLowerCase(), clave = $("#clave").value;
          $("#error-general").innerHTML = "";
          const errores = {};
          if (!correoValido(email)) errores.email = "Escriba un correo válido, por ejemplo nombre@correo.com.";
          if (!clave) errores.clave = "Escriba su contraseña.";
          if (!marcarErrores(errores)) return;
          const u = usuarios()[email];
          if (!u || u.hash !== (await huella(clave))) {
            $("#error-general").innerHTML = `<p class="error-general">El correo o la contraseña no coinciden. Revíselos o recupere su contraseña.</p>`;
            return;
          }
          datos.set("lb_sesion", email);
          volverA(volver);
          aviso(`Hola de nuevo, ${primerNombre(u.nombre)}`);
        });
      },
    };
  },
};

V.registro = {
  sinTab: true,
  render(_, q) {
    const volver = q.volver || "/inicio";
    return {
      html: `${barra("", { atras: true })}
        <div class="pagina">
          <div class="cuenta-cabecera">${logo(56)}<h1>Crear cuenta</h1><p>Guarde sus favoritos y su historial en su cuenta.</p></div>
          <form class="form" id="form-registro" novalidate>
            ${campo("nombre", "Nombre", "text", 'autocomplete="name" maxlength="40"')}
            ${campo("email", "Correo", "email", 'autocomplete="email" inputmode="email" placeholder="nombre@correo.com"')}
            ${campo("clave", "Contraseña", "password", 'autocomplete="new-password"')}
            <div class="ayuda" style="margin-top:-10px;font-size:14px;color:var(--gris)">Mínimo 8 caracteres, con al menos un número.</div>
            ${campo("clave2", "Repita la contraseña", "password", 'autocomplete="new-password"')}
            <button class="boton primario bloque" type="submit">Crear cuenta</button>
            <p class="separador">¿Ya tiene cuenta? <a class="enlace" href="#/ingresar?volver=${encodeURIComponent(volver)}">Ingresar</a></p>
          </form>
        </div>`,
      montar() {
        $("#form-registro").addEventListener("submit", async (e) => {
          e.preventDefault();
          const nombre = $("#nombre").value.trim().replace(/\s+/g, " ");
          const email = $("#email").value.trim().toLowerCase();
          const clave = $("#clave").value, clave2 = $("#clave2").value;
          const errores = {};
          if (!nombre) errores.nombre = "Escriba su nombre.";
          if (!correoValido(email)) errores.email = "Escriba un correo válido, por ejemplo nombre@correo.com.";
          else if (usuarios()[email]) errores.email = "Ya existe una cuenta con este correo. Ingrese o recupere su contraseña.";
          if (clave.length < 8 || !/\d/.test(clave)) errores.clave = "La contraseña necesita al menos 8 caracteres y un número.";
          else if (clave !== clave2) errores.clave2 = "Las contraseñas no coinciden.";
          if (!marcarErrores(errores)) return;
          const u = usuarios();
          u[email] = { nombre, email, hash: await huella(clave), avatar: { tipo: "color", valor: COLORES_AVATAR[Object.keys(u).length % COLORES_AVATAR.length] }, desde: new Date().toISOString().slice(0, 10), favoritos: [], historial: [] };
          guardarUsuarios(u);
          datos.set("lb_sesion", email);
          volverA(volver);
          aviso("Cuenta creada");
        });
      },
    };
  },
};

V.recuperar = {
  sinTab: true,
  render() {
    return {
      html: `${barra("", { atras: true })}
        <div class="pagina" id="recuperar">
          <div class="cuenta-cabecera">${logo(56)}<h1>Recuperar contraseña</h1><p>Escriba el correo de su cuenta y le enviamos un enlace para crear una nueva.</p></div>
          <form class="form" id="form-recuperar" novalidate>
            ${campo("email", "Correo", "email", 'autocomplete="email" inputmode="email" placeholder="nombre@correo.com"')}
            <button class="boton primario bloque" type="submit">Enviar enlace</button>
            <a class="enlace" href="#/ingresar" style="justify-self:center">Volver a ingresar</a>
          </form>
        </div>`,
      montar() {
        $("#form-recuperar").addEventListener("submit", (e) => {
          e.preventDefault();
          const email = $("#email").value.trim().toLowerCase();
          if (!marcarErrores(correoValido(email) ? {} : { email: "Escriba un correo válido, por ejemplo nombre@correo.com." })) return;
          $("#recuperar").innerHTML = vacio({
            simbolo: "check",
            titulo: "Revise su correo",
            texto: `Si existe una cuenta con ${esc(email)}, le enviamos un enlace para crear una nueva contraseña.`,
            botones: `<a class="boton primario" href="#/ingresar">Volver a ingresar</a>`,
          });
        });
      },
    };
  },
};

V["sin-conexion"] = {
  tab: "inicio",
  render() { return { html: `${barra("La Bendición", { atras: false })}<div class="pagina">${htmlSinConexion()}</div>` }; },
};

V.noEncontrado = {
  render() {
    return { html: `${barra("")}<div class="pagina">${vacio({ simbolo: "alerta", titulo: "No encontramos esta pantalla", texto: "Puede que el enlace esté incompleto.", botones: `<a class="boton primario" href="#/inicio">Ir al inicio</a>` })}</div>` };
  },
};

let rutaActual = null;
let renderId = 0;
const pila = [];
let reemplazando = false;
const cargadas = new Set();

function leerRuta() {
  const h = location.hash.replace(/^#\/?/, "");
  const [camino, consulta = ""] = h.split("?");
  const partes = camino.split("/").filter(Boolean);
  const nombre = partes[0] || "";
  const query = Object.fromEntries(new URLSearchParams(consulta));
  const params = partes[1] ? { id: decodeURIComponent(partes[1]) } : {};
  return { nombre, params, query, camino: "/" + partes.join("/"), completa: h };
}
function navegar(ruta, reemplazar = false) {
  if (reemplazar) { reemplazando = true; location.replace("#" + ruta); }
  else location.hash = ruta;
}
let saltando = false;
function volverA(ruta) {
  const objetivo = ruta.replace(/^\//, "");
  for (let i = pila.length - 2; i >= 0; i--) {
    if (pila[i] === objetivo) {
      const n = pila.length - 1 - i;
      pila.splice(i + 1);
      saltando = true;
      history.go(-n);
      return;
    }
  }
  navegar(ruta, true);
}
function atras() {
  if (pila.length > 1) history.back();
  else {
    const padres = { categoria: "/catalogo", producto: "/catalogo", sintoma: "/sintomas", favoritos: "/perfil", historial: "/perfil", "editar-perfil": "/perfil", preguntas: "/contacto", registro: "/ingresar", recuperar: "/ingresar" };
    navegar(padres[rutaActual] || "/inicio", true);
  }
}

function render() {
  const r = leerRuta();
  if (!r.nombre) { navegar("/apertura", true); return; }
  if (saltando) saltando = false;
  else if (reemplazando && pila.length) { pila[pila.length - 1] = r.completa; reemplazando = false; }
  else if (reemplazando) { pila.push(r.completa); reemplazando = false; }
  else if (pila.length > 1 && pila[pila.length - 2] === r.completa) pila.pop();
  else pila.push(r.completa);

  const vista = V[r.nombre] || V.noEncontrado;
  cerrarCapa();

  if (vista.protegida && !sesion()) {
    navegar(`/ingresar?volver=${encodeURIComponent(r.camino)}&motivo=${vista.protegida}`, true);
    return;
  }

  rutaActual = r.nombre;
  const id = ++renderId;
  const salida = vista.render(r.params, r.query);

  tabbar.hidden = !!vista.sinTab;
  tabbar.querySelectorAll("a").forEach((a) => a.classList.toggle("activo", a.dataset.tab === vista.tab));
  const tel = $(".telefono");
  tel.style.setProperty("--fondo-estado", vista.estado === "verde" ? "#1E4A36" : salida.fondoEstado || "var(--papel)");
  tel.style.setProperty("--color-estado", vista.estado === "verde" ? "#FFFFFF" : "var(--tinta)");
  document.querySelectorAll(".panel a[data-ruta]").forEach((a) => a.classList.toggle("activo", a.dataset.ruta === "#/" + r.completa));

  pantalla.className = vista.sinTab ? (salida.accion ? "con-accion" : "") : "con-tabbar";
  const pintar = (html) => {
    pantalla.innerHTML = html + (salida.accion ? `<div class="barra-accion">${salida.accion}</div>` : "");
    pantalla.scrollTop = 0;
  };

  if (vista.datos && sinRed()) {
    pintar(`${barra(r.nombre === "inicio" ? "La Bendición" : "", { atras: r.nombre !== "inicio" })}<div class="pagina">${htmlSinConexion()}</div>`);
    pantalla.className = vista.sinTab ? "" : "con-tabbar";
    pantalla.querySelector(".barra-accion")?.remove();
    return;
  }

  if (vista.carga && salida.esqueleto && !cargadas.has(r.completa)) {
    pantalla.innerHTML = salida.esqueleto;
    pantalla.scrollTop = 0;
    setTimeout(() => {
      if (id !== renderId) return;
      cargadas.add(r.completa);
      pintar(salida.html);
      salida.montar && salida.montar();
    }, 650);
    return;
  }
  pintar(salida.html);
  salida.montar && salida.montar();
}

function abrirCapa(html, centro = false) {
  capa.innerHTML = `<div class="fondo-capa ${centro ? "centro" : ""}" data-accion="cerrar-capa-fondo">${html}</div>`;
  capa.querySelector("button, a")?.focus();
}
function cerrarCapa() { capa.innerHTML = ""; }
let temporizadorAviso;
function aviso(texto, accion) {
  toastEl.innerHTML = `<span>${texto}</span>${accion ? `<button data-accion="aviso-accion">${accion.texto}</button>` : ""}`;
  toastEl._accion = accion && accion.fn;
  toastEl.classList.add("visible");
  toastEl.style.bottom = tabbar.hidden ? (pantalla.classList.contains("con-accion") ? "96px" : "20px") : "";
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => toastEl.classList.remove("visible"), accion ? 4500 : 2600);
}

async function compartir(p) {
  const texto = `${p.nombre}, de La Bendición (Mercado Central de San José). ${p.descripcion}`;
  if (navigator.share) {
    try { await navigator.share({ title: p.nombre, text: texto }); } catch (e) {}
    return;
  }
  abrirCapa(`<div class="hoja-inferior" role="dialog" aria-label="Compartir producto"><div class="asa"></div>
    <h2>Compartir producto</h2><p>${esc(p.nombre)}</p>
    <div class="botones">
      <a class="boton primario" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(texto)}">${icono("chat", 22)}Enviar por WhatsApp</a>
      <button class="boton secundario" data-accion="copiar" data-texto="${esc(texto)}">Copiar texto</button>
      <button class="boton secundario" data-accion="cerrar-capa">Cancelar</button>
    </div></div>`);
}

function comoLlegar() {
  abrirCapa(`<div class="dialogo" role="dialog" aria-label="Permiso de ubicación">
    <div class="circulo-icono" style="margin-bottom:12px">${icono("contacto", 24)}</div>
    <h2>¿Usar su ubicación?</h2>
    <p>La usamos solo para trazar la ruta desde donde está hasta el Mercado Central.</p>
    <div class="botones lado"><button class="boton secundario" data-accion="ubicacion-no">Ahora no</button><button class="boton primario" data-accion="ubicacion-si">Permitir</button></div>
  </div>`, true);
}
function avisoSinRuta() {
  const a = $("#aviso-ubicacion");
  if (a) a.innerHTML = `<div class="aviso ambar">${icono("alerta", 22)}<div>No usamos su ubicación, así que le mostramos el mapa del Mercado Central sin ruta. Puede tocar «Abrir mapa» para verlo en su app de mapas.</div></div>`;
}

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-accion]");
  if (!el) return;
  const a = el.dataset.accion;
  if (a === "cerrar-capa-fondo") { if (e.target === el) cerrarCapa(); return; }
  if (el.tagName === "A" && a !== "atras") return;
  e.preventDefault();
  const id = el.dataset.id;
  const u = sesion();

  switch (a) {
    case "atras": atras(); break;
    case "cerrar-capa": cerrarCapa(); break;
    case "favorito": {
      if (!u) { navegar(`/ingresar?volver=${encodeURIComponent("/producto/" + id)}&motivo=favoritos`); return; }
      const ya = u.favoritos.includes(id);
      actualizarUsuario((x) => { x.favoritos = ya ? x.favoritos.filter((f) => f !== id) : [id, ...x.favoritos]; });
      el.classList.toggle("activo", !ya);
      el.setAttribute("aria-pressed", String(!ya));
      el.setAttribute("aria-label", ya ? "Guardar en favoritos" : "Quitar de favoritos");
      aviso(ya ? "Se quitó de Mis favoritos" : "Se guardó en Mis favoritos");
      break;
    }
    case "quitar-favorito": {
      const pos = u.favoritos.indexOf(id);
      actualizarUsuario((x) => { x.favoritos = x.favoritos.filter((f) => f !== id); });
      render();
      aviso("Se quitó de Mis favoritos", { texto: "Deshacer", fn: () => { actualizarUsuario((x) => { x.favoritos.splice(pos, 0, id); }); render(); } });
      break;
    }
    case "aviso-accion": toastEl._accion && toastEl._accion(); toastEl.classList.remove("visible"); break;
    case "compartir": compartir(producto(id)); break;
    case "copiar":
      try { await navigator.clipboard.writeText(el.dataset.texto); aviso("Texto copiado"); } catch (err) { aviso("No se pudo copiar el texto"); }
      cerrarCapa();
      break;
    case "borrar-historial":
      abrirCapa(`<div class="dialogo" role="alertdialog" aria-label="Borrar historial">
        <h2>¿Borrar su historial?</h2><p>Se eliminarán todos los productos consultados. Esta acción no se puede deshacer.</p>
        <div class="botones lado"><button class="boton secundario" data-accion="cerrar-capa">Cancelar</button><button class="boton primario" data-accion="confirmar-borrar" style="background:var(--rojo)">Borrar</button></div></div>`, true);
      break;
    case "confirmar-borrar":
      actualizarUsuario((x) => { x.historial = []; });
      render();
      aviso("Su historial está vacío");
      break;
    case "cerrar-sesion":
      datos.quitar("lb_sesion");
      navegar("/ingresar", true);
      aviso("Cerró sesión");
      break;
    case "ver-clave": {
      const inp = $("#" + el.dataset.para);
      const ver = inp.type === "password";
      inp.type = ver ? "text" : "password";
      el.innerHTML = icono(ver ? "ojoNo" : "ojo", 22);
      el.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
      break;
    }
    case "limpiar-busqueda":
    case "buscar-de-nuevo": { const q = $("#q"); q.value = ""; q.dispatchEvent(new Event("input")); q.focus(); break; }
    case "sugerencia": { const q = $("#q"); q.value = el.dataset.texto; q.dispatchEvent(new Event("input")); break; }
    case "reintentar":
      if (sinRed()) aviso("Sigue sin conexión. Revise sus datos móviles o el wifi.");
      else render();
      break;
    case "como-llegar": comoLlegar(); break;
    case "ubicacion-no": cerrarCapa(); avisoSinRuta(); break;
    case "ubicacion-si":
      cerrarCapa();
      if (!navigator.geolocation) { avisoSinRuta(); break; }
      navigator.geolocation.getCurrentPosition(
        (pos) => window.open(`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${CONTACTO.lat},${CONTACTO.lng}`, "_blank"),
        () => avisoSinRuta(),
        { timeout: 10000 }
      );
      break;
    case "demo-ingresar": datos.set("lb_sesion", DEMO.email); navegar("/perfil"); aviso(`Ingresó como ${DEMO.nombre}`); break;
    case "demo-sin-red":
      sinRedDemo = !sinRedDemo;
      el.setAttribute("aria-pressed", String(sinRedDemo));
      render();
      break;
    case "demo-reiniciar":
      ["lb_usuarios", "lb_sesion"].forEach((k) => datos.quitar(k));
      cargadas.clear();
      await sembrarDemo();
      navegar("/apertura");
      break;
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarCapa(); });
window.addEventListener("online", () => { if (!sinRedDemo) render(); });
window.addEventListener("offline", render);
window.addEventListener("hashchange", render);

function ajustarEscala() {
  const escala = Math.min(1, (window.innerHeight - 40) / 868);
  document.documentElement.style.setProperty("--escala", escala.toFixed(3));
}
window.addEventListener("resize", ajustarEscala);
ajustarEscala();

(async () => {
  await sembrarDemo();
  render();
})();
