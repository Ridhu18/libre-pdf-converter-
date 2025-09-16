FROM node:18-alpine

# Install LibreOffice and basic dependencies
RUN apk add --no-cache \
    libreoffice \
    font-noto \
    font-noto-cjk \
    font-liberation \
    font-dejavu \
    font-freefont \
    chromium \
    nss \
    freetype \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp output public

# Set permissions
RUN chmod -R 755 /app

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]