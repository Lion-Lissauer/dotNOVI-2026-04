# Les 4: CI/CD met GitHub Actions

## Doelstellingen

In deze les leer je:
- Continuous Integration (CI) basisbegrippen
- GitHub Actions workflow syntax
- Automated testing in CI/CD
- Code quality checks
- Build automation

## Continuous Integration (CI)

CI is de praktijk van het frequent integreren van code changes in een gezamenlijke repository. Elke integratie wordt automatisch getest.

### CI Flow

```
┌──────────────┐
│ Developer    │
│ pushes code  │
└────────┬─────┘
         │
         ▼
┌──────────────────────────┐
│ GitHub detects push      │
│ Trigger workflow         │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ CI Pipeline starts       │
│ 1. Checkout code         │
│ 2. Setup environment     │
│ 3. Install dependencies  │
│ 4. Lint code             │
│ 5. Run tests             │
│ 6. Build artifacts       │
└────────┬─────────────────┘
         │
         ├─── SUCCESS ──► Merge allowed
         │
         └─── FAILURE ──► Block merge, notify dev
```

## GitHub Actions

GitHub Actions is GitHub's native CI/CD platform.

### Key Concepts

- **Workflow**: Automated process gedefinieerd in YAML
- **Job**: Set van steps die op dezelfde runner draaien
- **Step**: Individuele taak in een job
- **Action**: Reusable unit of code
- **Runner**: Server die jobs uitvoert
- **Event**: Trigger voor workflow (push, PR, schedule, etc.)

### Workflow Structure

```yaml
name: Workflow Name

on:                              # Trigger events
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'          # Daily at midnight

jobs:
  job-name:                       # Job definition
    runs-on: ubuntu-latest        # Runner

    steps:
      - name: Step 1              # Step definition
        uses: action@v1           # Reusable action
        with:                      # Input parameters
          param: value

      - name: Step 2
        run: npm test             # Inline command
        env:                       # Environment vars
          NODE_ENV: test
```

## Workflow Components Explained

### Triggers (on:)

```yaml
on:
  # On push to these branches
  push:
    branches: [main, develop, 'feature/**']
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/**'

  # On pull request
  pull_request:
    branches: [main]

  # On schedule (cron)
  schedule:
    - cron: '0 9 * * 1-5'  # Weekdays at 9 AM

  # Manual trigger
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
```

### Jobs & Services

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    
    # Database service
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
```

### Steps

```yaml
steps:
  # Using marketplace actions
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'

  # Running shell commands
  - name: Install dependencies
    run: npm ci

  # Conditional steps
  - name: Deploy
    if: github.ref == 'refs/heads/main'
    run: npm run deploy

  # Matrix strategy
  strategy:
    matrix:
      node-version: [18, 20]
```

## Opdrachten

### Opdracht 1: Setup GitHub Actions

```bash
# 1. Copy workflow file
# Maak een nieuw bestand .github/workflows/ci.yml
# Maak een nieuwe workflow voor je applicatie

# 2. Commit
git add .
git commit -m "ci: add GitHub Actions"
git push

# 3. Check Actions tab in GitHub
# (GitHub web interface)

# 4. Watch workflow run
# - See linting results
# - See test results
# - See coverage
```

### Opdracht 2: Matrix Testing

Modify workflow to test multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 24]

steps:
  - uses: actions/setup-node@v6
    with:
      node-version: ${{ matrix.node-version }}
      cache: 'npm'
  
  - run: npm test
```

### Opdracht 3: Add Code Coverage

```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v6
  with:
    files: ./coverage/lcov.info

# Then add coverage badge to README.md:
# [![codecov](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/user/repo)
```

### Opdracht 4: Conditional Deployment

```yaml
deploy:
  needs: [test, build]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest
  
  steps:
    - name: Deploy to production
      run: echo "Deploying..."
```

### Opdracht 5: Scheduled Workflow

Create nightly security scan:

```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 'lts/*'
      - run: npm audit --audit-level=moderate
```

## Common Actions

```yaml
# Checkout code
- uses: actions/checkout@v4

# Setup programming language
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# Build and push Docker
- uses: docker/build-push-action@v5

# Create release
- uses: softprops/action-gh-release@v1

# Deploy to cloud
- uses: google-github-actions/deploy-gke-workloads@v0

# Slack notification
- uses: slackapi/slack-github-action@v1.24.0

# Status badge
- uses: schneegans/dynamic-badges-action@v1.1.0
```

## Workflow Best Practices

### 1. Clear Names & Structure
```yaml
name: CI - Tests & Builds
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
```

### 2. Use Caching
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Cache node_modules
```

### 3. Fail Fast
```yaml
strategy:
  fail-fast: true  # Stop on first failure
```

### 4. Parallel Jobs
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  build:
    needs: [lint, test]  # Depends on others
    runs-on: ubuntu-latest
```

### 5. Notifications
```yaml
- name: Slack notification
  if: always()  # Even if failed
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

## GitHub Actions Features

### Artifacts
```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: coverage/
```

### Environment Variables
```yaml
env:
  NODE_ENV: test
  DATABASE_URL: postgresql://...

steps:
  - name: Test
    env:
      API_KEY: ${{ secrets.API_KEY }}
    run: npm test
```

### Outputs
```yaml
- name: Get version
  id: version
  run: echo "version=$(npm pkg get version)" >> $GITHUB_OUTPUT

- name: Use output
  run: echo ${{ steps.version.outputs.version }}
```

## Volgende Les

In Les 5 gaan we:
- Continuous Deployment (CD)
- Docker image publishing
- Production deployments

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Marketplace Actions](https://github.com/marketplace?type=actions)
- [Best Practices](https://docs.github.com/en/actions/guides)
