FROM node:20-slim

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Cloud Run sets $PORT (commonly 8080). The app already reads process.env.PORT.
EXPOSE 8080

CMD ["npm", "run", "start:prod"]
