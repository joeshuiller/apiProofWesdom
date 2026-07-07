# ==========================================
# Etapa 1: Compilación (Builder)
# ==========================================
FROM node:24 AS builder

WORKDIR /app

# Copiamos y descargamos TODAS las dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código y compilamos TypeScript
COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Producción (Runner)
# ==========================================
FROM node:24

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./

# Instalamos compiladores temporalmente, instalamos dependencias de prod y luego borramos los compiladores
RUN npm install

# Copiamos ÚNICAMENTE el código ya compilado desde la Etapa 1
COPY --from=builder /app/dist ./dist
# 👇 LA SOLUCIÓN: Copiamos la carpeta config al contenedor final
COPY config ./config

EXPOSE 8080

# Ejecutamos el proyecto
CMD ["node", "dist/bundle.js"]