#!/bin/bash

# Home-Remodeling CRM Setup Script
# This script will help you set up the complete CRM system

set -e

echo "🏗️  Home-Remodeling CRM Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating server environment file..."
    cp env.example .env
    echo "⚠️  Please edit server/.env with your configuration"
else
    echo "✅ Server environment file already exists"
fi

cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating client environment file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="Home-Remodeling CRM"
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
EOF
    echo "⚠️  Please edit client/.env with your configuration"
else
    echo "✅ Client environment file already exists"
fi

cd ..

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
cd server
npx prisma generate
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables:"
echo "   - Edit server/.env with your database and API keys"
echo "   - Edit client/.env with your frontend configuration"
echo ""
echo "2. Set up your database:"
echo "   - Create a Supabase project (recommended)"
echo "   - Or set up a local PostgreSQL database"
echo "   - Run: cd server && npx prisma db push"
echo ""
echo "3. Start the development servers:"
echo "   - Run: npm run dev"
echo ""
echo "4. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:5000"
echo ""
echo "📚 For detailed setup instructions, see setup.md"
echo "" 