FROM node:20-alpine

WORKDIR /app/image-app

COPY image-app/package*.json ./

RUN npm install

COPY image-app ./

EXPOSE 5173
CMD ["npm","run","dev","--","--host"]
