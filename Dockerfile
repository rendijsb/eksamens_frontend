FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --legacy-peer-deps

RUN npm install -g @angular/cli

COPY . .

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check", "--poll=2000"]
