# Use official Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install --only=production

# Copy remaining source code
COPY . .

# Expose port for gateway service
EXPOSE 4000

# Start the gateway server
CMD ["node", "server.js"]
