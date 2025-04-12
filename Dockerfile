# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Build Next.js app
RUN npx next build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npx", "next", "start"]