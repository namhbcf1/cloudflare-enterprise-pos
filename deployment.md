# 🚀 Deployment Guide - Enterprise POS System

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Monitoring Setup](#monitoring-setup)
8. [SSL Configuration](#ssl-configuration)
9. [Backup & Recovery](#backup--recovery)
10. [Performance Optimization](#performance-optimization)

## 🔧 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or CentOS 8
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 100GB SSD minimum
- **Network**: Stable internet connection

### Software Dependencies
- **Node.js**: 18.x LTS
- **Python**: 3.9+
- **PostgreSQL**: 13+
- **Redis**: 6+
- **Nginx**: 1.18+
- **Docker**: 20.10+ (optional)
- **Docker Compose**: 2.0+ (optional)

## 🌍 Environment Setup

### 1. System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Install Python
```bash
sudo apt install -y python3 python3-pip python3-venv
```

### 4. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5. Install Redis
```bash
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 6. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🗄️ Database Configuration

### 1. PostgreSQL Setup
```bash
sudo -u postgres psql
CREATE DATABASE enterprise_pos;
CREATE USER pos_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE enterprise_pos TO pos_user;
\q
```

### 2. Redis Configuration
```bash
sudo nano /etc/redis/redis.conf
# Uncomment and set:
# requirepass your_redis_password
sudo systemctl restart redis
```

## 🏗️ Production Deployment

### 1. Clone Repository
```bash
git clone https://github.com/your-org/enterprise-pos-system.git
cd enterprise-pos-system
```

### 2. Environment Configuration
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-services/.env.example ai-services/.env

# Edit configuration files
nano .env
nano backend/.env
nano frontend/.env
nano ai-services/.env
```

### 3. Install Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
npm run build
cd ..

# AI Services dependencies
cd ai-services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 4. Database Migration
```bash
cd backend
npm run migrate
npm run seed
cd ..
```

### 5. Start Services
```bash
# Using PM2 for process management
npm install -g pm2

# Start backend
cd backend
pm2 start ecosystem.config.js
cd ..

# Start AI services
cd ai-services
source venv/bin/activate
pm2 start main.py --name ai-services --interpreter python3
cd ..

# Start analytics
cd analytics
pm2 start server.js --name analytics
cd ..
```

## 🐳 Docker Deployment

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/2.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Deploy with Docker Compose
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

### 1. Install kubectl
```bash
curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
```

### 2. Deploy to Kubernetes
```bash
# Apply configurations
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods
kubectl get services
```

## 📊 Monitoring Setup

### 1. Prometheus Configuration
```bash
# Start Prometheus
docker run -d --name prometheus -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus/config.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 2. Grafana Setup
```bash
# Start Grafana
docker run -d --name grafana -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana
```

### 3. ELK Stack
```bash
# Start Elasticsearch
docker run -d --name elasticsearch -p 9200:9200 \
  -e "discovery.type=single-node" \
  docker.elastic.co/elasticsearch/elasticsearch:8.8.0

# Start Kibana
docker run -d --name kibana -p 5601:5601 \
  -e "ELASTICSEARCH_HOSTS=http://elasticsearch:9200" \
  docker.elastic.co/kibana/kibana:8.8.0
```

## 🔐 SSL Configuration

### 1. Obtain SSL Certificate
```bash
# Using Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 💾 Backup & Recovery

### 1. Database Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U pos_user enterprise_pos > backup_${DATE}.sql
gzip backup_${DATE}.sql
EOF

chmod +x backup.sh
```

### 2. Automated Backups
```bash
# Add to crontab
crontab -e
# Add line: 0 2 * * * /path/to/backup.sh
```

### 3. Recovery Process
```bash
# Restore from backup
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
psql -h localhost -U pos_user enterprise_pos < backup_YYYYMMDD_HHMMSS.sql
```

## ⚡ Performance Optimization

### 1. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. PostgreSQL Tuning
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
```

### 3. Redis Configuration
```bash
# redis.conf optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🚨 Health Checks

### 1. Service Health Check
```bash
#!/bin/bash
# health-check.sh
services=("backend" "frontend" "ai-services" "analytics")

for service in "${services[@]}"; do
    if pm2 show $service | grep -q "online"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is down"
        pm2 restart $service
    fi
done
```

### 2. Database Health Check
```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432 -U pos_user

# Check Redis
redis-cli ping
```

### 3. Monitoring Alerts
```yaml
# prometheus/alerts.yml
groups:
- name: pos-system
  rules:
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
```

## 📈 Scaling Considerations

### 1. Load Balancing
```nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

### 2. Database Scaling
- **Read Replicas**: Set up PostgreSQL read replicas
- **Connection Pooling**: Use PgBouncer for connection management
- **Partitioning**: Implement table partitioning for large datasets

### 3. Redis Clustering
```bash
# Redis Cluster setup
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 --cluster-replicas 1
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to server
      run: |
        ssh user@server 'cd /path/to/app && git pull && ./scripts/deploy.sh'
```

### 2. Blue-Green Deployment
```bash
# deploy.sh
#!/bin/bash
# Switch between blue and green deployments
if [ -f "blue.lock" ]; then
    echo "Deploying to green environment"
    # Deploy to green
    rm blue.lock
    touch green.lock
else
    echo "Deploying to blue environment"
    # Deploy to blue
    rm green.lock
    touch blue.lock
fi
```

## 📞 Support & Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports are already in use
2. **Permission errors**: Ensure proper file permissions
3. **Database connection**: Verify database credentials
4. **Memory issues**: Monitor resource usage

### Log Files
- **Backend**: `backend/logs/`
- **Frontend**: Browser console
- **AI Services**: `ai-services/logs/`
- **System**: `/var/log/`

### Support Channels
- **Email**: support@yourcompany.com
- **Documentation**: [Link to docs]
- **Issue Tracker**: [GitHub Issues]

---

For more detailed information, refer to the individual service documentation in the `docs/` directory. 