# Lumio Portal Backend

## Description

Lumio Portal Backend is a project designed to provide an API for tracking the total value transferred from Layer 1 (L1) to Layer 2 (L2) using a bridge on L1. It calculates and exposes data such as the total value transferred from a wallet and the total number of transfers.

## Installation

### Prerequisites

- Node.js
- Nestjs
- MongoDB
- Redis

### Installation Steps

1. Clone this repository to your local machine.
2. Navigate to the project directory.
3. Install dependencies.

```shell
npm install
```

4. Create a copy of `.env.example` and name it `.env`.

```shell
cp .env.example .env
```

5. Fill in the required environment variables in the `.env` file.

- `MONGODB_CONNECTION_STRING`: Connection URI for MongoDB.

6. Change Configuration ( Optional )

   To change project configuration goto `src/utils/constants.ts`

   ```shell
    BLAST_DATE = # transactions deposits happen before 29 FEb 9:00 PM UTC
    ProcessDelayMilliseconds = ; # delay in milliseconds for Queue
    CHUNKS = ; # number of blocks to read per process

    ETH_DECIMAL = # Eth Decimal number;

    UNISWAP_ROUTERS = {
      swapRouter02: # Swap Router02 Contract Address
      swapRouter: # Swap Router Contract Address,
      universalRouter: # Universal Router Contract Address,
    };

    ETHERSCAN_API_URL = # Etherscan API url

    BRIDGES = {
      lumio: # Lumio bridge,
      optimism: # Optimism bridge,
      blast: # Blast bridge,
    };

    JOBS = {
      jobName: # Job Name,
      name:  # Bridge Name,
      contractAddress:  # Contract Address,
      startBlock: # Start Block Number,
      rpcUrl: # RPC URL (takes from env),
      topics: [] # Array of topic Ids,
      abi: # contract ABI,
      getArgsData: # functon to get data from decoded data,
      chalk: # chalk color to denote job
    }
   ```

7. Start the application.

   ```shell
   npm start
   ```

## API Endpoints

### Get Total Value Transferred & total transactions for a Wallet

- **URL**: `/transactions/:walletAddress`
- **Method**: `GET`
- **Description**: Retrieves the total value transferred and total count of transactions for the specified wallet address.
- **Response**:

  ```shell
  {
    statusCode: number;
    success: boolean;
    data: {
      walletInfo: {
        walletAddress: string;
        totalTransVolumeEth: string;
        totalTransVolumeUsd: string;
        totalTrans: number;
      };
      walletStatus: {
        lumio: boolean;
        optimism: boolean;
        blast: boolean;
        earlyBird: boolean;
        uniswap: boolean;
      }
    }
  }
  ```

## Usage

Once the application is running, you can make requests to the provided API endpoints to retrieve data about total value transferred from a wallet and the total number of transfers.
