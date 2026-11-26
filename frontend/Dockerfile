FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/

# Inject API base URL at container start (browser talks to host-mapped backend)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4780

ENTRYPOINT ["/docker-entrypoint.sh"]
