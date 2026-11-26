FROM node:20-alpine AS hero
WORKDIR /hero
COPY hero/package.json hero/package-lock.json* ./
RUN npm install
COPY hero/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/
COPY --from=hero /hero/dist/hero-desk.js /usr/share/nginx/html/js/hero-desk.js
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 4780
ENTRYPOINT ["/docker-entrypoint.sh"]
