const fs = require('fs');
const Web3 = require('web3');
const chalk = require('chalk');
const readline = require('readline');
const axios = require('axios');

// WETH Contract Configuration
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const WETH_ABI = [
  {
    "constant": false,
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function",
  },
];

// Initialize Web3
const web3 = new Web3("https://rpc.api.lisk.com"); // Replace with your RPC URL
const API_URL = "https://portal-api.lisk.com/graphql";


// Function to Wrap ETH with Gas Estimation, Nonce, and Retry Delay
const wrapETH = async (privateKey, amount, retries = 3, delay = 60000) => { // delay in milliseconds (default 5s)
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey.trim());
    web3.eth.accounts.wallet.add(account);

    const wethContract = new web3.eth.Contract(WETH_ABI, WETH_ADDRESS);

    console.log(chalk.blue(`Wrapping ETH for address: ${account.address}, Amount: ${amount}`));

    const tx = wethContract.methods.deposit();
    const value = web3.utils.toWei(amount.toString(), "ether");

    // Estimate Gas
    const gasEstimate = await tx.estimateGas({
      from: account.address,
      value: value,
    });

    const gasPrice = await web3.eth.getGasPrice();

    // Fetch the current nonce for the address
    const nonce = await web3.eth.getTransactionCount(account.address);

    // Send Transaction with nonce
    const tx2 = await tx.send({
      from: account.address,
      to: WETH_ADDRESS,
      value: value,
      gas: gasEstimate,
      gasPrice: gasPrice,
      nonce: nonce, // Add nonce here
    });


    console.log(chalk.green(`Successfully wrapped ETH. Transaction Hash: ${tx2.transactionHash}`));
    await new Promise(resolve => setTimeout(resolve, 5000)); // Delay before checking again
  } catch (error) {
    console.error(chalk.red("Error wrapping ETH:", error.message));

    if (retries > 0) {
      console.log(chalk.yellow(`Retrying in ${delay / 1000} seconds... Attempts left: ${retries}`));
      await new Promise(resolve => setTimeout(resolve, delay)); // Delay before retrying
      await wrapETH(privateKey, amount, retries - 1, delay); // Retry with decremented retries
    } else {
      console.error(chalk.red("Max retries reached. Transaction failed."));
    }
  }
};


// Function to Send ETH to Own Address (with 0 ETH) with Gas Estimation, Retry Mechanism, Nonce, and Retry Delay
const sendToOwnAddress = async (privateKey, retries = 3, delay = 60000) => { // delay in milliseconds (default 5s)
  const account = web3.eth.accounts.privateKeyToAccount(privateKey.trim());
  web3.eth.accounts.wallet.add(account);

  try {
    console.log(chalk.blue(`Sending 0 ETH to own address: ${account.address}`));
    
    // Estimate Gas
    const gasEstimate = await web3.eth.estimateGas({
      from: account.address,
      to: account.address,
      value: "0",
    });
    
    const gasPrice = await web3.eth.getGasPrice();
    
    // Fetch the current nonce for the address
    const nonce = await web3.eth.getTransactionCount(account.address);

    // Send Transaction with nonce
    const tx = await web3.eth.sendTransaction({
      from: account.address,
      to: account.address,
      value: "0", // 0 ETH
      gas: gasEstimate,
      gasPrice: gasPrice,
      nonce: nonce, // Add nonce here
    });

    console.log(chalk.yellow(`Transaction sent. Waiting for receipt...`));


    console.log(chalk.green(`Successfully sent 0 ETH to own address. Transaction Hash: ${tx.transactionHash}`));
    await new Promise(resolve => setTimeout(resolve, 5000)); // Delay before checking again
  } catch (error) {
    console.error(chalk.red(`Error sending 0 ETH: ${error.message}`));

    if (retries > 0) {
      console.log(chalk.yellow(`Retrying in ${delay / 1000} seconds... Attempts left: ${retries}`));
      await new Promise(resolve => setTimeout(resolve, delay)); // Delay before retrying
      await sendToOwnAddress(privateKey, retries - 1, delay); // Retry with decremented retries
    } else {
      console.error(chalk.red("Max retries reached. Transaction failed."));
    }
  }
};


// GraphQL Query for Fetching Tasks
const getTaskPayload = (address) => ({
  query: `
    query AirdropUser($filter: UserFilter!, $tasksFilter: QueryFilter) {
      userdrop {
        user(filter: $filter) {
          tasks(filter: $tasksFilter) {
            tasks {
              id
              description
              progress {
                isCompleted
              }
            }
          }
        }
      }
    }
  `,
  variables: {
    filter: {
      address: address,
    },
  },
});

// GraphQL Mutation for Claiming Tasks
const claimTaskPayload = (address, taskID) => ({
  query: `
    mutation UpdateAirdropTaskStatus($input: UpdateTaskStatusInputData!) {
      userdrop {
        updateTaskStatus(input: $input) {
          success
          progress {
            isCompleted
            completedAt
          }
        }
      }
    }
  `,
  variables: {
    input: {
      address: address,
      taskID: taskID,
    },
  },
});

// Function to Fetch Tasks
const fetchTasks = async (address) => {
  try {
    const payload = getTaskPayload(address);

    // Send request to fetch tasks
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const tasks = response.data?.data?.userdrop?.user?.tasks?.flatMap((category) => category.tasks) || [];
    return tasks.filter((task) => !task.progress.isCompleted); // Return only incomplete tasks
  } catch (error) {
    console.error(chalk.red("Error fetching tasks:", error.response?.data || error.message));
    return [];
  }
};

// Function to Claim a Task
const claimTask = async (address, taskID, description) => {
  try {
    console.log(chalk.cyan(`Claiming task ${taskID}: ${description}`));
    const payload = claimTaskPayload(address, taskID);

    // Send request to claim the task
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const result = response.data?.data?.userdrop?.updateTaskStatus;

    if (result?.success) {
      console.log(chalk.green(`Task ${taskID} successfully claimed! Completed At: ${result.progress.completedAt}`));
    } else {
      console.log(chalk.red(`Failed to claim task ${taskID}.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error claiming task ${taskID}:`, error.response?.data || error.message));
  }
};

// Task Execution Function
const clearTasks = async (filePath) => {
  try {
    const privateKeys = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

    for (const privateKey of privateKeys) {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey.trim());
      const address = account.address;

      console.log(chalk.blue(`Fetching and claiming tasks for address: ${address}`));

      // Fetch incomplete tasks
      const incompleteTasks = await fetchTasks(address);

      // Claim each incomplete task
      for (const task of incompleteTasks) {
        await claimTask(address, task.id, task.description);
      }

      console.log(chalk.green(`Finished processing tasks for address: ${address}\n`));
    }
  } catch (error) {
    console.error(chalk.red("Error processing tasks:", error.message));
  }
};

// Hourly Task Function
const startHourlyTask = (filePath) => {
  const executeTask = async () => {
    console.log(chalk.yellow(`\n[${new Date().toLocaleTimeString()}] Starting hourly task processing...\n`));
    await clearTasks(filePath);
    console.log(chalk.green(`\n[${new Date().toLocaleTimeString()}] Hourly task processing completed.\n`));

    console.log(chalk.cyan("Waiting for the next hour..."));
    setTimeout(() => {
      console.log(chalk.yellow("Resuming task processing after 1 hour."));
      executeTask();
    }, 60 * 60 * 1000); // 1 hour
  };

  executeTask();
};

// Weekly Transaction Function
const startWeeklyTransaction = (filePath, action) => {
  const executeTask = async () => {
    console.log(chalk.yellow(`\n[${new Date().toLocaleTimeString()}] Starting weekly transaction processing...\n`));

    const privateKeys = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

    for (const privateKey of privateKeys) {
      console.log(chalk.blue(`Processing 110 transactions for address linked to private key.`));

      for (let i = 0; i < 110; i++) {
        if (action === 'wrap') {
          const minAmount = 0.0000000001;
          const maxAmount = 0.000000001;
          const randomAmount = (Math.random() * (maxAmount - minAmount) + minAmount).toFixed(9);

          console.log(chalk.yellow(`Transaction ${i + 1}/110: Wrapping ${randomAmount} ETH`));
          await wrapETH(privateKey, randomAmount);
        } else if (action === 'send') {
          console.log(chalk.yellow(`Transaction ${i + 1}/110: Sending 0 ETH to own address`));
          await sendToOwnAddress(privateKey);
        }
      }

      console.log(chalk.green(`Finished 110 transactions for address.\n`));
    }

    console.log(chalk.green(`\n[${new Date().toLocaleTimeString()}] Weekly transaction processing completed.\n`));

    console.log(chalk.cyan("Waiting for the next 1 days..."));
    setTimeout(() => {
      console.log(chalk.yellow("Resuming daily transaction..."));
      executeTask();
    }, 1 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
  };

  executeTask();
};

// Daily Transaction Function
const startDailyTransaction = (filePath) => {
  const executeTask = async () => {
    console.log(chalk.yellow(`\n[${new Date().toLocaleTimeString()}] Starting daily transaction processing...\n`));

    const privateKeys = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);

    for (const privateKey of privateKeys) {
      const minAmount = 0.000000001;
      const maxAmount = 0.00000001;
      const randomAmount = (Math.random() * (maxAmount - minAmount) + minAmount).toFixed(9);

      console.log(chalk.yellow(`Processing daily transaction: Wrapping ${randomAmount} ETH for private key`));
      await wrapETH(privateKey, randomAmount);
    }

    console.log(chalk.green(`\n[${new Date().toLocaleTimeString()}] Daily transaction processing completed.\n`));

    console.log(chalk.cyan("Waiting for the next 24 hours..."));
    setTimeout(() => {
      console.log(chalk.yellow("Resuming daily transaction processing after 24 hours."));
      executeTask();
    }, 24 * 60 * 60 * 1000);
  };

  executeTask();
};

function printHeader() {
    const line = "=".repeat(50);
    const title = "Auto Tx & Task Lisk";
    const createdBy = "Bot created by: https://t.me/airdropwithmeh";

    const totalWidth = 50;
    const titlePadding = Math.floor((totalWidth - title.length) / 2);
    const createdByPadding = Math.floor((totalWidth - createdBy.length) / 2);

    const centeredTitle = title.padStart(titlePadding + title.length).padEnd(totalWidth);
    const centeredCreatedBy = createdBy.padStart(createdByPadding + createdBy.length).padEnd(totalWidth);

    console.log(chalk.cyan.bold(line));
    console.log(chalk.cyan.bold(centeredTitle));
    console.log(chalk.green(centeredCreatedBy));
    console.log(chalk.cyan.bold(line));
}

// Ask User for Input
const askUserChoice = () => {
  printHeader();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.yellow("Choose an option:"));
  console.log(chalk.blue("1. Daily Transaction (Wrap ETH, runs every 24 hours)"));
  console.log(chalk.blue("2. Hourly Task (Runs hourly)"));
  console.log(chalk.blue("3. Weekly Transaction (Wrap ETH)(110tx/day)"));
  console.log(chalk.blue("4. Weekly Transaction (Send 0 ETH to Own Address)"));

  rl.question("Enter your choice (1, 2, 3 or 4): ", (answer) => {
    const privateKeyFilePath = 'private_keys.txt';

    if (answer === '1') {
      console.log(chalk.green("You chose Daily Transaction."));
      startDailyTransaction(privateKeyFilePath);
    } else if (answer === '2') {
      console.log(chalk.green("You chose Hourly Task."));
      startHourlyTask(privateKeyFilePath);
    } else if (answer === '3') {
      console.log(chalk.green("You chose Weekly Transaction (Wrap ETH)."));
      startWeeklyTransaction(privateKeyFilePath, 'wrap');
    } else if (answer === '4') {
      console.log(chalk.green("You chose Weekly Transaction (Send 0 ETH to Own Address)."));
      startWeeklyTransaction(privateKeyFilePath, 'send');
    } else {
      console.log(chalk.red("Invalid choice. Please enter 1, 2, 3, 4, or 5."));
      rl.close();
      askUserChoice();
    }
    rl.close();
  });
};

// Start the Program
askUserChoice();
