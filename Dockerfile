# Imagen base
FROM node:18-alpine

# Crear directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el proyecto, incluyendo .env
COPY . .

# Copiar .env
COPY .env .env

# Generar Prisma Client para Linux (muy importante)
RUN npx prisma generate

# Compilar el proyecto Next.js
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando final
CMD ["npm", "start"]
