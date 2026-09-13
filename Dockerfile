FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY dist ./dist
COPY server ./server
ENV PORT=2567
EXPOSE 2567
CMD ["node", "server/index.mjs"]
