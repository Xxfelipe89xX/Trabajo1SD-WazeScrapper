import os
import json
import time
from elasticsearch import Elasticsearch, helpers
from elasticsearch.exceptions import ConnectionError

ELASTIC_HOST = os.environ.get("ELASTIC_HOST", "elasticsearch")
ELASTIC_PORT = os.environ.get("ELASTIC_PORT", "9200")
INDEX_NAME = os.environ.get("INDEX_NAME", "eventos_procesados")
DATA_DIR = os.environ.get("DATA_DIR", "/app/resultados")

es = Elasticsearch(f"http://{ELASTIC_HOST}:{ELASTIC_PORT}")

def esperar_elasticsearch(max_reintentos=20, espera=5):
    for intento in range(1, max_reintentos + 1):
        try:
            if es.ping():
                print(f"Elasticsearch disponible (intento {intento})")
                return True
            else:
                print(f"Esperando Elasticsearch... (intento {intento})")
        except Exception:
            print(f"Esperando Elasticsearch... (intento {intento})")
        time.sleep(espera)
    print("No se pudo conectar a Elasticsearch tras varios intentos.")
    return False

def cargar_datos():
    documentos = []
    for archivo in os.listdir(DATA_DIR):
        if archivo.endswith(".json"):
            with open(os.path.join(DATA_DIR, archivo), "r") as f:
                try:
                    data = json.load(f)
                    if isinstance(data, list):
                        for doc in data:
                            documentos.append(doc)
                    else:
                        documentos.append(data)
                except Exception as e:
                    print(f"Error leyendo {archivo}: {e}")
    return documentos

def cargar_csv(path, tipo):
    documentos = []
    with open(path, "r") as f:
        for linea in f:
            partes = linea.strip().split(",")
            if len(partes) == 2:
                campo, cantidad = partes
                try:
                    cantidad = int(cantidad)
                except ValueError:
                    continue
                doc = {"tipo": tipo, "campo": campo, "cantidad": cantidad}
                documentos.append(doc)
    return documentos

def buscar_archivos_csv():
    documentos = []
    for subdir, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.startswith("part-r-"):
                tipo = os.path.basename(subdir)
                path = os.path.join(subdir, file)
                documentos.extend(cargar_csv(path, tipo))
    return documentos

def indexar_documentos(documentos):
    if not documentos:
        print("No se encontraron documentos para indexar.")
        return False
    acciones = [
        {
            "_index": INDEX_NAME,
            "_source": doc
        } for doc in documentos
    ]
    helpers.bulk(es, acciones)
    print(f"Indexados {len(acciones)} documentos en '{INDEX_NAME}'")
    return True

def borrar_indice():
    if es.indices.exists(index=INDEX_NAME):
        es.indices.delete(index=INDEX_NAME)
        print(f"Índice '{INDEX_NAME}' eliminado para evitar duplicados.")
    else:
        print(f"Índice '{INDEX_NAME}' no existe, no es necesario eliminar.")

def esperar_y_indexar(max_reintentos=12, espera=10):
    if not esperar_elasticsearch():
        return
    borrar_indice()
    for intento in range(1, max_reintentos + 1):
        print(f"Intento {intento}: Buscando archivos para indexar...")
        documentos_json = cargar_datos()
        documentos_csv = buscar_archivos_csv()
        total = len(documentos_json) + len(documentos_csv)
        if total > 0:
            indexar_documentos(documentos_json)
            indexar_documentos(documentos_csv)
            return
        else:
            print(f"No se encontraron documentos. Esperando {espera} segundos...")
            time.sleep(espera)
    print("No se encontraron documentos para indexar tras varios intentos.")

if __name__ == "__main__":
    esperar_y_indexar()
