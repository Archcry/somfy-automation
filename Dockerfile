# Builder image
FROM node:14-alpine AS builder
WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src src

RUN npm run build

# Actual image
FROM node:14-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN chown node:node .
USER node

EXPOSE 3000

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

ENTRYPOINT [ "node", "./dist/index.js" ]