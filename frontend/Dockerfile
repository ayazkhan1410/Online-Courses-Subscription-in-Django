FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:4781/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY app/package.json app/package-lock.json app/.npmrc ./
RUN npm install
COPY app/ ./
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 4780
