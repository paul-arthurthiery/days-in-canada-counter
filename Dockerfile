FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
RUN npm run build-frontend
RUN npm run build-backend
EXPOSE 3000
CMD [ "node", "index.js" ]