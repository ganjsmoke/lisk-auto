
# Lisk Auto

A comprehensive automated script for managing transactions and task claims for Lisk users.

## Features

1. **Daily Transaction:** Wrap ETH automatically every 24 hours.
2. **Hourly Task:** Automates task fetching and claiming every hour.
3. **Weekly Transaction:** Supports wrapping ETH or sending 0 ETH to your own address, running weekly.

---

## Prerequisites

1. **Register on the Lisk Portal:**
   - Visit [Lisk Portal Airdrop](https://portal.lisk.com/airdrop).
   - Use invite code: `YUouBD` to register.

2. **Clone the Repository:**
   ```bash
   git clone https://github.com/ganjsmoke/lisk-auto.git
   cd lisk-auto
   ```

3. **Install Node.js:**
   - Download and install Node.js from [Node.js Official Website](https://nodejs.org).

4. **Install Dependencies:**
   ```bash
   npm install
   ```

5. **Create a `private_keys.txt` file:**
   - Store your private keys in this file, one private key per line. See the format below.

---

## File Formats

### private_keys.txt
```txt
PRIVATE_KEY_1
PRIVATE_KEY_2
PRIVATE_KEY_3
...
```

---

## Usage

### Recommended: Use Screen for Long-Running Processes
To ensure uninterrupted execution, run each menu option in a separate `screen` session.

1. Install screen:
   ```bash
   sudo apt install screen
   ```
2. Start a screen session:
   ```bash
   screen -S lisk-auto
   ```
3. Run the script.

### Run the Script
1. Start the script:
   ```bash
   node index.js
   ```

2. Choose an option:
   - `1`: Daily Transaction (Wrap ETH, runs every 24 hours).
   - `2`: Hourly Task (Runs hourly).
   - `3`: Weekly Transaction (Wrap ETH).
   - `4`: Weekly Transaction (Send 0 ETH to Own Address).

### Detach Screen
Detach the screen session to keep it running in the background:
```bash
Ctrl + A, D
```

### Reattach Screen
To return to the screen session:
```bash
screen -r lisk-auto
```

---

## Important Notes

- Ensure that the `private_keys.txt` file is kept secure.
- Do not share your private keys publicly.
- Use this script responsibly.

---

## Author

Bot created by: [https://t.me/airdropwithmeh](https://t.me/airdropwithmeh)

---

## License
This project is for educational purposes only. Use at your own discretion.
