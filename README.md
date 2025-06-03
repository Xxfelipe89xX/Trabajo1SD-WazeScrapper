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

## Cambiar tamaño de caché

Actualmente configurado como **LRU**.

Pruebas realizadas con tamaño 5 y 10 en caché

1. Modificar `cache.js`:

```javascript
const TAMANO_CACHE = 10;
```

2. Luego reconstruir solo el servicio de caché:

```bash
docker-compose build cache
docker-compose up -d cache
```

---

## Procesamiento y análisis de datos

El proyecto incluye un módulo adicional de procesamiento para trabajar con los datos extraídos por el scraper.

### Componentes del procesamiento

- **limpiarEventos.js**: Script en Node.js que limpia y organiza los datos crudos guardados en `trafico.eventos.json`.
- **análisis.pig**: Script en Apache Pig que analiza los datos limpios y genera archivos `.csv` agrupados por comuna, tipo de evento y fecha.

### Estructura del flujo

1. **Entrada**: `trafico.eventos.json`  
   Puedes descargarlo desde el siguiente enlace: https://drive.google.com/file/d/10wpm9Dh3B6muQevbYuIO52rHHQ7vviqd/view?usp=drive_link

2. **Limpieza**: Ejecutar `limpiarEventos.js` dentro del contenedor de procesamiento.

```bash
docker compose up limpieza
```

4. **Análisis**: Ejecutar `análisis.pig` en Apache Pig para generar estadísticas.

```bash
docker compose up pig
```

6. **Salida**: Los resultados del análisis se exportan en la carpeta `/resultados`.

## Detener servicios

```bash
docker-compose down
```

 Usa solo `docker-compose down` para NO eliminar la base de datos (MongoDB).

---
