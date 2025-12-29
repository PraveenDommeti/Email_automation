#!/bin/bash

echo "========================================"
echo "Email Automation System - Quick Start"
echo "========================================"
echo ""

echo "Checking Python installation..."
python3 --version || python --version
if [ $? -ne 0 ]; then
    echo "ERROR: Python is not installed"
    exit 1
fi

echo ""
echo "Checking Node.js installation..."
node --version
if [ $? -ne 0 ]; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

echo ""
echo "========================================"
echo "Step 1: Backend Setup"
echo "========================================"
echo ""

cd backend

echo "Installing Python dependencies..."
pip install -r requirements.txt || pip3 install -r requirements.txt

echo ""
echo "========================================"
echo "Step 2: Environment Configuration"
echo "========================================"
echo ""

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp ../.env.example .env
    echo ""
    echo "IMPORTANT: Please edit backend/.env and add your API keys:"
    echo "  - GEMINI_API_KEY"
    echo "  - GOOGLE_CLIENT_ID"
    echo "  - GOOGLE_CLIENT_SECRET"
    echo "  - FLASK_SECRET_KEY"
    echo ""
    read -p "Press Enter after you've configured the .env file..."
fi

cd ..

echo ""
echo "========================================"
echo "Step 3: Frontend Setup"
echo "========================================"
echo ""

cd frontend

echo "Installing Node.js dependencies..."
npm install

cd ..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "To start the application:"
echo ""
echo "1. Backend (Terminal 1):"
echo "   cd backend"
echo "   python app.py"
echo ""
echo "2. Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "========================================"
