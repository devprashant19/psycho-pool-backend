# 1. Use Node 18
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy ONLY package.json (Ignore package-lock to avoid Windows conflicts)
COPY package.json ./

# 4. Install dependencies fresh
RUN npm install

# 5. Copy the rest of your code
COPY . .

# 6. Set the port
ENV PORT 8080
EXPOSE 8080

# 7. Start the server
CMD ["node", "server.js"]