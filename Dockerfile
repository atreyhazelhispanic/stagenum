FROM node:22.13.0-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV APP_ENV=local \
    PROCESS_ROLE=web \
    DATABASE_URL=${DATABASE_URL} \
    LOG_LEVEL=info \
    RELEASE_SHA=container-build
RUN npm run build
RUN npm prune --omit=dev

FROM node:22.13.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 stagenum \
  && adduser --system --uid 1001 --ingroup stagenum stagenum
COPY --from=build --chown=stagenum:stagenum /app/package.json /app/package-lock.json ./
COPY --from=build --chown=stagenum:stagenum /app/node_modules ./node_modules
COPY --from=build --chown=stagenum:stagenum /app/.next ./.next
COPY --from=build --chown=stagenum:stagenum /app/src ./src
COPY --from=build --chown=stagenum:stagenum /app/db ./db
COPY --from=build --chown=stagenum:stagenum /app/scripts ./scripts
USER stagenum
EXPOSE 3000
CMD ["npm", "start"]
