
# Lisk Auto Transaction and Task Automation

This repository contains a bot script to automate ETH wrapping transactions and Lisk task clearing. The script includes functionalities for hourly, daily, and weekly operations.

---

## Registration

To begin using this bot, register at [Lisk Portal Airdrop](https://portal.lisk.com/airdrop) using the referral code: **YUouBD**.

---


## Features

- **Daily Transactions:** Wrap ETH every 24 hours for the accounts listed.
- **Weekly Transactions:** Execute 500 random ETH wrapping transactions every 7 days.
- **Hourly Task:** Fetch and clear tasks every hour.

---

## Prerequisites

1. **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js Official Site](https://nodejs.org/).
2. **Private Keys**: Prepare a `private_keys.txt` file in the project directory containing the private keys for the accounts you want to use.
3. **Lisk RPC URL**: Update the `web3` initialization with the correct RPC URL.

---

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ganjsmoke/lisk-auto.git
   cd lisk-auto
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create a Private Key File**
   - Create a file named `private_keys.txt` in the root of the project.
   - Format the file as follows (one private key per line):
     ```
     0xYOUR_PRIVATE_KEY_1
     0xYOUR_PRIVATE_KEY_2
     0xYOUR_PRIVATE_KEY_3
     ```


4. **Run the Script**
   - Start the bot using:
     ```bash
     node index.js
     ```

5. **Use Screen for Persistent Execution**
   - It's recommended to use the `screen` command to ensure each menu can run independently without interruption:
     ```bash
     screen -S daily_task
     node index.js
     ```
     Repeat this for each menu option (Daily, Hourly, Weekly) by naming the screen sessions accordingly.

6. **Choose an Operation**
   - Daily Transaction (Option 1)
   - Hourly Task (Option 2)
   - Weekly Transaction (Option 3)

---



## Acknowledgment

- Bot created by: [Telegram - airdropwithmeh](https://t.me/airdropwithmeh)

---

## Notes

- Ensure your `private_keys.txt` file is secure and not shared publicly.
- Monitor your accounts for gas and balance sufficiency to prevent transaction failures.
