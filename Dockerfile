# Imagem: brmusics-frontend (Next.js standalone)
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM node:20-slim AS production

WORKDIR /app

LABEL org.opencontainers.image.title="brmusics-frontend"
LABEL org.opencontainers.image.description="Interface web do BRMusics"

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3002

CMD ["node", "server.js"]
