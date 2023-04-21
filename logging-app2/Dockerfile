FROM node:18-alpine

WORKDIR /app

COPY ["package-lock.json*", "package.json", "config", ".env", "./"]

RUN npm install

COPY . .

CMD ["node", "app.js"]
