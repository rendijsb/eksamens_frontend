FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm install -g @angular/cli
RUN npm install
RUN npm install ngx-toastr
EXPOSE 4200
CMD ["npm", "start"]
