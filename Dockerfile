# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY src/package.json src/package-lock.json ./

RUN npm install -g npm@11 && npm ci

COPY src/ .

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/dist/HealthGrid/browser/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
