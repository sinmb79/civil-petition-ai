# syntax=docker/dockerfile:1

FROM node:20-alpine AS source
WORKDIR /app
COPY . .

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=source /app/package.json ./package.json
COPY --from=source /app/src ./src
COPY --from=source /app/packages ./packages
EXPOSE 3000
CMD ["node", "src/server.js"]
