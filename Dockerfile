FROM node:24-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY . .

RUN npm run build

RUN npm prune --production


FROM node:24-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "--unhandled-rejections=strict", "./dist/app.js"]
