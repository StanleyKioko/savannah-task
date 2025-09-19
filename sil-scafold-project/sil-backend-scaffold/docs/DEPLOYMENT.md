# Deployment Guide

This guide covers different deployment strategies for the SIL E-commerce Backend.

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (for K8s deployment)
- Helm 3.x (for K8s deployment)
- Access to container registry
- Domain name and SSL certificates (for production)

## Environment Configuration

### Environment Variables

Create appropriate environment files for each deployment environment:

**Development (.env.development):**
```bash
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
SECRET_KEY=development-secret-key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Staging (.env.staging):**
```bash
DEBUG=False
DATABASE_URL=postgresql://user:password@staging-db:5432/sil_staging
REDIS_URL=redis://staging-redis:6379/0
ALLOWED_HOSTS=api-staging.yourdomain.com
SECRET_KEY=staging-secret-key
CORS_ALLOWED_ORIGINS=https://staging.yourdomain.com
```

**Production (.env.production):**
```bash
DEBUG=False
DATABASE_URL=postgresql://user:password@prod-db:5432/sil_production
REDIS_URL=redis://prod-redis:6379/0
ALLOWED_HOSTS=api.yourdomain.com
SECRET_KEY=super-secure-production-key
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

## Docker Deployment

### Single Container

**Build the image:**
```bash
docker build -t sil-backend:latest .
```

**Run with environment variables:**
```bash
docker run -d \
  --name sil-backend \
  --env-file .env.production \
  -p 8000:8000 \
  sil-backend:latest
```

### Docker Compose (Recommended)

**Production docker-compose.yml:**
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://sil_user:${DB_PASSWORD}@db:5432/sil_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - media_files:/app/media
      - static_files:/app/staticfiles
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=sil_db
      - POSTGRES_USER=sil_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  celery:
    build: .
    command: celery -A sil_project worker -l info
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://sil_user:${DB_PASSWORD}@db:5432/sil_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - static_files:/var/www/static
      - media_files:/var/www/media
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  media_files:
  static_files:
```

**Deploy:**
```bash
# Set database password
export DB_PASSWORD=secure-password

# Deploy
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Collect static files
docker-compose exec web python manage.py collectstatic --noinput

# Create superuser
docker-compose exec web python manage.py createsuperuser
```

## Kubernetes Deployment

### Prerequisites

**Install required tools:**
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Namespace Setup

```bash
# Create namespace
kubectl create namespace sil-backend

# Set as default namespace
kubectl config set-context --current --namespace=sil-backend
```

### Secrets Management

**Create secrets:**
```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=sil_user \
  --from-literal=password=secure-db-password

# Application secrets
kubectl create secret generic app-secrets \
  --from-literal=secret-key=super-secure-django-key \
  --from-literal=at-username=africas-talking-username \
  --from-literal=at-api-key=africas-talking-api-key

# Email credentials
kubectl create secret generic email-credentials \
  --from-literal=host=smtp.gmail.com \
  --from-literal=username=your-email@gmail.com \
  --from-literal=password=app-password
```

### ConfigMap

**Create configmap.yaml:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DEBUG: "False"
  ALLOWED_HOSTS: "api.yourdomain.com"
  CORS_ALLOWED_ORIGINS: "https://yourdomain.com"
  DATABASE_HOST: "postgresql-service"
  DATABASE_NAME: "sil_db"
  REDIS_URL: "redis://redis-service:6379/0"
```

```bash
kubectl apply -f configmap.yaml
```

### Database Deployment

**postgresql.yaml:**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  serviceName: postgresql-service
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: sil_db
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgresql-service
spec:
  selector:
    app: postgresql
  ports:
  - port: 5432
    targetPort: 5432
```

### Redis Deployment

**redis.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### Application Deployment

**app.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sil-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sil-backend
  template:
    metadata:
      labels:
        app: sil-backend
    spec:
      containers:
      - name: sil-backend
        image: your-registry/sil-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: secret-key
        - name: DATABASE_URL
          value: "postgresql://$(DB_USER):$(DB_PASSWORD)@postgresql-service:5432/$(DB_NAME)"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: DB_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DATABASE_NAME
        envFrom:
        - configMapRef:
            name: app-config
        livenessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: sil-backend-service
spec:
  selector:
    app: sil-backend
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

### Celery Worker Deployment

**celery.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: celery-worker
        image: your-registry/sil-backend:latest
        command: ["celery", "-A", "sil_project", "worker", "-l", "info"]
        env:
        - name: DATABASE_URL
          value: "postgresql://$(DB_USER):$(DB_PASSWORD)@postgresql-service:5432/$(DB_NAME)"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: DB_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DATABASE_NAME
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
```

### Ingress Configuration

**ingress.yaml:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sil-backend-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: sil-backend-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sil-backend-service
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Deploy infrastructure
kubectl apply -f postgresql.yaml
kubectl apply -f redis.yaml

# Wait for database to be ready
kubectl wait --for=condition=available --timeout=300s statefulset/postgresql

# Deploy application
kubectl apply -f app.yaml
kubectl apply -f celery.yaml
kubectl apply -f ingress.yaml

# Run migrations (one-time job)
kubectl run migration --image=your-registry/sil-backend:latest \
  --restart=Never \
  --rm -i --tty \
  --env="DATABASE_URL=postgresql://sil_user:password@postgresql-service:5432/sil_db" \
  -- python manage.py migrate

# Create superuser
kubectl run create-superuser --image=your-registry/sil-backend:latest \
  --restart=Never \
  --rm -i --tty \
  --env="DATABASE_URL=postgresql://sil_user:password@postgresql-service:5432/sil_db" \
  -- python manage.py createsuperuser
```

## Monitoring and Logging

### Health Checks

The application provides health check endpoints:
```bash
# Check application health
curl http://your-domain/health/

# Check database connectivity
curl http://your-domain/health/db/

# Check Redis connectivity
curl http://your-domain/health/redis/
```

### Logging Configuration

**For production, configure centralized logging:**

**Fluent Bit configuration:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [INPUT]
        Name tail
        Path /var/log/containers/*sil-backend*.log
        Parser docker
        Tag kube.*
    
    [OUTPUT]
        Name es
        Match kube.*
        Host elasticsearch
        Port 9200
        Index kubernetes-logs
```

### Monitoring with Prometheus

**ServiceMonitor for Prometheus:**
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: sil-backend-monitor
spec:
  selector:
    matchLabels:
      app: sil-backend
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

## Backup and Recovery

### Database Backup

**Automated backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
kubectl exec statefulset/postgresql -- pg_dump -U sil_user sil_db > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/database/
```

**Restore from backup:**
```bash
# Download backup
aws s3 cp s3://your-backup-bucket/database/backup_20240101_120000.sql .

# Restore
kubectl exec -i statefulset/postgresql -- psql -U sil_user sil_db < backup_20240101_120000.sql
```

### Media Files Backup

```bash
# Backup media files
kubectl exec deployment/sil-backend -- tar -czf - /app/media | aws s3 cp - s3://your-backup-bucket/media/media_backup_$(date +%Y%m%d).tar.gz

# Restore media files
aws s3 cp s3://your-backup-bucket/media/media_backup_20240101.tar.gz - | kubectl exec -i deployment/sil-backend -- tar -xzf - -C /app/
```

## SSL/TLS Configuration

### Let's Encrypt with cert-manager

**Install cert-manager:**
```bash
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.12.0/cert-manager.yaml
```

**ClusterIssuer:**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

## Performance Optimization

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sil-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sil-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Troubleshooting

### Common Issues

**Pod not starting:**
```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

**Database connection issues:**
```bash
# Test database connectivity
kubectl run test-db --image=postgres:15 --rm -i --tty -- psql -h postgresql-service -U sil_user -d sil_db

# Check database service
kubectl get svc postgresql-service
```

**Performance issues:**
```bash
# Check resource usage
kubectl top pods
kubectl top nodes

# Check HPA status
kubectl get hpa
```

## Security Considerations

### Network Policies

**Restrict database access:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgresql-netpol
spec:
  podSelector:
    matchLabels:
      app: postgresql
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: sil-backend
    - podSelector:
        matchLabels:
          app: celery-worker
    ports:
    - protocol: TCP
      port: 5432
```

### Pod Security Standards

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sil-backend
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
  - name: sil-backend
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
      readOnlyRootFilesystem: true
```

### Secret Management

Use external secret management tools like:
- Kubernetes External Secrets Operator
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

**Example with External Secrets Operator:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "sil-backend"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: secret-key
    remoteRef:
      key: sil-backend
      property: django-secret-key
```

This deployment guide provides comprehensive instructions for deploying the SIL E-commerce Backend in various environments with proper monitoring, security, and backup procedures.