#!/bin/bash

# Cloudflare Enterprise POS - Setup Script

echo "🚀 Setting up Cloudflare Enterprise POS System..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler@latest
fi

# Check if user is logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare..."
    wrangler auth login
fi

echo "✅ Cloudflare authentication successful!"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "🔧 Setting up backend (Cloudflare Workers)..."
cd backend
npm install

echo "🗄️ Creating Cloudflare resources..."

# Create D1 database
echo "Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create enterprise-pos-db 2>/dev/null)
if [ $? -eq 0 ]; then
    DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)
    echo "✅ D1 Database created: $DB_ID"
else
    echo "⚠️  D1 Database may already exist"
fi

# Create KV namespace
echo "Creating KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create "CACHE" 2>/dev/null)
if [ $? -eq 0 ]; then
    KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    echo "✅ KV Namespace created: $KV_ID"
else
    echo "⚠️  KV Namespace may already exist"
fi

# Create R2 bucket
echo "Creating R2 bucket..."
wrangler r2 bucket create enterprise-pos-files 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ R2 Bucket created: enterprise-pos-files"
else
    echo "⚠️  R2 Bucket may already exist"
fi

cd ..

# Setup frontend
echo "🎨 Setting up frontend (Cloudflare Pages)..."
cd frontend
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Frontend environment file created"
fi

cd ..

echo ""
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next steps:"
echo ""
echo "1. Update backend/wrangler.toml with your resource IDs:"
if [ ! -z "$DB_ID" ]; then
    echo "   database_id = \"$DB_ID\""
fi
if [ ! -z "$KV_ID" ]; then
    echo "   KV id = \"$KV_ID\""
fi
echo ""
echo "2. Run database migrations:"
echo "   npm run migrate"
echo ""
echo "3. Seed initial data:"
echo "   npm run seed"
echo ""
echo "4. Start development:"
echo "   npm run dev"
echo ""
echo "5. Deploy to production:"
echo "   npm run deploy"
echo ""
echo "🚀 Happy coding!" 