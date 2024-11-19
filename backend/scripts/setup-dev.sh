#!/bin/bash

# Create logs directory
mkdir -p logs

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please update the .env file with your database credentials"
fi

# Create logs directory
mkdir -p logs

# Create database and user
echo "To set up the database, run these commands in psql:"
echo "CREATE DATABASE school_portal;"
echo "CREATE USER school_admin WITH ENCRYPTED PASSWORD 'your_password';"
echo "GRANT ALL PRIVILEGES ON DATABASE school_portal TO school_admin;"

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "Setup complete! Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Run 'npm run dev' to start the development server"
