FROM node:21-alpine AS builder

WORKDIR /app

COPY src/package*.json ./

RUN npm install

COPY src/ .

RUN npm run build

FROM nginx:stable AS final
EXPOSE 80

COPY src/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/HealthGrid/browser/ /usr/share/nginx/html/