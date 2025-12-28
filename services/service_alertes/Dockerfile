# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 8000
ENV NODE_ENV=production

# Let package.json decide the entrypoint
CMD ["npm","start"]
