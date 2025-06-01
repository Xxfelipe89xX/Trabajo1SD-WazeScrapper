eventos_raw = LOAD 'datos/eventos_limpios.csv'
    USING PigStorage(',')
    AS (comuna:chararray, tipo:chararray, fecha:chararray, descripcion:chararray);

eventos = FILTER eventos_raw BY comuna != 'comuna';

por_comuna = GROUP eventos BY comuna;
conteo_comuna = FOREACH por_comuna GENERATE group AS comuna, COUNT(eventos) AS total;

por_tipo = GROUP eventos BY tipo;
conteo_tipo = FOREACH por_tipo GENERATE group AS tipo, COUNT(eventos) AS total;

por_comuna_tipo = GROUP eventos BY (comuna, tipo);
conteo_comuna_tipo = FOREACH por_comuna_tipo GENERATE
    group.comuna AS comuna,
    group.tipo AS tipo,
    COUNT(eventos) AS total;

STORE conteo_comuna INTO 'resultados/conteo_comuna' USING PigStorage(',');
STORE conteo_tipo INTO 'resultados/conteo_tipo' USING PigStorage(',');
STORE conteo_comuna_tipo INTO 'resultados/conteo_comuna_tipo' USING PigStorage(',');
