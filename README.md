# Plataforma de Análisis de Tráfico - Región Metropolitana

Este proyecto es una plataforma distribuida para capturar y analizar información de tráfico en tiempo real desde el **Live Map de Waze**, enfocado en comunas de la **Región Metropolitana de Santiago, Chile**.

## Componentes

-  **Scraper**: Extrae eventos de tráfico de Waze usando Puppeteer.
-  **Almacenamiento**: Guarda los eventos en **MongoDB**.
-  **Generador de tráfico**: Simula consultas de eventos almacenados.
-  **Sistema de caché**: Responde consultas frecuentes más rápido (FIFO o LRU).

Todo el sistema está **dockerizado** para fácil ejecución.

---

## Tecnologías usadas

- Node.js
- Puppeteer
- MongoDB
- Docker y Docker Compose

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Xxfelipe89xX/Trabajo1SD-WazeScrapper.git
cd Trabajo1SD-WazeScrapper
```

### 2. Requisitos

- Docker
- Docker Compose
- Puertos disponibles: `27017` (MongoDB), `3000` (caché)

### 3. Configurar archivos

Asegúrate de tener el archivo `cities.csv` con formato:

```
Santiago,https://www.waze.com/en/live-map/directions?to=ll.-33.44918511%2C-70.67133617
Ñuñoa,https://www.waze.com/en/live-map/directions?to=ll.-33.45615%2C-70.6037
Puente Alto,https://www.waze.com/en/live-map/directions?to=ll.-33.6189%2C-70.5901
...
```

### 4. Construir los contenedores

```bash
docker-compose build
```

### 5. Levantar todos los servicios

```bash
docker-compose up -d
```

---

## Servicios disponibles

| Servicio         | Descripción                        | Puerto                        |
|------------------|------------------------------------|-------------------------------|
| Scraper          | Extrae datos de Waze               | Interno |
| Generador        | Genera consultas automáticas       | Interno |
| MongoDB          | Base de datos de eventos           | localhost:27017 |
| Caché            | Cache de respuestas rápidas        | localhost:3000 |

---

## Uso de los módulos

### Scraper

Automáticamente captura datos y los guarda en MongoDB.

Ver logs:

```bash
docker-compose logs -f scraper
```

### Generador

Simula consultas constantes a MongoDB y al caché.

Ver logs:

```bash
docker-compose logs -f generador
```

### Almacenamiento en MongoDB

Acceder a la base de datos:

```bash
docker exec -it mongo mongosh
use trafico
db.eventos.find().pretty()
```

Contar documentos:

```bash
db.eventos.countDocuments()
```

### Caché

Consultar claves almacenadas:

```bash
curl "http://localhost:3000/claves"
```

Consultar un dato específico:

```bash
curl "http://localhost:3000/consultar?key=consulta:Santiago"
```

---

## Cambiar política de caché

Actualmente configurado como **LRU** con tamaño **10**.

Para cambiar a **FIFO** y tamaño **15**:

1. Modificar `cache.js`:

```javascript
const TAMANO_CACHE = 15;
const POLITICA = process.env.CACHE_POLICY || 'FIFO';
```

2. Luego reconstruir solo el servicio de caché:

```bash
docker-compose build cache
docker-compose up -d cache
```

---

## Detener servicios

```bash
docker-compose down
```

 Usa solo `docker-compose down` para NO eliminar la base de datos (MongoDB).

---

## Troubleshooting

- Error de conexión en caché: Asegúrate que `localhost:3000` esté libre.
- Puppeteer no inicia: Puede faltar alguna librería en el contenedor (ya solucionado en el Dockerfile).
- Permisos en Docker: Verifica que tu usuario esté agregado al grupo `docker`.

---
