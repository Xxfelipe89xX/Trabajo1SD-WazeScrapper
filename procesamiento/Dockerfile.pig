FROM openjdk:11

WORKDIR /workspace

RUN apt-get update && \
    apt-get install -y wget tar python && \
    wget https://downloads.apache.org/pig/pig-0.17.0/pig-0.17.0.tar.gz && \
    tar -xzf pig-0.17.0.tar.gz && \
    mv pig-0.17.0 /opt/pig && \
    rm pig-0.17.0.tar.gz

ENV PIG_HOME=/opt/pig
ENV PATH=$PATH:$PIG_HOME/bin
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk

COPY analisis_eventos.pig .
COPY ../datos ./datos

CMD ["pig", "-x", "local", "analisis_eventos.pig"]
