FROM node:22.17.0-alpine AS frontend

WORKDIR /frontend

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.28-alpine

COPY --from=frontend /frontend/dist /usr/share/nginx/html

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
