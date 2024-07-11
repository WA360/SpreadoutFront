FROM node:20

ENV PORT=3000

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

RUN npx prettier --write .

COPY . .

RUN npm run build

EXPOSE $PORT

ENTRYPOINT ["npm", "run", "start"]