// ── Horario del negocio: parseo y estado abierto/cerrado ──────────────────
// Soporta formatos tipo "12:00 M - 08:00 PM" (M = mediodía = 12 PM),
// "7:00 AM - 10:00 PM", "13:00 - 21:00" y "24 horas" (siempre abierto).

const parseHora = (txt) => {
  const m = String(txt).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|M)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const suf = (m[3] || "").toUpperCase();
  if (h > 23 || min > 59) return null;
  if (suf === "PM" || suf === "M") {
    if (h < 12) h += 12;
  }
  if (suf === "AM" && h === 12) h = 0;
  return h * 60 + min;
};

export const parseHorario = (horarioStr) => {
  const texto = (horarioStr || "").trim();
  if (!texto) return { ok: false };
  if (/24\s*(h|horas)?/i.test(texto)) return { ok: true, siempreAbierto: true };

  const partes = texto.split(/\s*[–-]\s*/);
  if (partes.length !== 2) return { ok: false };
  const apertura = parseHora(partes[0]);
  const cierre = parseHora(partes[1]);
  if (apertura == null || cierre == null) return { ok: false };
  return { ok: true, apertura, cierre, cruzaMedianoche: cierre <= apertura };
};

/**
 * Estado del negocio para la tienda y el checkout.
 * @returns {{abierto:boolean, fuerzaCierre:boolean, dentroHorario:boolean, horarioTexto:string, siempreAbierto:boolean}}
 */
export const estaAbiertoSegunHorario = (settings = {}) => {
  const fuerzaCierre = settings.forceClosed === true;
  const horarioTexto = [settings.day1, settings.hours1].filter(Boolean).join(" · ");
  const p = parseHorario(settings.hours1);

  if (!p.ok) {
    // Sin horario legible → se asume abierto salvo cierre manual (no bloquear ventas)
    return { abierto: !fuerzaCierre, fuerzaCierre, dentroHorario: true, horarioTexto, siempreAbierto: false };
  }
  if (p.siempreAbierto) {
    return {
      abierto: !fuerzaCierre,
      fuerzaCierre,
      dentroHorario: true,
      horarioTexto: horarioTexto || "24 horas",
      siempreAbierto: true,
    };
  }

  const ahora = new Date();
  const mins = ahora.getHours() * 60 + ahora.getMinutes();
  const dentro = p.cruzaMedianoche
    ? mins >= p.apertura || mins < p.cierre
    : mins >= p.apertura && mins < p.cierre;

  return {
    abierto: dentro && !fuerzaCierre,
    fuerzaCierre,
    dentroHorario: dentro,
    horarioTexto,
    siempreAbierto: false,
  };
};
