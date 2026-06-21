#!/bin/bash
set -e

echo "╔═══════════════════════════════════════════╗"
echo "║     ChefOs Backend — Setup Script         ║"
echo "╚═══════════════════════════════════════════╝"

# ─── Check Node.js ──────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# ─── Check/Setup .env ──────────────────────────────
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Edit .env with your production values!"
else
    echo "✅ .env exists"
fi

# ─── Install dependencies ──────────────────────────
echo "📦 Installing dependencies..."
npm install

# ─── Create required directories ──────────────────
mkdir -p logs uploads

# ─── Generate JWT secrets if in production ─────────
if grep -q "change-this-to" .env 2>/dev/null; then
    echo "⚠️  Default JWT secrets detected! Generating new ones..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        NEW_JWT=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        NEW_REFRESH=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    else
        NEW_JWT=$(openssl rand -hex 32)
        NEW_REFRESH=$(openssl rand -hex 32)
    fi
    if [ -n "$NEW_JWT" ]; then
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT/" .env && rm -f .env.bak
        sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$NEW_REFRESH/" .env && rm -f .env.bak
        echo "✅ JWT secrets generated"
    fi
fi

# ─── Check MongoDB ──────────────────────────────────
echo "🔍 Checking MongoDB..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand({ ping: 1 })" --quiet 2>/dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB not reachable. Start MongoDB or check MONGODB_URI in .env"
    fi
elif command -v mongo &> /dev/null; then
    echo "⚠️  Legacy mongo shell found (mongosh recommended)"
else
    echo "⚠️  MongoDB shell not found. Ensure MongoDB is running."
    echo "   Use: docker compose up -d mongodb"
fi

# ─── Seed Database ─────────────────────────────────
read -p "🌱 Seed database with sample data? (y/N): " SEED
if [ "$SEED" = "y" ] || [ "$SEED" = "Y" ]; then
    echo "🌱 Seeding database..."
    node seed.js
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                       ║"
echo "║                                           ║"
echo "║  Start:  npm run dev                      ║"
echo "║  Seed:   npm run seed                     ║"
echo "║  Build:  docker compose up -d             ║"
echo "╚═══════════════════════════════════════════╝"
