# Production image: Prisma client is generated into src/generated/prisma (gitignored),
# so `npm run build` must run `prisma generate` first (see package.json "build" script).
FROM node:lts AS runner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# DATABASE_URL not required for prisma generate; set real URL at runtime for the app.
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
