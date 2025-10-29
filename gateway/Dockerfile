FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p data && echo '{"requests":[]}' > data/db.json
EXPOSE 4000
ENV PY_BACKEND_URL=http://backend:8000
CMD ["npm", "start"]

