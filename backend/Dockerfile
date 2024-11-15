# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Install dependencies for building TypeScript (make sure to install build tools)
RUN apk add --no-cache --virtual .build-deps gcc g++ make python3 \
    && apk add --no-cache bash \
    && npm install -g typescript \
    && apk del .build-deps

# Copy package.json and package-lock.json first to leverage Docker cache for node_modules
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Compile TypeScript files
RUN tsc

# Command to run your app
CMD ["node", "dist/app.js"]
