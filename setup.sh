#!/bin/bash

# ==========================================
# CHOREQUEST AUTOMATED INSTALLER & DEPLOYER
# ==========================================

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================${NC}"
echo -e "${YELLOW}       👑 ChoreQuest Local Deployment Setup 👑    ${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""

# 1. Environment Verification
echo -e "${BLUE}[1/4] Checking system prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    echo -e "Please install Node.js (v18+) and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: NPM is not installed!${NC}"
    echo -e "Please install NPM and try again."
    exit 1
fi

NODE_VER=$(node -v)
NPM_VER=$(npm -v)
echo -e "${GREEN}✔ Node.js detected: ${NODE_VER}${NC}"
echo -e "${GREEN}✔ NPM detected: ${NPM_VER}${NC}"
echo ""

# 2. Server Dependency Installation
echo -e "${BLUE}[2/4] Installing backend server dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install backend dependencies!${NC}"
    exit 1
fi
echo -e "${GREEN}✔ Backend dependencies installed successfully!${NC}"
echo ""

# 3. Client Dependency Installation & Production Build
echo -e "${BLUE}[3/4] Installing client dependencies & building assets...${NC}"
if [ -d "client" ]; then
    cd client
    echo "Installing React packages..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install client dependencies!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✔ Client packages installed!${NC}"
    
    echo "Compiling production static assets via Vite..."
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Client build compilation failed!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✔ Static frontend compiled to /client/dist!${NC}"
    cd ..
else
    echo -e "${RED}Error: 'client' directory not found!${NC}"
    exit 1
fi
echo ""

# 4. Final Activation & Host Discovery
echo -e "${BLUE}[4/4] Getting server configuration...${NC}"

# Find local IP address on macOS/Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo -e "${CYAN}==================================================${NC}"
echo -e "${GREEN}🎉 CONGRATULATIONS! ChoreQuest is fully prepared! 🎉${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""
echo -e "To start the application, execute: ${YELLOW}npm start${NC}"
echo ""
echo -e "Access urls once the server is running:"
echo -e "  - Local access:      ${CYAN}http://localhost:5001${NC}"
if [ ! -z "$LOCAL_IP" ]; then
    echo -e "  - Home network link: ${CYAN}http://${LOCAL_IP}:5001${NC}"
    echo -e "                       (Perfect for kids' tablets/phones!)${NC}"
fi
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} on the terminal to stop the server at any time."
echo -e "${CYAN}==================================================${NC}"
