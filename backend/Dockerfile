FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci

COPY backend/ ./


RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]