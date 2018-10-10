FROM node:carbon

WORKDIR /usr/src/app

RUN npm install -g nodemon

COPY ../../gameserver/package*.json ./
RUN npm install

CMD ["npm", "start"]