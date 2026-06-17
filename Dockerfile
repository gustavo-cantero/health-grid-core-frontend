FROM node:24-alpine AS builder

WORKDIR /app
RUN npm install -g @angular/cli

COPY src/ .

RUN npm install
RUN npm run build

FROM nginx:stable AS final
EXPOSE 80
COPY --from=builder /app/dist/HealthGrid/browser/ /usr/share/nginx/html/