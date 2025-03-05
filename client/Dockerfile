# Stage 1: Build
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ./ .

# Build the application
RUN npm run build

# Stage 2: Run
FROM nginx:alpine

# Copy the built application from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the port that Nginx will run on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
