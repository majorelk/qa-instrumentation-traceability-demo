FROM node:20-bullseye
WORKDIR /mock
COPY package.json package-lock.json* ./
RUN npm i --omit=dev
COPY . .
EXPOSE 8081
CMD ["npm","start"]
