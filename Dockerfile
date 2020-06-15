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

ARG PORT
ARG SERVICE_ID
ENV SERVICE_ID=${SERVICE_ID}
ENV PORT=${PORT}
CMD npm start

EXPOSE ${PORT}