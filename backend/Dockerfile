FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

# Default port, can be overridden via PORT env
EXPOSE 5002

CMD ["npm", "run", "start"]

