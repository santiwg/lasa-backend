# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias de producción
RUN npm ci --omit=dev

# Copia el resto del código fuente
COPY . .

# Borra la carpeta dist por si existe de builds anteriores
RUN rm -rf dist

# Compila el proyecto NestJS (genera la carpeta dist)
RUN npm run build

# Copia el archivo de entorno de producción y define la variable
COPY .env.production .env
ENV NODE_ENV=production

# Expone el puerto en el que corre el backend (ajusta si usas otro)
EXPOSE 3000

# Comando para iniciar la app en producción
CMD ["npm", "run", "start:prod"]