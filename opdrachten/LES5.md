# Les 5: Continuous Deployment & Release Management

## Doelstellingen

In deze les leer je:
- Continuous Deployment (CD) basisbegrippen
- Docker image publishing
- Automated deployments
- Rollback strategies
- Dependency management

## CI/CD Pipeline Overview

```
Source Code (Git)
        │
        ▼
Continuous Integration (Les 4)
├─ Lint
├─ Test
├─ Build
└─ Security Scan
        │
        ▼
Continuous Deployment (Les 5)
├─ Build Docker Image
├─ Push to Registry
├─ Run Smoke Tests
└─ Deploy to Production
        │
        ▼
Continuous Monitoring (Les 8)
├─ Health Checks
├─ Performance Metrics
└─ Error Tracking
        │
        ▼
       Users
```

## Continuous Deployment (CD)

CD automatiseert het deployen van code die de CI stage heeft gepasseerd naar production.

### Push vs Pull Deployment

```
PUSH Model:
┌──────────────┐
│ CI/CD Server │ ─SSH/API─► Production Server
│ (GitHub)     │           (Deploy application)
└──────────────┘

PULL Model:
┌──────────────┐        ┌────────────────┐
│ Production   │ ◄─Poll─│ CI/CD Server   │
│ Server       │        │ (Check updates)│
│ (Deploy app) │        └────────────────┘
└──────────────┘
```

## Docker Image Publishing

### Container Registries

```
Docker Hub (public)
  ├─ Free tier: 1 private repo
  └─ Paid: Unlimited repos

GitHub Container Registry (GHCR)
  ├─ Free: Public + Private
  └─ Integrated with GitHub

Azure Container Registry (ACR)
  └─ Microsoft Azure

Amazon ECR
  └─ AWS

Artifactory
  └─ Enterprise
```

### Publishing Flow

```dockerfile
# 1. Tag image
docker tag dotnovi:latest ghcr.io/username/dotnovi:latest

# 2. Login to registry
docker login ghcr.io

# 3. Push image
docker push ghcr.io/username/dotnovi:latest

# 4. Others can pull
docker pull ghcr.io/username/dotnovi:latest
```

## GitHub Actions CD Workflows

### Workflow 1: cd.yml - Build & Push

Triggers on main branch push:
1. Build Docker image
2. Login to GHCR
3. Push image with tags
4. Run vulnerability scan
5. Trigger deployment workflow

### Workflow 2: deploy-production.yml - Deploy

Triggered by repository_dispatch or manual workflow_dispatch:
1. Pull image from registry
2. Deploy to production
3. Run smoke tests
4. Notify via Slack
5. Rollback on failure

### Workflow 3: dependabot.yml - Dependency Updates

Automatically:
1. Check for dependency updates
2. Create pull requests
3. Run CI tests
4. Auto-merge if tests pass (optional)

## Setup CD

### Stap 1: Setup GHCR Access

```bash
# Create Personal Access Token (PAT)
# GitHub Settings → Developer Settings → Personal Access Tokens
# Scopes needed: read:packages, write:packages, delete:packages

# Export token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Login locally
echo $GITHUB_TOKEN | docker login ghcr.io -u username --password-stdin

# Verify
docker pull ghcr.io/username/dotnovi:latest
```

### Stap 2: Setup GitHub Secrets

```
Repository Settings → Secrets and variables → Actions

Secrets to add:
- SLACK_WEBHOOK (optional, for notifications)
- DATABASE_URL_PROD (for production)
```

### Stap 3: Copy Workflows

```bash
https://gist.github.com/erikkasimier/87be7004dfa7ceacf9814d9d6136a082
https://gist.github.com/erikkasimier/bea74a6028fcbca026db9768294569b4
https://gist.github.com/erikkasimier/7cdb4e7c03a14619e2d74ca08b5e6127

git add .
git commit -m "ci/cd: add deployment workflows"
git push origin main
```

### Stap 4: Monitor Workflow

1. Go to Actions tab
2. Click on "Continuous Deployment"
3. Wait for workflow to complete
4. Check image in GHCR:
   ```
   https://github.com/username/dotnovi-app/pkgs/container/dotnovi-app
   ```

### Stap 5: Manual Deployment

```bash
# Go to Actions → Deploy to Production
# Click "Run workflow"
# Input image tag: ghcr.io/username/dotnovi:latest
# Click "Run workflow"
```

## Deployment Strategies

### 1. Blue-Green Deployment

```
Current (Blue)
┌─────────────────┐
│  Production v1  │ ◄── Traffic
│  (Running)      │
└─────────────────┘

New (Green)
┌─────────────────┐
│  Production v2  │
│  (Deployed)     │
└─────────────────┘
        │
        ▼
  Test & Validate
        │
        ▼ If OK
   Switch Traffic
        │
        ▼
┌─────────────────┐
│  Production v2  │ ◄── Traffic
│  (Now live)     │
└─────────────────┘
```

### 2. Canary Deployment

```
┌──────────────┐
│  Production  │
├──────────────┤
│ 95% v1       │
│  5% v2 (new) │
└──────────────┘
        │
   Monitor metrics
        │
   If v2 OK:
        │
        ▼
┌──────────────┐
│  Production  │
├──────────────┤
│ 50% v1       │
│ 50% v2       │
└──────────────┘
```

### 3. Rolling Deployment

```
Pod 1: v1 → v2
    ↓
Pod 2: v1 → v2
    ↓
Pod 3: v1 → v2
    ↓
Pod 4: v1 → v2

Zero downtime
Gradual rollout
Easy rollback
```

## Opdrachten

### Opdracht 1: Manual Docker Push

```bash
# Build image locally
docker build -t dotnovi:dev .

# Tag with registry
docker tag dotnovi:dev ghcr.io/username/dotnovi:dev

# Login (if not already)
docker login ghcr.io -u username

# Push
docker push ghcr.io/username/dotnovi:dev

# Verify in GHCR
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user/packages
```

### Opdracht 2: Semantic Versioning

Implement semantic versioning tags:

```yaml
- name: Get version from package.json
  id: version
  run: echo "version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

- name: Push with version tags
  with:
    tags: |
      ghcr.io/${{ github.repository }}:v${{ steps.version.outputs.version }}
      ghcr.io/${{ github.repository }}:latest
```

### Opdracht 3: Blue-Green Deployment

Implement in your deployment script:

```bash
# 1. Deploy to green environment
docker run -d --name dotnovi-green ...

# 2. Run smoke tests
if curl -f http://localhost:3001/health; then
  # 3. Switch load balancer
  # 4. Stop blue environment
  docker stop dotnovi-blue
else
  # Rollback
  docker stop dotnovi-green
fi
```

### Opdracht 4: Rollback Strategy

Implement automatic rollback:

```yaml
- name: Deploy
  id: deploy
  run: ./deploy.sh
  continue-on-error: true

- name: Smoke tests
  run: ./smoke-tests.sh
  if: steps.deploy.outcome == 'success'

- name: Rollback on failure
  if: failure()
  run: ./rollback.sh
```

### Opdracht 5: Deploy naar Render.com

Deploy je applicatie naar Render.com vanuit je CI/CD pipeline.

```bash
# 1. Maak een account op https://render.com (gratis tier)

# 2. Maak een nieuwe "Web Service":
#    - Koppel je GitHub repo, of kies "Deploy an existing image from a registry"
#    - Als je GHCR gebruikt: image = ghcr.io/<username>/dotnovi-app:latest
#    - Environment: voeg DATABASE_URL toe (Render kan ook een PostgreSQL database aanmaken)
#    - Port: 3000

# 3. Optie A: Automatisch via GitHub integratie
#    Render detecteert pushes naar main en deployt automatisch

# 4. Optie B: Deploy hook vanuit GitHub Actions
#    Ga naar Render Dashboard → je service → Settings → Deploy Hook
#    Kopieer de hook URL
```

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        default: 'production'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"

      - name: Wait for deployment
        run: sleep 30

      - name: Smoke test
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://jouw-app.onrender.com/health)
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi
          echo "Deploy successful!"
```

```bash
# 5. Voeg secret toe aan GitHub:
#    Repository → Settings → Secrets → RENDER_DEPLOY_HOOK

# 6. Test de hele flow:
#    Push code → CI (lint + test) → Docker build → Deploy naar Render → Health check
```

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass (green CI)
- [ ] Code reviewed and approved
- [ ] Security scan passed
- [ ] Performance tests OK
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring alerts configured
- [ ] Backup taken
- [ ] Maintenance window (if needed) scheduled

## Dependency Management with Dependabot

### Setup

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Auto-merge

```yaml
# .github/workflows/auto-merge-dependabot.yml
on: pull_request

jobs:
  auto-merge:
    if: dependabot.author
    runs-on: ubuntu-latest
    steps:
      - name: Enable auto-merge
        run: |
          gh pr merge --auto --squash "${{ github.event.pull_request.number }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Monitoring Deployments

```bash
# Check deployment status
kubectl rollout status deployment/dotnovi

# View recent deployments
kubectl rollout history deployment/dotnovi

# Rollback to previous
kubectl rollout undo deployment/dotnovi

# View pod logs
kubectl logs deployment/dotnovi
```

## Volgende Les

In Les 6 gaan we:
- Kubernetes introduceren
- Container orchestration
- Production deployments op K8s

## Resources

- [GitHub Deployments](https://docs.github.com/en/rest/deployments)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Deployment Strategies](https://www.openshift.com/blog/blue-green-deployment-on-openshift)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
