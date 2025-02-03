FROM node:22-alpine

WORKDIR /app
COPY . .
RUN npm install
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
