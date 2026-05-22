#!/bin/bash
# Brixstac — SSL Certificate + HTTPS Setup
# Run AFTER DNS A records are pointed to this server
set -e

APP_DIR="/opt/brixstac"
DOMAIN="brixstac.com"
EMAIL="sonadarshan@growthinfocus.com"

echo "=== SSL Setup for $DOMAIN ==="

# Stop gateway to free port 80
cd $APP_DIR
sudo docker compose stop gateway

# Get cert
sudo certbot certonly --standalone \
    -d $DOMAIN -d www.$DOMAIN \
    --non-interactive --agree-tos --email $EMAIL

# Update nginx config for HTTPS
cat > $APP_DIR/gateway/nginx-ssl.conf << 'NGINXEOF'
upstream auth_service      { server auth:3001; }
upstream workspace_service { server workspace:3002; }
upstream project_service   { server project:3003; }
upstream chat_service      { server chat:3004; }
upstream billing_service   { server billing:3005; }
upstream admin_service     { server admin:3006; }

server {
    listen 80;
    server_name brixstac.com www.brixstac.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name brixstac.com www.brixstac.com;

    ssl_certificate /etc/letsencrypt/live/brixstac.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brixstac.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=63072000" always;

    client_max_body_size 20M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location /api/auth/ {
        proxy_pass http://auth_service/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ ^/api/workspaces/[^/]+/(projects|approvals|meetings|calendar) {
        proxy_pass http://project_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        rewrite ^/api/(.*)$ /$1 break;
    }

    location ~ ^/api/workspaces/[^/]+/conversations {
        proxy_pass http://chat_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        rewrite ^/api/(.*)$ /$1 break;
    }

    location /api/workspaces {
        proxy_pass http://workspace_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        rewrite ^/api/(.*)$ /$1 break;
    }

    location /api/billing {
        proxy_pass http://billing_service;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        rewrite ^/api/(.*)$ /$1 break;
    }

    location /api/admin {
        proxy_pass http://admin_service;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        rewrite ^/api/(.*)$ /$1 break;
    }

    location /socket.io/ {
        proxy_pass http://chat_service/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location /health {
        access_log off;
        return 200 '{"status":"ok","https":true}';
        add_header Content-Type application/json;
    }

    root /usr/share/nginx/html;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINXEOF

# Replace nginx config and restart
cp $APP_DIR/gateway/nginx-ssl.conf $APP_DIR/gateway/nginx.conf

# Rebuild gateway with SSL config
sudo docker compose up -d --build gateway

# Auto-renew cron
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f $APP_DIR/docker-compose.yml restart gateway") | crontab -

echo ""
echo "=== HTTPS is live at https://$DOMAIN ==="
