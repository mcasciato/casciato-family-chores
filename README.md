# 👑 ChoreQuest

ChoreQuest is a gamified, state-of-the-art, and ultra-responsive web application designed to help families track children's chores. It is fully self-hosted, lightweight, and optimized to run flawlessly on a home-networked **Raspberry Pi**.

Built with a gorgeous glassmorphic dark-mode UI, it treats kids as "Heroes," chores as "Quests," and rewards as "Loot" purchasable with earned gold coins.

---

## 🚀 Key Features

*   **Gamified Kids Dashboard**: Separate profile selection screen where kids view daily/weekly chores, click to submit them for verification, and shop for rewards.
*   **Guild Master Command (Parent View)**: PIN-protected parent portal to review pending approvals, create/modify chores, customize loot rewards, and manage coin balances.
*   **Adaptive Theme Accent**: Oliver, Luna, and Leo get customized theme overrides (Neon Violet, Warm Amber, Emerald Green) that dynamically dress the app interfaces when they log in.
*   **Raspberry Pi Optimized**: Serverless single-file SQLite database with exceptionally low memory footprint (< 50MB RAM).
*   **Fully Responsive**: Styled with modular Vanilla CSS utilizing advanced glassmorphism overlays and haptic transition effects that look spectacular on iPads, tablets, mobile phones, and desktop screens.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend**: React (Vite, custom state routing, Lucide React icons, Canvas Confetti).
*   **Backend**: Node.js & Express.js.
*   **Database**: SQLite3 (`sqlite3` driver wrapped in modern async/await Promise API).
*   **Styling**: Pure CSS Variables, backdrop glass filters, and responsive grids.

---

## 💻 Local Setup & Installation

You can get ChoreQuest up and running on your local Mac/PC in minutes:

1.  **Clone / Navigate** to the project directory:
    ```bash
    cd /Users/michaelcasciato/Documents/dev/chore-app
    ```
2.  **Make the setup script executable**:
    ```bash
    chmod +x setup.sh
    ```
3.  **Run the automated setup**:
    ```bash
    ./setup.sh
    ```
    This script will verify your Node environment, install all backend packages, download frontend components, and compile the final optimized production assets.
4.  **Start the app**:
    ```bash
    npm start
    ```
5.  Open your browser and navigate to:
    *   **Local URL**: `http://localhost:5001`
    *   **Local Network IP (e.g. tablet)**: `http://<YOUR-IP-ADDRESS>:5001`

---

## 🍓 Raspberry Pi Hosting Guide

Follow these steps to host ChoreQuest permanently on a Raspberry Pi in your home so your wife and kids can access it anytime from their devices:

### Step 1: Install Node.js on Raspberry Pi
Open the Raspberry Pi terminal (or connect via SSH) and install the latest LTS version of Node.js:

```bash
# Download and install NodeSource Node.js setup
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js & build essentials (required for SQLite compiling)
sudo apt-get install -y nodejs build-essential
```

Verify the installation:
```bash
node -v
npm -v
```

### Step 2: Copy Code & Run Setup
Copy this project folder to your Raspberry Pi home directory (e.g. via SCP, SFTP, USB drive, or git repository), then run the setup script:

```bash
cd chore-app
chmod +x setup.sh
./setup.sh
```

### Step 3: Run Automatically on Boot (Choose Option A or B)

To ensure ChoreQuest is always running—even after power outages or Pi restarts—configure it to run as a background service:

#### Option A: Running with PM2 (Recommended & Simplest)
PM2 is a production process manager that handles automatic restarts and boot scripts.

1.  **Install PM2 globally**:
    ```bash
    sudo npm install -g pm2
    ```
2.  **Start the server process**:
    ```bash
    pm2 start server.js --name "chorequest"
    ```
3.  **Configure PM2 to start on system boot**:
    ```bash
    pm2 startup
    ```
    *Copy and paste the command generated in your terminal (starting with `sudo env PATH...`).*
4.  **Save the current process list**:
    ```bash
    pm2 save
    ```

#### Option B: Creating a Linux Systemd Service (Standard System Service)
If you prefer a native Linux service without npm dependencies:

1.  **Create the service file**:
    ```bash
    sudo nano /etc/systemd/system/chorequest.service
    ```
2.  **Paste the following configuration** (adjust `/home/pi/chore-app` to your actual folder path):
    ```ini
    [Unit]
    Description=ChoreQuest Family Chore Tracker
    After=network.target

    [Service]
    Type=simple
    User=pi
    WorkingDirectory=/home/pi/chore-app
    ExecStart=/usr/bin/node server.js
    Restart=on-failure
    Environment=PORT=5001

    [Install]
    WantedBy=multi-user.target
    ```
3.  **Save and exit** (Ctrl+O, Enter, Ctrl+X).
4.  **Enable and start the service**:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable chorequest.service
    sudo systemctl start chorequest.service
    ```
5.  **Check status**:
    ```bash
    sudo systemctl status chorequest.service
    ```

---

## 🛡️ PIN Security

*   **Switching to Parent Command Center** requires a 4-digit PIN. 
*   Preset seed PINs:
    *   **Oliver**: `1111`
    *   **Luna**: `2222`
    *   **Leo**: `3333`
    *   **Generic Fallback**: `1234`
*   Parents can customize PIN codes for each child, add new children, or delete profiles in the **Heroes** tab in Parent Mode.

---

## 💾 Database Backups

Because ChoreQuest uses SQLite, all system state, completed chores, redemptions, and gold accounts are safely stored in a single file: `database.sqlite` in the root folder.

*   To **back up** your family data, copy `database.sqlite` to an external drive or cloud service.
*   To **restore** data on a fresh installation, simply paste your `database.sqlite` file into the root folder before starting the server.
