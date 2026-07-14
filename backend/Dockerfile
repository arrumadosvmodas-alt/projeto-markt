FROM node:20-alpine

WORKDIR /app

# Instala dependências de sistema necessárias para o Prisma
RUN apk add --no-cache openssl

# Copia manifests de dependências
COPY package.json package-lock.json ./

# Instala todas as dependências
RUN npm ci

# Copia o schema do Prisma e gera o client
COPY prisma ./prisma/
RUN npx prisma generate

# Copia o código-fonte TypeScript
COPY src ./src
COPY tsconfig.json ./

# Compila o TypeScript
RUN npx tsc -p tsconfig.json

EXPOSE 4000

# Sincroniza o banco e inicia o servidor
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
