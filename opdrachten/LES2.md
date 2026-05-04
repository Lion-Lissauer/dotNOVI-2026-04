# Les 2: Docker Containerisatie

## Doelstellingen

In deze les leer je:
- Docker basisbegrippen
- Wat containers zijn en waarom ze nuttig zijn
- Hoe je de dotNOVI applicatie containeriseert
- Dockerfile schrijven en optimaliseren
- Docker images bouwen en runnen

## Wat is Docker?

Docker is een containerisatie-platform dat applicaties isoleert in "containers" - standaardized eenheden die alles bevatten wat nodig is om te runnen:
- Applicatie code
- Runtime
- Dependencies
- System tools
- Libraries

### Voordelen van Containers

```
┌─────────────────────────────────────────┐
│          Zonder Containers              │
├─────────────────────────────────────────┤
│ "Het werkt op mijn machine!"           │
│ - Versieverschillen                    │
│ - Omgeving specifieke issues           │
│ - Moeilijk reproduceerbaar             │
│ - Deployment problemen                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Met Containers                 │
├─────────────────────────────────────────┤
│ "Het werkt overal hetzelfde"           │
│ - Consistent environment                │
│ - Gemakkelijk reproduceerbaar           │
│ - Snelle deployment                    │
│ - Isolation tussen applicaties         │
└─────────────────────────────────────────┘
```

## Docker Terminologie

- **Image**: Template/blauwdruk voor een container
- **Container**: Running instance van een image
- **Dockerfile**: Instructies om een image te bouwen
- **Registry**: Repository voor images (Docker Hub, GHCR)
- **Layer**: Component van een image (stackable)

## Dockerfile Breakdown

```dockerfile
# FROM: Base image starten
FROM node:20-alpine

# LABEL: Metadata
LABEL maintainer="NOVI"

# WORKDIR: Werkmapje in container
WORKDIR /app

# COPY: Bestanden van host naar container
COPY package*.json ./

# RUN: Commando's uitvoeren
RUN npm ci --only=production

# COPY: Meer bestanden
COPY src ./src

# HEALTHCHECK: Health monitoring
HEALTHCHECK --interval=30s CMD ...

# EXPOSE: Port declaratie
EXPOSE 3000

# CMD: Default command
CMD ["node", "src/index.js"]
```

## Hands-on: Dockerfile Gebruiken

### Stap 1: Installeer Docker

[Download Docker Desktop](https://www.docker.com/products/docker-desktop)

Controleer installatie:
```bash
docker --version
docker run hello-world
```

### Stap 2: Kopieer Dockerfile

```bash
# Kopieer Dockerfile naar dotNOVI-app root
cp Dockerfile ../../../dotNOVI-app/
cp .dockerignore ../../../dotNOVI-app/
```

### Stap 3: Build Docker Image

```bash
cd ../../../dotNOVI-app

# Build image
docker build -t dotnovi:latest .

# Controleer image
docker images | grep dotnovi
```

### Stap 4: Run Container

```bash
# Run container
docker run -d -p 3000:3000 --name dotnovi-app dotnovi:latest

# Check logs
docker logs dotnovi-app

# Test applicatie
curl http://localhost:3000/health

# Stop container
docker stop dotnovi-app
```

### Stap 5: Run met Environment Variables

```bash
# Met DATABASE_URL
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/dotnovi" \
  -e PORT=3000 \
  --name dotnovi-app \
  dotnovi:latest

# Check omgeving in container
docker exec dotnovi-app env | grep DATABASE_URL
```

## Opdrachten

### Opdracht 1: Dockerfile schrijven

Maak een Dockerfile in de root van je dotNOVI-project.

```bash
# 1. Maak een Dockerfile met de volgende instructies:
#    - Base image: node:20-alpine
#    - WORKDIR /app
#    - Kopieer package.json eerst, dan npm install, dan code
#    - EXPOSE 3000
#    - CMD: npm start

# 2. Vergeet ook een .dockerignore aan te maken:
#    node_modules, .git, *.md, .env

# 3. Controleer je Dockerfile
cat Dockerfile
```

**Tip:** Waarom package.json apart kopiëren? → Layer caching! Dependencies worden alleen opnieuw geïnstalleerd als package.json verandert.

### Opdracht 2: Builden en draaien

Build je image en test de container.

```bash
# 1. Build het image
docker build -t dotnovi:v1 .

# 2. Run de container
docker run -d -p 3000:3000 --name dotnovi dotnovi:v1

# 3. Test de applicatie
curl http://localhost:3000
curl http://localhost:3000/health

# 4. Bekijk de logs
docker logs dotnovi

# 5. Kijk rond in de container
docker exec -it dotnovi sh

# 6. Stop en verwijder de container
docker stop dotnovi
docker rm dotnovi
```

**Werkt het niet?** Bekijk de logs, check de poort-mapping.

### Opdracht 3: Database als container

Start een PostgreSQL container en verbind je app ermee.

```bash
# 1. Start een PostgreSQL container
docker run -d --name dotnovi-db \
  -e POSTGRES_USER=dotnovi \
  -e POSTGRES_PASSWORD=devops123 \
  -e POSTGRES_DB=dotnovi \
  -p 5432:5432 \
  postgres:18-alpine

# 2. Herstart de app met DATABASE_URL
docker run -d -p 3000:3000 \
  -e DATABASE_URL=postgresql://dotnovi:devops123@host.docker.internal:5432/dotnovi \
  --name dotnovi dotnovi:v1

# 3. Test of de app de database bereikt
curl http://localhost:3000/health
curl http://localhost:3000/api/notes

# 4. Opruimen
docker stop dotnovi dotnovi-db
docker rm dotnovi dotnovi-db
```

---

## Optioneel / Bonus

De volgende opdrachten zijn extra oefeningen om je kennis te verdiepen.

### Bonus 1: Image Inspection

```bash
# Layers bekijken
docker history dotnovi:v1

# Size controleren
docker images dotnovi:v1

# Detailed info
docker image inspect dotnovi:v1
```

### Bonus 2: Volume Mounting (voor development)

```bash
# Mount local src folder
docker run -it \
  -v $(pwd)/src:/app/src \
  -p 3000:3000 \
  dotnovi:v1

# Wijzig lokale bestanden - zie wijzigingen in container
# (NodeJS auto-reload nodig!)
```

### Bonus 3: Dockerfile Optimalisatie

Pas Dockerfile aan voor kleinere image, snellere builds en betere beveiliging:

```dockerfile
# Optimized version
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine

WORKDIR /app
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

# Copy van build stage
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs src ./src

USER nodejs

EXPOSE 3000
CMD ["node", "src/index.js"]
```

## Docker Commands Reference

```bash
# Images
docker build -t image:tag .          # Build image
docker images                        # List images
docker tag old:tag new:tag           # Tag image
docker rmi image:tag                 # Remove image
docker inspect image:tag             # Image details
docker history image:tag             # Image layers

# Containers
docker run [options] image           # Run container
docker ps                            # List running containers
docker ps -a                         # All containers
docker stop container_id             # Stop container
docker start container_id            # Start container
docker rm container_id               # Remove container
docker logs container_id             # View logs
docker exec container_id command     # Run command in container

# Registry
docker login                         # Login to registry
docker push image:tag                # Push to registry
docker pull image:tag                # Pull from registry
```

## Best Practices

### Dockerfile Optimization

1. **Minimize layers**: Combine RUN commands
   ```dockerfile
   # Bad
   RUN apt-get update
   RUN apt-get install -y curl
   
   # Good
   RUN apt-get update && apt-get install -y curl
   ```

2. **Use .dockerignore**: Exclude unnecessary files
3. **Specific base image tags**: Vermijd `latest`
4. **Non-root user**: Security best practice
5. **Multi-stage builds**: Kleinere final images
6. **Health checks**: Enable container monitoring

### Layer Caching

```dockerfile
# Order matters! Most changing layers last

# Rarely changes
FROM node:20-alpine
WORKDIR /app

# Static files
COPY package*.json ./

# Install (cacheable)
RUN npm ci --only=production

# Code (frequently changes)
COPY src ./src

# Config (might change)
ENV NODE_ENV=production
```

## Volgende Les

In Les 3 gaan we:
- Docker Compose introduceren
- Multi-stage builds & image optimalisatie
- Container registries & scanning

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Hub](https://hub.docker.com/)