# Frontend Dockerfile for Next.js app
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5141/api
ARG NEXT_PUBLIC_API_ORIGIN=http://localhost:5141
ARG NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true
ARG API_INTERNAL_URL=http://backend:5141/api
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_ORIGIN=$NEXT_PUBLIC_API_ORIGIN
ENV NEXT_PUBLIC_UNOPTIMIZED_IMAGES=$NEXT_PUBLIC_UNOPTIMIZED_IMAGES
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=builder /usr/src/app/.next .next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/next.config.ts ./next.config.ts
COPY --from=builder /usr/src/app/tsconfig.json ./tsconfig.json

EXPOSE 3848
ENV PORT=3848
CMD ["npm", "run", "start"]
