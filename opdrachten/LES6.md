# Les 6: Kubernetes Orchestration

## Doelstellingen

In deze les leer je:
- Kubernetes basisbegrippen
- Container orchestration
- Deployment op Kubernetes
- Scaling en self-healing
- Service discovery

## Wat is Kubernetes?

Kubernetes is een open-source container orchestration platform die automatiseert:
- **Deployment**: Plaats containers waar ze nodig zijn
- **Scaling**: Voeg replicas toe op basis van demand
- **Self-healing**: Herstart gefaalde containers
- **Updates**: Rolling updates zonder downtime
- **Networking**: Service discovery en load balancing

### Kubernetes Architecture

```
┌─────────────────────────────────────────────┐
│          Kubernetes Cluster                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │       Control Plane (Master)         │  │
│  ├──────────────────────────────────────┤  │
│  │ - API Server                         │  │
│  │ - Scheduler                          │  │
│  │ - Controller Manager                 │  │
│  │ - etcd (database)                    │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Worker  │  │  Worker  │  │  Worker  │  │
│  │  Node 1  │  │  Node 2  │  │  Node 3  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

## Key Kubernetes Objects

### Pod
De kleinste deployable eenheid. Bevat een of meer containers.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dotnovi-pod
spec:
  containers:
    - name: app
      image: dotnovi:latest
      ports:
        - containerPort: 3000
```

### Deployment
Beheert replicas en updates van Pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dotnovi
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          image: dotnovi:latest
```

### Service
Exposeert Pods via network.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: dotnovi
spec:
  type: LoadBalancer
  selector:
    app: dotnovi
  ports:
    - port: 80
      targetPort: 3000
```

### ConfigMap & Secret
Beheer configuratie en sensitive data.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DATABASE_URL: ...  # base64 encoded
```

## Kubernetes Commands

```bash
# Cluster info
kubectl version                          # K8s version
kubectl cluster-info                     # Cluster details
kubectl get nodes                        # List nodes
kubectl describe node node-name          # Node details

# Deployments
kubectl create deployment dotnovi --image=dotnovi:latest
kubectl get deployments                  # List deployments
kubectl describe deployment dotnovi      # Deployment details
kubectl logs deployment/dotnovi          # View logs
kubectl exec deployment/dotnovi -- cmd   # Run command

# Pods
kubectl get pods                         # List pods
kubectl get pods -o wide                 # Detailed list
kubectl describe pod pod-name            # Pod details
kubectl logs pod-name                    # View logs
kubectl port-forward pod-name 3000:3000 # Forward port

# Services
kubectl get svc                          # List services
kubectl expose deployment dotnovi --type=LoadBalancer --port=80 --target-port=3000

# Apply manifests
kubectl apply -f deployment.yaml         # Create/update
kubectl delete -f deployment.yaml        # Delete
kubectl rollout status deployment/dotnovi

# Scaling
kubectl scale deployment dotnovi --replicas=5
kubectl autoscale deployment dotnovi --min=3 --max=10

# Updates
kubectl set image deployment/dotnovi app=dotnovi:v2 --record
kubectl rollout history deployment/dotnovi
kubectl rollout undo deployment/dotnovi
```

## Handen-on: Deploy op Minikube

### Stap 1: Installeer Minikube

```bash
# macOS
brew install minikube

# Linux
curl -LO https://github.com/kubernetes/minikube/releases/download/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Windows
choco install minikube
```

### Stap 2: Start Minikube Cluster

```bash
# Start
minikube start --cpus=4 --memory=4096

# Verify
minikube status
kubectl cluster-info
kubectl get nodes
```

### Stap 3: Build & Load Image

```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build image
docker build -t dotnovi:latest .

# Image is ready in Minikube!
```

### Stap 4: Deploy Application

```bash
# Create namespace
kubectl create namespace dotnovi

# Deploy (or use manifest)
kubectl apply -f k8s/service.yaml -n dotnovi
kubectl apply -f k8s/deployment.yaml -n dotnovi

# Verify
kubectl get pods -n dotnovi
kubectl get svc -n dotnovi
```

### Stap 5: Access Application

```bash
# Get service IP
minikube service dotnovi -n dotnovi

# Or port-forward
kubectl port-forward svc/dotnovi 3000:80 -n dotnovi

# Test
curl http://localhost:3000
curl http://localhost:3000/health
```

### Stap 6: View Logs & Debug

```bash
# View logs
kubectl logs -f deployment/dotnovi -n dotnovi

# Describe resources
kubectl describe pod pod-name -n dotnovi

# Exec into pod
kubectl exec -it pod-name -n dotnovi -- sh

# Port-forward for testing
kubectl port-forward svc/dotnovi 3000:80 -n dotnovi
```

## Opdrachten

### Opdracht 1: Basic Deployment

```bash
# 1. Start Minikube
minikube start

# 2. Build image
eval $(minikube docker-env)
docker build -t dotnovi:latest .

# 3. Create simple deployment
kubectl create deployment dotnovi --image=dotnovi:latest
kubectl expose deployment dotnovi --type=LoadBalancer --port=3000

# 4. Verify
kubectl get pods
kubectl get svc

# 5. Test
minikube service dotnovi
curl http://service-ip:3000
```

### Opdracht 2: Apply Manifests

```bash
# 1. Create namespace
kubectl create namespace dotnovi

# 2. Apply manifests
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/deployment.yaml

# 3. Verify
kubectl get all -n dotnovi
kubectl get pods -n dotnovi -o wide

# 4. Check logs
kubectl logs deployment/dotnovi -n dotnovi
```

### Opdracht 3: Scaling

```bash
# 1. Current replicas
kubectl get deployment dotnovi -n dotnovi

# 2. Manual scale
kubectl scale deployment dotnovi --replicas=5 -n dotnovi

# 3. Verify all pods running
kubectl get pods -n dotnovi

# 4. Scale back down
kubectl scale deployment dotnovi --replicas=3 -n dotnovi

# 5. Watch scaling
kubectl get pods -n dotnovi -w
```

### Opdracht 4: Rolling Update

```bash
# 1. Simulate new version
docker build -t dotnovi:v2 .

# 2. Update deployment
kubectl set image deployment/dotnovi app=dotnovi:v2 --record -n dotnovi

# 3. Watch rollout
kubectl rollout status deployment/dotnovi -n dotnovi

# 4. View history
kubectl rollout history deployment/dotnovi -n dotnovi

# 5. Rollback if needed
kubectl rollout undo deployment/dotnovi -n dotnovi
```

### Opdracht 5: Debugging

```bash
# 1. Get pod details
kubectl describe pod pod-name -n dotnovi

# 2. View logs
kubectl logs pod-name -n dotnovi

# 3. Previous logs (if crashed)
kubectl logs pod-name --previous -n dotnovi

# 4. Exec into pod
kubectl exec -it pod-name -n dotnovi -- sh

# 5. Port-forward for testing
kubectl port-forward pod-name 3000:3000 -n dotnovi
```

## Manifest Files Explained

### deployment.yaml

- **Replicas**: Aantal pod kopieën
- **Strategy**: RollingUpdate voor zero-downtime
- **Probes**: Health checks (liveness, readiness, startup)
- **Resources**: CPU/memory requests & limits
- **Affinity**: Pod scheduling preferences
- **HPA**: Horizontal Pod Autoscaler

### service.yaml

- **ConfigMap**: Niet-gevoelige configuratie
- **Secret**: Gevoelige data (geëncrypt)
- **Service**: Network access (ClusterIP, LoadBalancer)
- **Ingress**: HTTP routing
- **NetworkPolicy**: Firewall rules
- **PodDisruptionBudget**: Beschikbaarheid garantie

## Best Practices

### 1. Resource Management
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 2. Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 3. Security
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  allowPrivilegeEscalation: false
```

### 4. High Availability
```yaml
replicas: 3  # Multiple instances
affinity:
  podAntiAffinity:  # Spread across nodes
    preferredDuringSchedulingIgnoredDuringExecution: ...
```

## Volgende Les

In Les 7 gaan we:
- Infrastructure as Code met Terraform
- HCL syntax en Terraform workflow
- IaC toepassen op minikube

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [YAML Reference](https://kubernetes.io/docs/reference/generated-kubernetes-api/v1.24/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/)
