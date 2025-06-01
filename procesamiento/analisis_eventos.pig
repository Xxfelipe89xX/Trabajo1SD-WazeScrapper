eventos_raw = LOAD 'datos/eventos_limpios.csv'
    USING PigStorage(',')
    AS (comuna:chararray, tipo:chararray, fecha:chararray, descripcion:chararray);

eventos = FILTER eventos_raw BY comuna != 'comuna';

por_comuna = GROUP eventos BY comuna;
conteo_comuna = FOREACH por_comuna GENERATE group AS comuna, COUNT(eventos) AS total;

por_tipo = GROUP eventos BY tipo;
conteo_tipo = FOREACH por_tipo GENERATE group AS tipo, COUNT(eventos) AS total;

eventos_con_dia = FOREACH eventos GENERATE 
  comuna, 
  tipo, 
  SUBSTRING(fecha, 0, 10) AS dia, 
  descripcion;
agrupados = GROUP eventos_con_dia BY dia;
conteo_fecha = FOREACH agrupados GENERATE 
  group AS dia, 
  COUNT(eventos_con_dia) AS cantidad_eventos;

STORE conteo_comuna INTO 'resultados/conteo_comuna' USING PigStorage(',');
STORE conteo_tipo INTO 'resultados/conteo_tipo' USING PigStorage(',');
STORE conteo_fecha INTO 'resultados/conteo_fecha' USING PigStorage(',');
