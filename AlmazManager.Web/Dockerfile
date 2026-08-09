FROM node:24-alpine AS build
WORKDIR /app
COPY AlmazManager.Web/package.json AlmazManager.Web/package-lock.json ./
RUN npm ci
COPY AlmazManager.Web/ .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY AlmazManager.Web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
