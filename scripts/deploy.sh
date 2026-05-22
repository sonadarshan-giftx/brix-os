#!/bin/bash
# Brixstac Microservices — Server Bootstrap + Deploy
# Run on fresh Ubuntu 22.04 EC2 after code is uploaded to /opt/brixstac
set -e

APP_DIR="/opt/brixstac"
DOMAIN="brixstac.com"

echo "============================================"
echo "  Brixstac Microservices Deploy"
echo "============================================"

# ── System update ─────────────────────────────────────────────
echo "[1/6] Updating system..."
sudo apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# ── Install Docker ────────────────────────────────────────────
echo "[2/6] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker ubuntu
    sudo systemctl enable docker
    sudo systemctl start docker
    newgrp docker
fi
sudo apt-get install -y docker-compose-plugin

# ── Install certbot ───────────────────────────────────────────
echo "[3/6] Installing Certbot..."
sudo apt-get install -y certbot

# ── Set up app directory ──────────────────────────────────────
echo "[4/6] Preparing app directory..."
sudo mkdir -p $APP_DIR
sudo chown ubuntu:ubuntu $APP_DIR

# ── Generate secrets ──────────────────────────────────────────
echo "[5/6] Generating secrets..."
cd $APP_DIR
if grep -q "REPLACE_" .env; then
    DB_PASS=$(openssl rand -base64 32 | tr -d '\n/+=' | cut -c1-32)
    JWT_SEC=$(openssl rand -base64 64 | tr -d '\n')
    JWT_REF=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|REPLACE_DB_PASSWORD|$DB_PASS|g" .env
    sed -i "s|REPLACE_JWT_SECRET|$JWT_SEC|g" .env
    sed -i "s|REPLACE_JWT_REFRESH_SECRET|$JWT_REF|g" .env
    echo "  Secrets generated."
fi

# ── Build and start all services ──────────────────────────────
echo "[6/6] Building all 8 containers (this takes ~5 minutes)..."
sudo docker compose up -d --build

echo ""
echo "============================================"
echo "  All services starting up!"
echo "============================================"
echo ""
echo "Service status:"
sudo docker compose ps

echo ""
echo "View logs: sudo docker compose logs -f [service]"
echo "Services:  auth | workspace | project | chat | billing | admin | gateway | postgres"
echo ""
echo "App live at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "To enable HTTPS, run after DNS is pointed:"
echo "  sudo /opt/brixstac/scripts/ssl-setup.sh"
