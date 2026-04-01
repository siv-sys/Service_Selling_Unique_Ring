# AWS EC2 + RDS + MobaXterm Deployment Guide

This guide is tailored to the actual code in this repository:

- Project folder: `Service_Selling_Unique_Ring`
- Backend entry point: `backend/src/server.js`
- Backend app file: `backend/src/app.js`
- Backend DB setup: `backend/src/config/db.js`
- Backend env loader: `backend/src/config/env.js`
- Frontend API helper: `frontend/lib/api.ts`
- Frontend Socket.IO hook: `frontend/hooks/useSocket.ts`

## 1) What This Project Needs in Production

- EC2 for the Node.js backend
- EC2 for Nginx
- RDS MySQL for the database
- MobaXterm for SSH into EC2
- PM2 for keeping the backend process alive

## 2) Real App Behavior From the Code

- Backend listens on `PORT=4001` in production
- Backend serves uploads from `/uploads`
- Frontend API requests use `/api` in production
- Socket.IO uses `VITE_API_URL`
- Socket.IO CORS uses `FRONTEND_URL`
- REST CORS uses `FRONTEND_ORIGIN`
- Backend auto-creates core tables on startup through `backend/src/config/db.js`

## 3) AWS Security Groups

### EC2 inbound rules

- `22` from your IP only
- `80` from `0.0.0.0/0`
- `443` from `0.0.0.0/0` if you later add SSL

Do not expose port `4001` publicly.

### RDS inbound rules

- `3306` from the EC2 security group only

## 4) Connect with MobaXterm

Create an SSH session:

- Session type: `SSH`
- Host: your EC2 public IP or DNS
- Port: `22`
- Username: `ubuntu`
- SSH key: your `.pem` file

After login, use the terminal inside MobaXterm for all commands below.

## 5) Install Packages on EC2

```bash
sudo apt-get update -y
sudo apt-get install -y nginx git curl

sudo systemctl enable nginx
sudo systemctl start nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2
```

Check installation:

```bash
node -v
npm -v
pm2 -v
nginx -v
```

## 6) Clone the Repo on EC2

```bash
mkdir -p /home/ubuntu/Service_Selling_Unique_Ring
cd /home/ubuntu/Service_Selling_Unique_Ring
git clone <YOUR_GITHUB_REPO_URL> .
```

If the repository already exists there, you can use:

```bash
git pull origin main
```

## 7) Backend Environment File

Create `backend/.env` on EC2.

Use this exact structure and fill in your real AWS values:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/backend
cat > .env <<'EOF'
PORT=4001
NODE_ENV=production

DB_HOST=<YOUR_RDS_ENDPOINT>
DB_PORT=3306
DB_USER=<YOUR_RDS_USERNAME>
DB_PASSWORD=<YOUR_RDS_PASSWORD>
DB_NAME=bondkeeper
DB_CONNECTION_LIMIT=10

JWT_SECRET=<YOUR_LONG_RANDOM_SECRET>
JWT_EXPIRE=7d

FRONTEND_ORIGIN=http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>
FRONTEND_URL=http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>
EOF
```

These are the backend env keys the code actually reads:

- `PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_CONNECTION_LIMIT`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `FRONTEND_ORIGIN`
- `FRONTEND_URL`

## 8) Upload Folder

The backend stores uploaded profile images in:

- `backend/uploads/profile`

Create it:

```bash
mkdir -p /home/ubuntu/Service_Selling_Unique_Ring/backend/uploads/profile
chmod -R 755 /home/ubuntu/Service_Selling_Unique_Ring/backend/uploads
```

## 9) Install Backend Dependencies

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/backend
npm ci --omit=dev
```

## 10) Start the Backend

Start the actual backend entry file:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/backend
pm2 start src/server.js --name ringos-backend
pm2 save
pm2 status
pm2 logs ringos-backend --lines 100
```

Health check:

```bash
curl http://127.0.0.1:4001/api/health
```

If this fails, check:

- RDS security group
- RDS endpoint
- DB username/password
- `backend/.env`
- PM2 logs

## 11) Configure Nginx

Create the Nginx config:

```bash
sudo tee /etc/nginx/conf.d/service-selling-unique-ring.conf > /dev/null <<'EOF'
server {
  listen 80;
  server_name _;

  client_max_body_size 50m;

  root /var/www/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:4001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:4001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:4001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 12) Build the Frontend

The frontend uses `/api` automatically in production, so the important production value is the Socket.IO base URL.

Create `frontend/.env.production`:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/frontend
cat > .env.production <<'EOF'
VITE_API_URL=http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>
EOF
```

Build it:

```bash
npm ci
npm run build
```

Copy the build into Nginx web root:

```bash
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

## 13) Verify the Deployment

Run these checks on the EC2 server:

```bash
curl http://127.0.0.1:4001/
curl http://127.0.0.1:4001/api
curl http://127.0.0.1:4001/api/health
```

Open in a browser:

- `http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>/`
- `http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>/api/health`

Uploads should resolve through:

- `http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>/uploads/profile/<file-name>`

## 14) One-Command Deployment Flow

After the first setup, the repeat deploy flow on EC2 is:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring
git pull origin main

cd backend
npm ci --omit=dev
pm2 restart ringos-backend

cd ../frontend
npm ci
npm run build

sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
```

## 15) Optional GitHub Actions CI/CD

Use these GitHub Secrets:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `APP_PATH` = `/home/ubuntu/Service_Selling_Unique_Ring`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `FRONTEND_URL`
- `VITE_API_URL`

Example workflow:

```yaml
name: Deploy to AWS EC2

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            set -e
            cd /home/ubuntu/Service_Selling_Unique_Ring
            git pull origin main

            cd backend
            cat > .env <<EOF
PORT=4001
NODE_ENV=production
DB_HOST=${{ secrets.DB_HOST }}
DB_PORT=3306
DB_USER=${{ secrets.DB_USER }}
DB_PASSWORD=${{ secrets.DB_PASSWORD }}
DB_NAME=${{ secrets.DB_NAME }}
DB_CONNECTION_LIMIT=10
JWT_SECRET=${{ secrets.JWT_SECRET }}
JWT_EXPIRE=7d
FRONTEND_ORIGIN=${{ secrets.FRONTEND_ORIGIN }}
FRONTEND_URL=${{ secrets.FRONTEND_URL }}
EOF

            mkdir -p uploads/profile
            npm ci --omit=dev
            pm2 restart ringos-backend || pm2 start src/server.js --name ringos-backend
            pm2 save

            cd ../frontend
            cat > .env.production <<EOF
VITE_API_URL=${{ secrets.VITE_API_URL }}
EOF

            npm ci
            npm run build

            sudo rm -rf /var/www/html/*
            sudo cp -r dist/* /var/www/html/
            sudo systemctl reload nginx
```

## 16) Real Values Summary

The only values you must replace with your own are:

- RDS endpoint
- RDS username
- RDS password
- JWT secret
- EC2 public IP or domain

Everything else in this guide matches the actual project code:

- backend port: `4001`
- database name: `bondkeeper`
- frontend API path: `/api`
- uploads path: `/uploads`
- backend entry file: `src/server.js`

