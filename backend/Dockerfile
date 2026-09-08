FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema para compilar librerías si es necesario
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 4261

# Comando por defecto (con hot-reload para desarrollo)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4261", "--reload"]
