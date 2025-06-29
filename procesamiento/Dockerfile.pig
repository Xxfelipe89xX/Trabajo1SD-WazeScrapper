FROM openjdk:11

ARG UID=1000
ARG GID=1000

RUN apt-get update && \
    apt-get install -y wget tar python && \
    wget https://downloads.apache.org/pig/pig-0.17.0/pig-0.17.0.tar.gz && \
    tar -xzf pig-0.17.0.tar.gz && \
    mv pig-0.17.0 /opt/pig && \
    rm pig-0.17.0.tar.gz && \
    chmod +x /opt/pig/bin/pig && \
    groupadd -g ${GID} piggroup || true && \
    useradd -u ${UID} -g piggroup -m piguser || true

ENV PIG_HOME=/opt/pig
ENV JAVA_HOME=/usr/local/openjdk-11
ENV PATH="$JAVA_HOME/bin:$PIG_HOME/bin:$PATH"

USER piguser

WORKDIR /workspace

COPY analisis_eventos.pig .
COPY ../datos ./datos

ENTRYPOINT bash -c "count=0; while [ ! -f /workspace/datos/eventos_limpios.csv ] && [ \$count -lt 30 ]; do echo 'Esperando eventos_limpios.csv...'; sleep 5; count=\$((count+1)); done; if [ ! -f /workspace/datos/eventos_limpios.csv ]; then echo 'Archivo eventos_limpios.csv no encontrado tras esperar.'; exit 1; fi; rm -rf /workspace/resultados/* && exec pig -x local analisis_eventos.pig"
