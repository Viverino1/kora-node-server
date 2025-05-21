# Use Node.js 20 LTS version specifically
FROM node:20.11.1-slim

# Set working directory
WORKDIR /app

# Install git and Chrome dependencies
RUN apt-get update && apt-get install -y git \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# Clone the repository
RUN git clone https://github.com/Viverino1/kora-node-server.git .

# Install dependencies
RUN npm install

# Generate Prisma client first in the correct location
RUN mkdir -p src/lib/prisma
RUN npx prisma generate

# Copy generated Prisma client to src directory
RUN cp -r dist/lib/prisma/* src/lib/prisma/

# Then build the application
RUN npm run build

# Expose ports (adjust if needed)
EXPOSE 6969
EXPOSE 5555

# Start the application
CMD ["npm", "start"]