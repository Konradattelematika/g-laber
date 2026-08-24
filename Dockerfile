# Statischer Build für Coolify (Build Pack: Dockerfile)
# Feed-Daten (src/data/episodes.json) sind eingecheckt — der Build braucht kein Netz.
# Neue Folgen: `npm run fetch-feed` laufen lassen, committen, pushen.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
