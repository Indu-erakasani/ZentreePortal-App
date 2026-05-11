# FROM node:18

# WORKDIR /usr/src/app

# COPY package*.json ./

# RUN npm install --legacy-peer-deps

# COPY . .

# RUN npm run build

# RUN npm install -g serve

# EXPOSE 3000

# CMD ["serve", "-s", "build", "-l", "3000"]





FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
COPY .env .env          
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]