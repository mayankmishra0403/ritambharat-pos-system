FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodeuser:nodejs /app/logs /app/uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER nodeuser

CMD ["node", "server.js"]
