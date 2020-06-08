FROM node:alpine

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git && \
  npm install --quiet node-gyp -g

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm set progress=false && \
  npm i --silent

RUN apk del native-deps

COPY package.json ./

RUN npm install
RUN npm build

COPY . ./

CMD npm start

ENV PORT 8050
EXPOSE 8050