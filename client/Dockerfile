# Single stage build and run
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory
COPY ./package*.json ./

# Install dependencies
RUN npm install

EXPOSE 5173

# Copy the rest of the application code
COPY ./ .

# Copy .env.docker file first (will be used for build)
RUN mv ./.env.docker ./.env

# Stage 2: Run
FROM nginx:alpine AS runner

# Copy the built application from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the port that Nginx will run on
EXPOSE 80

# Copy custom Nginx configuration and Start Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
