const fs = require('fs');
const path = require('path');

const archivoEntrada = './trafico.eventos.json';
const archivoSalida = path.join(__dirname, 'datos', 'eventos_limpios.csv');

function parsearEventos(texto) {
  try {
    const data = JSON.parse(texto);
    if (Array.isArray(data)) return data;
  } catch (e) {
    return texto
      .split('\n')
      .filter(l => l.trim())
      .map(linea => JSON.parse(linea));
  }
}

function limpiarEvento(e) {
  const comuna = e.city?.trim() || 'Desconocida';
  const tipoCrudo = e.type?.toLowerCase().trim() || 'otro';
  const subtipo = e.subtype?.toLowerCase().trim() || '';
  const comentario0 = Array.isArray(e.comments) ? e.comments[0] : null;

  const fecha = comentario0?.reportMillis
    ? new Date(comentario0.reportMillis).toISOString()
    : new Date().toISOString();

  const descripcion = e.street || subtipo || 'Sin descripción';

  let tipo = 'Otro';

  if (tipoCrudo.includes('accident')) tipo = 'Accidente';
  else if (tipoCrudo.includes('congestion') || tipoCrudo.includes('jam')) tipo = 'Congestión';
  else if (tipoCrudo.includes('hazard')) tipo = 'Peligro';
  else if (tipoCrudo.includes('road_closed')) tipo = 'Corte de ruta';
  else if (tipoCrudo.includes('construction')) tipo = 'Construcción';
  else if (tipoCrudo.includes('weather')) tipo = 'Clima';
  else if (tipoCrudo.includes('police')) tipo = 'Policía';
  else if (tipoCrudo.includes('event')) tipo = 'Evento';

  return {
    comuna,
    tipo,
    fecha,
    descripcion: descripcion.trim().replace(/[\n\r,]/g, ' ')
  };
}

try {
  const texto = fs.readFileSync(archivoEntrada, 'utf-8');
  const eventosCrudos = parsearEventos(texto);

  const eventosLimpios = eventosCrudos
    .filter(e => e.city && e.type)
    .map(limpiarEvento);

  const eventosUnicos = Array.from(
    new Map(eventosLimpios.map(e => [`${e.comuna}-${e.tipo}-${e.fecha}`, e])).values()
  );

  const cabecera = 'comuna,tipo,fecha,descripcion\n';
  const lineas = eventosUnicos.map(e =>
    `${e.comuna},${e.tipo},${e.fecha},"${e.descripcion}"`
  );

  fs.mkdirSync(path.join(__dirname, 'datos'), { recursive: true });
  fs.writeFileSync(archivoSalida, cabecera + lineas.join('\n'), 'utf-8');
  console.log(`${eventosUnicos.length} eventos limpios guardados en ${archivoSalida}`);
} catch (err) {
  console.error('Error procesando archivo:', err.message);
}
