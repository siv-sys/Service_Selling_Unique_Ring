# AWS EC2 + RDS Deployment Guide for This Project

This guide is written for the actual code in this repository:

- Project folder: `Service_Selling_Unique_Ring`
- Backend entry point: `backend/src/server.js`
- Backend app: `backend/src/app.js`
- Backend database setup: `backend/src/config/db.js`
- Backend env loader: `backend/src/config/env.js`
- Frontend API helper: `frontend/lib/api.ts`
- Frontend Socket.IO hook: `frontend/hooks/useSocket.ts`

The repo is a Node.js + Express backend with a Vite + React frontend. The frontend package name is `bondkeeper---couple-rings-&-relationship-registry`, but the project folder and deployment name used in this repo are `Service Selling Unique Ring`.

## What is actually deployed

- EC2 runs:
  - the Node.js backend on `PORT=4001`
  - Nginx as the web server and reverse proxy
- RDS MySQL stores the database
- The frontend is built to `frontend/dist` and copied to Nginx web root
- MobaXterm is used to SSH into EC2

## Real runtime behavior from the code

- Backend default port in code: `3000`
- Production port we set on EC2: `4001`
- Backend serves uploads from `/uploads/*`
- Backend listens on `0.0.0.0`
- Frontend API calls in production go to `/api`
- Socket.IO uses `VITE_API_URL`
- Socket.IO CORS uses `FRONTEND_URL`
- REST API CORS uses `FRONTEND_ORIGIN`

## 1) AWS Resources

### 1.1 EC2

Use Ubuntu 22.04 or Ubuntu 24.04.

Recommended security group inbound rules:

- `22` from your IP only
- `80` from `0.0.0.0/0`
- `443` from `0.0.0.0/0` if you later add SSL

Do not open port `4001` to the public internet.

### 1.2 RDS MySQL

Create an AWS RDS MySQL instance.

Recommended security group inbound rules:

- `3306` from the EC2 security group only

Use a database name such as `bondkeeper`, which matches the repo's example env files.

## 2) Connect with MobaXterm

In MobaXterm:

- Session type: `SSH`
- Host: your EC2 public IP or public DNS
- Port: `22`
- Username: `ubuntu`
- SSH key: your `.pem` file

After connecting, all commands below are run on the EC2 server.

## 3) Install Server Packages on EC2

```bash
sudo apt-get update -y
sudo apt-get install -y nginx git curl

sudo systemctl enable nginx
sudo systemctl start nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2
```

Verify:

```bash
node -v
npm -v
pm2 -v
nginx -v
```

## 4) Clone the Repo on EC2

```bash
mkdir -p /home/ubuntu/Service_Selling_Unique_Ring
cd /home/ubuntu/Service_Selling_Unique_Ring
git clone <YOUR_GITHUB_REPO_URL> .
```

If the repo is already cloned, use `git pull origin main` later for updates.

## 5) Backend Environment Variables

The backend loads `backend/.env` through `dotenv.config()` with no custom path.

Create this file on EC2:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/backend
cat > .env <<'EOF'
PORT=4001
NODE_ENV=production

DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=3306
DB_USER=YOUR_RDS_USER
DB_PASSWORD=YOUR_RDS_PASSWORD
DB_NAME=bondkeeper
DB_CONNECTION_LIMIT=10

JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRE=7d

FRONTEND_ORIGIN=http://YOUR_EC2_PUBLIC_IP
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
EOF
```

Use your real domain instead of the EC2 IP if you have one:

- `https://your-domain.com`
- `http://your-domain.com`

The code actually reads only these backend env keys:

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

## 6) Upload Folder

The backend stores user images under `backend/uploads/profile`.

Create it:

```bash
mkdir -p /home/ubuntu/Service_Selling_Unique_Ring/backend/uploads/profile
chmod -R 755 /home/ubuntu/Service_Selling_Unique_Ring/backend/uploads
```

## 7) Install Backend Dependencies

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/backend
npm ci --omit=dev
```

The backend initializes its core tables on startup through `backend/src/config/db.js`, so the first boot can create the schema automatically if the RDS database is empty.

## 8) Start the Backend with PM2

Use the backend entry file directly:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/backend
pm2 start src/server.js --name ringos-backend
pm2 save
pm2 status
pm2 logs ringos-backend --lines 100
```

Health check on the EC2 server:

```bash
curl http://127.0.0.1:4001/api/health
```

If this fails, check:

- RDS endpoint and credentials
- EC2 to RDS security group access on port `3306`
- `backend/.env`
- PM2 logs

## 9) Configure Nginx

Create the site config:

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

## 10) Build the Frontend

The frontend uses `/api` automatically in production, so it only needs the socket base URL set.

Create `frontend/.env.production`:

```bash
cd /home/ubuntu/Service_Selling_Unique_Ring/frontend
cat > .env.production <<'EOF'
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP
EOF
```

Build it:

```bash
npm ci
npm run build
```

Copy build output to Nginx:

```bash
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
```

For Socket.IO, `VITE_API_URL` should be the site root, not `/api`.

## 11) Verify the Deployment

Open these in your browser:

- `http://YOUR_EC2_PUBLIC_IP/`
- `http://YOUR_EC2_PUBLIC_IP/api/health`
- `http://YOUR_EC2_PUBLIC_IP/uploads/profile/<file-name>`

Test locally on EC2:

```bash
curl http://127.0.0.1:4001/
curl http://127.0.0.1:4001/api
curl http://127.0.0.1:4001/api/health
```

## 12) GitHub Actions CI/CD

After the first manual deploy works, you can automate updates from GitHub.

### GitHub Secrets

Add these in GitHub repo settings:

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

### Example workflow

Create `.github/workflows/deploy.yml`:

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

            APP_PATH="${{ secrets.APP_PATH }}"
            cd "$APP_PATH"

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

            cd ../frontend
            cat > .env.production <<EOF
VITE_API_URL=${{ secrets.VITE_API_URL }}
EOF

            npm ci
            npm run build

            sudo rm -rf /var/www/html/*
            sudo cp -r dist/* /var/www/html/

            if pm2 describe ringos-backend >/dev/null 2>&1; then
              pm2 restart ringos-backend
            else
              pm2 start ../backend/src/server.js --name ringos-backend
            fi

            pm2 save
            sudo systemctl reload nginx
```

## 13) Real Values to Use

For a simple EC2 IP deployment:

- `FRONTEND_ORIGIN=http://YOUR_EC2_PUBLIC_IP`
- `FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP`
- `VITE_API_URL=http://YOUR_EC2_PUBLIC_IP`

For a custom domain with SSL:

- `FRONTEND_ORIGIN=https://YOUR_DOMAIN`
- `FRONTEND_URL=https://YOUR_DOMAIN`
- `VITE_API_URL=https://YOUR_DOMAIN`

## 14) Common Problems

### 502 Bad Gateway

Usually means:

- backend is not running
- backend is not listening on `4001`
- Nginx proxy config is wrong

### CORS errors

Usually means:

- `FRONTEND_ORIGIN` does not match the browser URL
- `FRONTEND_URL` does not match the browser URL

### Socket.IO not connecting

Usually means:

- `VITE_API_URL` is wrong
- it should be the domain root, not `/api`

### Upload images not loading

Usually means:

- `backend/uploads/profile` is missing
- the file path was not copied correctly
- Nginx is not proxying `/uploads/`

## 15) First Deploy Checklist

- EC2 instance is running
- RDS MySQL instance is running
- EC2 can reach RDS on `3306`
- `backend/.env` has real production values
- `pm2 status` shows `ringos-backend` online
- `curl http://127.0.0.1:4001/api/health` works on EC2
- `nginx -t` passes
- frontend build exists in `frontend/dist`
- `/var/www/html` contains the frontend build
- browser can open the EC2 public IP or domain
