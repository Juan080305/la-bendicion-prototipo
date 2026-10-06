const PAPEL = "#FBF8EE";

function mezclar(hex, otro, t) {
  const a = hex.replace("#", ""), b = otro.replace("#", "");
  const c = (s, i) => parseInt(s.substr(i, 2), 16);
  const r = Math.round(c(a, 0) + (c(b, 0) - c(a, 0)) * t);
  const g = Math.round(c(a, 2) + (c(b, 2) - c(a, 2)) * t);
  const bl = Math.round(c(a, 4) + (c(b, 4) - c(a, 4)) * t);
  return "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("");
}
const oscuro = (h, t = 0.45) => mezclar(h, "#101810", t);
const claro = (h, t = 0.82) => mezclar(h, "#FFFFFF", t);

function escaparTexto(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function textoEtiqueta(texto, cx, cy, ancho, color) {
  const palabras = texto.split(" ");
  let lineas = [texto];
  if (texto.length > 9 && palabras.length > 1) {
    let mejor = null;
    for (let i = 1; i < palabras.length; i++) {
      const l1 = palabras.slice(0, i).join(" "), l2 = palabras.slice(i).join(" ");
      const peor = Math.max(l1.length, l2.length);
      if (!mejor || peor < mejor.peor) mejor = { peor, l: [l1, l2] };
    }
    lineas = mejor.l;
  }
  const larga = Math.max(...lineas.map((l) => l.length));
  const tam = Math.min(15, (ancho * 1.75) / Math.max(larga, 4));
  const alto = tam * 1.12;
  const y0 = cy - ((lineas.length - 1) * alto) / 2 + tam * 0.34;
  return lineas
    .map((l, i) => `<text x="${cx}" y="${(y0 + i * alto).toFixed(1)}" text-anchor="middle" font-family="'Young Serif', Georgia, serif" font-size="${tam.toFixed(1)}" fill="${color}">${escaparTexto(l)}</text>`)
    .join("");
}

function ramita(cx, y, color) {
  return `<g fill="${color}" opacity=".9">
    <path d="M${cx - 9} ${y} h18" stroke="${color}" stroke-width=".9" fill="none"/>
    <ellipse cx="${cx - 4}" cy="${y - 2.2}" rx="3.2" ry="1.4" transform="rotate(-25 ${cx - 4} ${y - 2.2})"/>
    <ellipse cx="${cx + 4}" cy="${y - 2.2}" rx="3.2" ry="1.4" transform="rotate(25 ${cx + 4} ${y - 2.2})"/>
  </g>`;
}

function envase(tipo, tinte, etiqueta) {
  const t = tinte, o = oscuro(t), c = claro(t, 0.55), tx = oscuro(t, 0.55);
  const brillo = `fill="#FFFFFF" opacity=".22"`;
  let d = "";
  switch (tipo) {
    case "frasco":
      d = `<rect x="33" y="22" width="54" height="20" rx="4" fill="#ECEFE8"/>
        <path d="M39 22v20M45 22v20M51 22v20M57 22v20M63 22v20M69 22v20M75 22v20M81 22v20" stroke="#C9CFC6" stroke-width="1.2"/>
        <rect x="29" y="40" width="62" height="88" rx="12" fill="${t}"/>
        <rect x="35" y="46" width="7" height="74" rx="3.5" ${brillo}/>
        <rect x="29" y="60" width="62" height="48" fill="${PAPEL}"/>
        <path d="M29 63.5h62M29 104.5h62" stroke="${t}" stroke-width="1"/>
        ${ramita(60, 74, t)}${textoEtiqueta(etiqueta, 60, 90, 56, tx)}`;
      break;
    case "botella":
      d = `<rect x="47" y="12" width="26" height="22" rx="5" fill="${o}"/>
        <rect x="52" y="8" width="16" height="7" rx="3" fill="${o}"/>
        <path d="M42 34h36c6 0 10 6 10 14v72c0 7-5 12-12 12H44c-7 0-12-5-12-12V48c0-8 4-14 10-14z" fill="${t}"/>
        <rect x="38" y="42" width="7" height="80" rx="3.5" ${brillo}/>
        <rect x="32" y="62" width="56" height="46" rx="2" fill="${PAPEL}"/>
        ${ramita(60, 74, t)}${textoEtiqueta(etiqueta, 60, 90, 50, tx)}`;
      break;
    case "bolsa":
      d = `<path d="M26 36h68l6 92H20z" fill="#CDAE7E"/>
        <path d="M26 36h68l-2 12H28z" fill="#B8976A"/>
        <path d="M30 26h60v12H30z" fill="#D9BE92"/>
        <path d="M30 32h60" stroke="#B8976A" stroke-width="1.5" stroke-dasharray="3 2.5"/>
        <rect x="40" y="54" width="40" height="22" rx="11" fill="${c}"/>
        <g fill="${t}"><ellipse cx="50" cy="65" rx="6" ry="2.6" transform="rotate(-30 50 65)"/><ellipse cx="60" cy="63" rx="6" ry="2.6" transform="rotate(20 60 63)"/><ellipse cx="70" cy="66" rx="6" ry="2.6" transform="rotate(-15 70 66)"/></g>
        <rect x="30" y="84" width="60" height="36" rx="2" fill="${PAPEL}"/>
        ${textoEtiqueta(etiqueta, 60, 102, 54, tx)}`;
      break;
    case "gotero":
      d = `<path d="M52 8h16c3 0 5 3 5 7v13H47V15c0-4 2-7 5-7z" fill="#2B2B28"/>
        <rect x="45" y="26" width="30" height="14" rx="3" fill="#3A3A36"/>
        <path d="M50 40h20v6c10 2 16 8 16 16v58c0 6-5 10-11 10H45c-6 0-11-4-11-10V62c0-8 6-14 16-16z" fill="${t}"/>
        <rect x="40" y="60" width="6" height="62" rx="3" ${brillo}/>
        <rect x="34" y="70" width="52" height="42" fill="${PAPEL}"/>
        ${ramita(60, 81, t)}${textoEtiqueta(etiqueta, 60, 96, 46, tx)}`;
      break;
    case "jabon":
      d = `<rect x="12" y="52" width="96" height="62" rx="18" fill="${c}"/>
        <rect x="12" y="52" width="96" height="62" rx="18" fill="none" stroke="${t}" stroke-width="2"/>
        <rect x="20" y="58" width="80" height="10" rx="5" fill="#FFFFFF" opacity=".35"/>
        <rect x="12" y="72" width="96" height="30" fill="${PAPEL}"/>
        <path d="M12 74h96M12 100h96" stroke="${t}" stroke-width="1"/>
        ${textoEtiqueta(etiqueta, 60, 87, 80, tx)}`;
      break;
    case "caja":
      d = `<path d="M30 36l12-12h52l-12 12z" fill="${claro(t, 0.25)}"/>
        <path d="M82 36l12-12v94l-12 12z" fill="${o}"/>
        <rect x="26" y="36" width="56" height="94" rx="2" fill="${t}"/>
        <path d="M90 50c6 4 6 16 2 24" stroke="#E9E4D4" stroke-width="1.2" fill="none"/>
        <rect x="86" y="72" width="12" height="14" rx="1.5" fill="${PAPEL}" stroke="${o}" stroke-width=".8"/>
        <rect x="26" y="62" width="56" height="44" fill="${PAPEL}"/>
        ${ramita(54, 73, t)}${textoEtiqueta(etiqueta, 54, 89, 50, tx)}`;
      break;
    case "lata":
      d = `<rect x="18" y="58" width="84" height="22" rx="8" fill="${o}"/>
        <rect x="18" y="58" width="84" height="7" rx="3.5" fill="#FFFFFF" opacity=".18"/>
        <rect x="22" y="76" width="76" height="46" rx="8" fill="${t}"/>
        <rect x="22" y="84" width="76" height="30" fill="${PAPEL}"/>
        ${textoEtiqueta(etiqueta, 60, 99, 68, tx)}`;
      break;
  }
  return `<svg viewBox="0 0 120 140" class="envase" aria-hidden="true">${d}</svg>`;
}

function envaseProducto(p) {
  const cat = CATEGORIAS.find((c) => c.id === p.cat);
  return envase(cat.envase, p.tinte, p.etiqueta);
}
function envaseCategoria(c) {
  return envase(c.envase, c.tinte, c.nombre);
}

function logo(tam = 40, fondo = "#1E4A36", hojas = "#D9A23A", claseRamita = "") {
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M8 62V30C8 16.7 18.7 6 32 6s24 10.7 24 24v32z" fill="${fondo}"/>
    <g class="${claseRamita}">
      <path d="M32 54C32 42 33 30 37 19" stroke="${hojas}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g fill="${hojas}">
        <path d="M33 43c-9 1-14-4-15-10 8-1 13 3 15 10z"/>
        <path d="M34.5 33c8-1 12-6 12-12-7 0-11 5-12 12z"/>
        <path d="M36.5 22c-5-3-6-9-4-13 5 2 6 8 4 13z"/>
      </g>
    </g>
  </svg>`;
}

const I = {
  inicio: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  catalogo: '<path d="M4 5h16M4 12h16M4 19h16"/><path d="M7 5v-.01M7 12v-.01M7 19v-.01" stroke-width="3"/>',
  sintomas: '<path d="M12 21c-5-3-8-7-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 8-8 11z"/><path d="M7 12h3l1.5-2.5 2 5 1.5-2.5h2"/>',
  contacto: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  atras: '<path d="M15 5 8 12l7 7"/>',
  siguiente: '<path d="m9 5 7 7-7 7"/>',
  corazon: '<path d="M12 20s-7.5-4.6-8.5-9.6C2.8 6.8 5.2 4.5 7.8 4.5c1.8 0 3.2 1 4.2 2.6 1-1.6 2.4-2.6 4.2-2.6 2.6 0 5 2.3 4.3 5.9C19.5 15.4 12 20 12 20z"/>',
  compartir: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
  chat: '<path d="M4 19.5 5.3 15A8 8 0 1 1 9 18.7z"/><path d="M9 10.5c.3 1.6 1.9 3.4 4 4l1-1 2 .8-.4 1.6c-3.4.2-7.3-3.4-7.6-6.8L9.6 8.6l.9 1.9z" stroke-width="1.3"/>',
  facebook: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M14.5 8.5h-1.3c-1 0-1.7.7-1.7 1.7V20M9.5 13h5"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  ruta: '<path d="M12 3 20 20l-8-4-8 4z"/>',
  mapa: '<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2z"/><path d="M9 4v14M15 6v14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alerta: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17v.01"/>',
  sinred: '<path d="M3 3l18 18"/><path d="M5 9.5a11 11 0 0 1 4-2.3M12 6.5a11 11 0 0 1 7 3M8 13a6 6 0 0 1 5-1.5M12 18v.01"/>',
  basura: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  salir: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
  pregunta: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01"/>',
  historial: '<path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.5"/><path d="M4 4v4.5h4.5M12 8v4l3 2"/>',
  ojo: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  ojoNo: '<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.8 3.4M6.2 7.6C3.9 9.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 10a3 3 0 0 0 4.2 4.1"/>',
  comillas: '<path d="M10 7c-3 1-5 3.5-5 7v3h5v-5H7.5c0-2 1-3.4 2.5-4zM19 7c-3 1-5 3.5-5 7v3h5v-5h-2.5c0-2 1-3.4 2.5-4z" fill="currentColor" stroke="none"/>',
  cabeza: '<path d="M7 19v-3.5C5 14 4 12 4 10a7 7 0 0 1 14 0l1.8 3.2-1.8.6V16a2 2 0 0 1-2 2h-1.5v1"/><path d="M9 6.5l1.5 2-1.5 2 1.5 2" stroke-width="1.4"/>',
  cabello: '<path d="M6 20c0-6 1-11 6-14 5 3 6 8 6 14"/><path d="M9.5 20c0-5 .7-8.5 2.5-11 1.8 2.5 2.5 6 2.5 11"/>',
  escudo: '<path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z"/><path d="M12 8.5v6M9 11.5h6"/>',
  luna: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M15.5 4.5v3M14 6h3" stroke-width="1.4"/>',
  foco: '<path d="M9 17.5h6M10 21h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.6.6-1 1.5-1 2.5h-5c0-1-.4-1.9-1-2.5z"/>',
  musculo: '<path d="M4 17c3-1 5-1 7 0 3 1.5 6 1 8-2 1.3-2 .5-4.5-1.5-5-2-.5-3.5 1-4 2.5"/><path d="M13.5 12.5c-1-2.5-3-6-6-7.5L6 7l2 1.5L6.5 11"/>',
  brote: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5zM12 14.5c0-3.5 2.6-6 6.5-6 0 3.5-2.6 6-6.5 6z"/>',
};

function icono(nombre, tam = 24, clase = "") {
  return `<svg class="ico ${clase}" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[nombre] || ""}</svg>`;
}

function mapaMercado() {
  return `<svg viewBox="0 0 340 200" class="mapa-svg" role="img" aria-label="Mapa del Mercado Central de San José, entre avenidas Central y 1, calles 6 y 8">
    <rect width="340" height="200" fill="#E6EBE1"/>
    <g fill="#D7DED0">
      <rect x="6" y="6" width="68" height="40" rx="3"/><rect x="96" y="6" width="148" height="40" rx="3"/><rect x="266" y="6" width="68" height="40" rx="3"/>
      <rect x="6" y="154" width="68" height="40" rx="3"/><rect x="96" y="154" width="148" height="40" rx="3"/><rect x="266" y="154" width="68" height="40" rx="3"/>
      <rect x="6" y="68" width="68" height="64" rx="3"/><rect x="266" y="68" width="68" height="64" rx="3"/>
    </g>
    <g fill="#FFFFFF">
      <rect x="0" y="46" width="340" height="22"/><rect x="0" y="132" width="340" height="22"/>
      <rect x="74" y="0" width="22" height="200"/><rect x="244" y="0" width="22" height="200"/>
    </g>
    <rect x="96" y="68" width="148" height="64" rx="4" fill="#C9D8C2" stroke="#1E4A36" stroke-width="1.5"/>
    <g font-family="'Atkinson Hyperlegible', sans-serif" font-size="9.5" fill="#56645B">
      <text x="170" y="60" text-anchor="middle">Avenida 1</text>
      <text x="170" y="146" text-anchor="middle">Avenida Central</text>
      <text x="85" y="100" text-anchor="middle" transform="rotate(-90 85 100)">Calle 8</text>
      <text x="255" y="100" text-anchor="middle" transform="rotate(-90 255 100)">Calle 6</text>
    </g>
    <text x="170" y="122" text-anchor="middle" font-family="'Young Serif', Georgia, serif" font-size="12" fill="#1E4A36">Mercado Central</text>
    <g transform="translate(170 72)">
      <path d="M0 26s-13-11-13-21a13 13 0 0 1 26 0c0 10-13 21-13 21z" fill="#B5651D"/>
      <circle cx="0" cy="4" r="5" fill="#FBF8EE"/>
    </g>
  </svg>`;
}
