# FROM ghcr.io/puppeteer/puppeteer:20.8.2
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
#     PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# CMD ["node", "indexv2.js"]

FROM ghcr.io/puppeteer/puppeteer:20.8.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN apt-get update

RUN apt-get install -y \
    libX11-xcb1 \
    libX11-xcb-dev \
    libxtst6 \
    libnss3 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libappindicator3-1 \
    libpango-1.0-0 \
    libcairo2

RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*


COPY . .

ENV PORT=8000

EXPOSE 8000

CMD ["node", "indexv2.js"]
