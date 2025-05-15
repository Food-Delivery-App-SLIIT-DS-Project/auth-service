# === Build Stage ===
FROM node:22-alpine AS builder

WORKDIR /app

# Use package-lock for deterministic builds
COPY package*.json ./
RUN npm ci

COPY . . 
RUN npm run build

# === Production Stage ===
FROM node:22-alpine AS prod

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Only copy the built files
COPY --from=builder /app/dist ./dist
# COPY .env .env

# Optional: Clean up cache
RUN npm cache clean --force

EXPOSE 50051

CMD ["npm", "run", "start:prod"]
