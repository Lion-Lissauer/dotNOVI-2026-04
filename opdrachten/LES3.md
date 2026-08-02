# Les 3: Docker Compose & Optimalisatie

## Doelstellingen

In deze les leer je:
- Docker Compose basisbegrippen
- Multi-container applicaties orchestreren
- Communicatie tussen containers
- Multi-stage Docker builds
- Performance optimalisatie

## Docker Compose

Docker Compose is een tool voor het definiëren en runnen van multi-container Docker applicaties met een YAML file.

### Voordelen

- **Eenvoudig**: Één command om alle containers te starten
- **Reproduceerbaar**: Same setup everywhere
- **Networking**: Automatic service discovery
- **Volumes**: Data persistence
- **Environment**: Centralized configuration

### Architecture

```
┌─────────────────────────────────────┐
│      docker-compose.yml             │
├─────────────────────────────────────┤
│                                     │
│  Services:                          │
│  ├─ app (Node.js)          │   ├──────────┐
│  ├─ postgres (Database)    │   │ Network  │
│  └─ adminer (UI)           │   └──────────┘
│                                     │
│  Networks:                          │
│  └─ dotnovi-network                 │
│                                     │
│  Volumes:                           │
│  ├─ postgres_data                   │
│  └─ app_logs                        │
└─────────────────────────────────────┘
```

## Opdrachten

### Opdracht 1: Multi-stage Build

Herschrijf je Dockerfile als multi-stage build en vergelijk het resultaat.

```bash
# 1. Maak Dockerfile.multistage met twee stages:
#    Stage 1 (builder): npm ci met alle dependencies
#    Stage 2 (production): kopieer alleen wat nodig is

# 2. Build single-stage (huidige Dockerfile)
docker build -t dotnovi:single -f Dockerfile .

# 3. Build multi-stage
docker build -t dotnovi:multi -f Dockerfile.multistage .

# 4. Vergelijk image sizes
docker images | grep dotnovi

# 5. Vergelijk layers
docker history dotnovi:single
docker history dotnovi:multi
```

**Vraag:** Hoeveel MB ben je kwijtgeraakt?

### Opdracht 2: Docker Compose

Zet de volledige stack op met Docker Compose: backend + database.

```bash
# 1. Maak docker-compose.yml met twee services:
#    - app: build from Dockerfile, poort 3000
#    - postgres: postgres:18-alpine met credentials

# 2. Voeg een volume toe voor database persistentie

# 3. Start alle services
docker compose up -d

# 4. Check status
docker compose ps
docker compose logs app

# 5. Test de hele stack
curl http://localhost:3000/health
curl http://localhost:3000/api/notes

# 6. Maak een note aan
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Compose test","content":"Het werkt!"}'

# 7. Opruimen
docker compose down -v
```

### Opdracht 3: Registry & Scanning

Push je image naar GitHub Container Registry en voer een security scan uit.

```bash
# 1. Tag je image voor GHCR
docker tag dotnovi:multi ghcr.io/<jouw-username>/dotnovi:v1

# 2. Login bij GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <jouw-username> --password-stdin

# 3. Push naar GHCR
docker push ghcr.io/<jouw-username>/dotnovi:v1

# 4. Controleer op GitHub: ga naar je repo → Packages tab

# 5. Draai een Trivy security scan
docker run aquasec/trivy image dotnovi:v1

# 6. Bekijk de resultaten: zijn er CRITICAL of HIGH issues?
```

---

## Optioneel / Bonus

De volgende opdrachten zijn extra oefeningen om je kennis te verdiepen.

### Bonus 1: Service Scaling

```bash
# Start met 3 app instances (als je load balancer toevoegt)
docker compose up -d --scale app=3

# View all containers
docker compose ps

# Scale down
docker compose up -d --scale app=1
```

### Bonus 2: Environment Variabelen

```bash
# Create .env file
cat > .env << 'EOF'
DB_PASSWORD=mijn_veilig_wachtwoord
NODE_ENV=production
PORT=3000
EOF

# Start met environment vars
docker compose up -d

# Check vars in container
docker compose exec app env | grep DATABASE_URL

# Cleanup
rm .env
```

### Bonus 3: Persistence Testing

```bash
# Start app
docker compose up -d

# Create some notes
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Persistent","content":"Will survive"}'

# Stop everything
docker compose down

# Start again
docker compose up -d

# Check notes are still there
curl http://localhost:3000/api/notes

# Dit werkt omdat het postgres_data volume persistent is!
```

## Docker Compose Commands

```bash
# Lifecycle
docker compose up                    # Start services
docker compose up -d                 # Start in background
docker compose down                  # Stop and remove
docker compose restart               # Restart services
docker compose pause                 # Pause services
docker compose unpause               # Unpause services

# Information
docker compose ps                    # List containers
docker compose logs [service]        # View logs
docker compose top [service]         # Running processes
docker compose config                # Validate/view config

# Execution
docker compose exec service cmd      # Run command
docker compose run service cmd       # Run one-off command

# Building
docker compose build                 # Build images
docker compose build --no-cache      # Force rebuild
docker compose pull                  # Pull external images

# Cleanup
docker compose rm                    # Remove stopped containers
docker compose down -v               # Remove volumes too
docker compose down --rmi all        # Remove images too
```

## Performance Tips

### Build Optimization

1. **Layer Caching**: Order matters!
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./      # Cache this
   RUN npm ci
   COPY src ./src             # Cache separately
   ```

2. **Minimize Dependencies**
   ```dockerfile
   RUN npm ci --only=production  # No dev deps
   ```

3. **Use Alpine**: Smaller base images
   ```dockerfile
   FROM node:20-alpine  # 170MB
   # vs
   FROM node:20        # 911MB
   ```

### Runtime Optimization

1. **Resource Limits**
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
           reservations:
             cpus: '0.5'
             memory: 256M
   ```

2. **Healthchecks**: Enable container monitoring
3. **Restart Policies**: Auto-recovery

## Volgende Les

In Les 4 gaan we:
- GitHub Actions introduceren
- Continuous Integration pipelines
- Automated testing en building

## Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
