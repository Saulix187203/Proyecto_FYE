FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --include=dev

COPY --chown=node:node prisma ./prisma
RUN npx prisma generate

COPY --chown=node:node server.js ./server.js
COPY --chown=node:node src ./src
COPY --chown=node:node uploads ./uploads
RUN mkdir -p /app/uploads/evidencias && chown -R node:node /app/uploads

USER node
EXPOSE 3000
CMD ["npm", "start"]
