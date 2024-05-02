import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TransactionDto } from './dto/transaction.dto';
import { Transaction } from './schema/transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionResponseDto } from './dto/response.dto';
import { WalletInfoDto } from './dto/wallet-info.dto';
import {
  BLAST_DATE,
  ETHERSCAN_API_URL,
  ETH_DECIMAL,
} from '../utils/constants/common';
import { BRIDGES } from '../utils/constants/bridges';
import { UNISWAP_ROUTERS } from '../utils/constants/uniswap-routers';
import { BridgeData } from './schema/bridge-data.schema';
import axios from 'axios';
import { WalletData } from './schema/wallet-data.schema';
import { UniswapStatus } from './schema/uniswap-status.schema';
import { UtilsService } from '../utils/utils.service';
import { TokensEnum } from '../utils/enums/tokens.enum';
import { WalletStatusDto } from './dto/wallet-status.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(UniswapStatus.name)
    private readonly uniswapStatusModel: Model<UniswapStatus>,
    private readonly utilsService: UtilsService,
  ) {}

  async addBulkTransactions(
    transactions: TransactionDto[],
    jobName: string,
  ): Promise<void> {
    await Promise.all(
      transactions.map(async (item) => {
        return await this.createTransaction(item, jobName);
      }),
    );
  }

  async createTransaction(
    transactionDto: TransactionDto,
    jobName: string,
  ): Promise<void> {
    try {
      const transactionDb = await this.transactionModel.findOne({
        walletAddress: transactionDto.walletAddress,
      });

      if (!transactionDb) {
        await this.transactionModel.create(transactionDto);
        return;
      }

      for (const dtoItem of transactionDto.walletData) {
        const dbItemIndex = transactionDb.walletData.findIndex(
          (dbItem) => dbItem.bridgeName === dtoItem.bridgeName,
        );
        if (dbItemIndex === -1) {
          transactionDb.walletData.push(dtoItem);
        } else {
          const dbHashes = transactionDb.walletData[dbItemIndex].bridgeData.map(
            (data) => data.hash,
          );

          for (const bridgeDataItem of dtoItem.bridgeData) {
            if (!dbHashes.includes(bridgeDataItem.hash)) {
              transactionDb.walletData[dbItemIndex].bridgeData.push(
                bridgeDataItem,
              );
            }
          }
        }
      }

      await transactionDb.save();
    } catch (error) {
      console.error(`${jobName}: Error creating transaction:`, error);
      if (error.name === 'VersionError') {
        await this.createTransaction(transactionDto, jobName);
      }
    }
  }

  async getTransactionsByWallet(
    walletAddress: string,
  ): Promise<TransactionResponseDto> {
    try {
      const result = await this.transactionModel.findOne({ walletAddress });
      if (!result) {
        return {
          walletInfo: {
            totalTransVolumeEth: '0.0',
            totalTransVolumeUsd: '0.0',
            totalTrans: 0,
          },
          walletStatus: {
            optimism: false,
            blast: false,
            earlyBird: false,
            uniswap: false,
            pepe: false,
            pork: false,
            usdc: false,
            usdt: false,
          },
        };
      }

      const {
        ethereum: ethPrice,
        pepe: pepePrice,
        pork: porkPrice,
        usdc: usdcPrice,
        usdt: usdtPrice,
      } = await this.utilsService.getTokensPricesInUsed();

      const lumioTrans = result.walletData.find(
        (item) => item.bridgeName === BRIDGES.lumio,
      );
      const walletInfo: WalletInfoDto = this.getWalletInfo(
        lumioTrans,
        ethPrice,
        pepePrice,
        porkPrice,
        usdcPrice,
        usdtPrice,
      );

      const walletStatus = await this.getWalletStatuses(
        walletAddress,
        result.walletData,
        ethPrice,
        pepePrice,
        porkPrice,
        usdcPrice,
        usdtPrice,
      );

      return {
        walletInfo,
        walletStatus,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  getWalletInfo(
    lumioData: WalletData,
    ethPrice: number,
    pepePrice: number,
    porkPrice: number,
    usdcPrice: number,
    usdtPrice: number,
  ): WalletInfoDto {
    let totalTransVolume = 0;

    if (!lumioData || !lumioData.bridgeData) {
      return {
        totalTransVolumeEth: '0.0',
        totalTransVolumeUsd: '0.0',
        totalTrans: 0,
      };
    }

    for (const bridgeData of lumioData.bridgeData) {
      switch (bridgeData.token) {
        case TokensEnum.eth: {
          const total = Number(BigInt(bridgeData.value)) / Number(ETH_DECIMAL);
          totalTransVolume += total;
          break;
        }
        case TokensEnum.pepe: {
          const total = Number(BigInt(bridgeData.value)) / Number(ETH_DECIMAL);
          const pepeToEth = (total * pepePrice) / ethPrice;
          totalTransVolume += pepeToEth;
          break;
        }
        case TokensEnum.pork: {
          const total = Number(BigInt(bridgeData.value)) / Number(ETH_DECIMAL);
          const porkToEth = (total * porkPrice) / ethPrice;
          totalTransVolume += porkToEth;
          break;
        }
        case TokensEnum.usdc: {
          const total = Number(BigInt(bridgeData.value)) / 1000000;
          const usdcToEth = (total * usdcPrice) / ethPrice;
          totalTransVolume += usdcToEth;
          break;
        }
        case TokensEnum.usdt: {
          const total = Number(BigInt(bridgeData.value)) / 1000000;
          const usdtToEth = (total * usdtPrice) / ethPrice;
          totalTransVolume += usdtToEth;
        }
      }
    }

    const totalTransVolumeEth =
      totalTransVolume > 0 && totalTransVolume < 0.0001
        ? '<0.01'
        : totalTransVolume.toFixed(4);

    return {
      totalTransVolumeEth,
      totalTransVolumeUsd: (ethPrice * totalTransVolume).toFixed(4),
      totalTrans: lumioData.bridgeData.length,
    };
  }

  async getWalletStatuses(
    walletAddress: string,
    walletData: WalletData[],
    ethPrice: number,
    pepePrice: number,
    porkPrice: number,
    usdcPrice: number,
    usdtPrice: number,
  ): Promise<WalletStatusDto> {
    const blastTransactions = [];
    let lumioTrans = [];
    let lumioStatus = false;
    let optimismStatus = false;
    let earlyBirdStatus = false;

    for (const wallet of walletData) {
      switch (wallet.bridgeName) {
        case BRIDGES.lumio:
          lumioTrans = wallet.bridgeData;
          const lumioTransVolume = this.getTransVolume(wallet.bridgeData);
          lumioStatus = !!(Number(ethPrice) * lumioTransVolume >= 1);
          earlyBirdStatus = !!(Number(ethPrice) * lumioTransVolume > 0);
          break;
        case BRIDGES.blast:
          blastTransactions.push(...wallet.bridgeData);
          break;
        case BRIDGES.optimism:
          const optimismTransVolume = this.getTransVolume(wallet.bridgeData);
          optimismStatus = !!(Number(ethPrice) * optimismTransVolume >= 1);
          break;
      }
    }

    const uniswapStatus = await this.getUniswapStatus(walletAddress);

    const blastVolumeWithDateRange =
      this.getBlastVolumeWithDateRange(blastTransactions);
    const blastStatus = !!(Number(ethPrice) * blastVolumeWithDateRange >= 1);

    const { pepe, pork, usdc, usdt } = this.getTokenStatus(
      lumioTrans,
      pepePrice,
      porkPrice,
      usdcPrice,
      usdtPrice,
    );

    return {
      blast: !!(lumioStatus && blastStatus),
      earlyBird: !!(lumioStatus && earlyBirdStatus),
      optimism: !!(lumioStatus && optimismStatus),
      uniswap: !!(lumioStatus && uniswapStatus),
      pepe,
      pork,
      usdc,
      usdt,
    };
  }

  getTokenStatus(
    bridgeData: BridgeData[],
    pepePrice: number,
    porkPrice: number,
    usdcPrice: number,
    usdtPrice: number,
  ): { pepe: boolean; pork: boolean; usdc: boolean; usdt: boolean } {
    const pepeTrans = bridgeData.filter(
      (item) => item.token === TokensEnum.pepe,
    );
    const porkTrans = bridgeData.filter(
      (item) => item.token === TokensEnum.pork,
    );
    const pepeTransVolume = this.getTransVolume(pepeTrans);
    const porkTransVolume = this.getTransVolume(porkTrans);

    return {
      pepe: !!(Number(pepePrice) * pepeTransVolume >= 1),
      pork: !!(Number(porkPrice) * porkTransVolume >= 1),
      usdc: !!(Number(usdcPrice) * porkTransVolume >= 1),
      usdt: !!(Number(usdtPrice) * porkTransVolume >= 1),
    };
  }

  getTransVolume(bridgeData: BridgeData[]): number {
    const volume = bridgeData.reduce(
      (total: bigint, val: BridgeData) => total + BigInt(val.value),
      0n,
    );
    return Number(volume) / Number(ETH_DECIMAL);
  }

  getBlastVolumeWithDateRange(blastTransactions: BridgeData[]): number {
    const blastTransVolume_ = blastTransactions.reduce(
      (total: bigint, val: BridgeData) => {
        const timestamp = new Date(Number(val.timeStamp) * 1000); // Multiply by 1000 for seconds to milliseconds conversion
        const cutoffDate = new Date(BLAST_DATE); // 29 FEb 9:00 PM UTC

        if (timestamp < cutoffDate) {
          return total + val.value;
        } else {
          return total;
        }
      },
      0n,
    );
    return Number(blastTransVolume_) / Number(ETH_DECIMAL);
  }

  async getUniswapStatus(fromAddress: string): Promise<boolean> {
    const dbStatus = await this.uniswapStatusModel.findOne({
      walletAddress: fromAddress,
    });
    if (dbStatus) return dbStatus.status;

    let uniswapStatus = false;

    await Promise.all(
      Object.keys(UNISWAP_ROUTERS).map(async (key: string) => {
        const apiResponse = await this.callEtherscanApiData(
          UNISWAP_ROUTERS[key],
          fromAddress,
        );

        uniswapStatus = apiResponse;
      }),
    );

    if (uniswapStatus) {
      await this.uniswapStatusModel.create({
        walletAddress: fromAddress,
        status: uniswapStatus,
      });
    }

    return uniswapStatus;
  }

  async callEtherscanApiData(
    contractAddress: string,
    fromAddress: string,
  ): Promise<boolean> {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || null;
    if (!etherscanApiKey) {
      console.log('Etherscan API Error: API key is missing!');
      return false;
    }
    try {
      const apiResponse: any = await axios.get(ETHERSCAN_API_URL, {
        params: {
          module: 'account',
          action: 'txlist',
          contractaddress: contractAddress,
          address: fromAddress,
          page: 1,
          offset: 1,
          apikey: etherscanApiKey,
        },
      });

      for (const item of apiResponse?.data?.result) {
        const transactionTime = Number(item.timeStamp) * 1000;
        const currentDate = new Date();
        const diffInTime = currentDate.getTime() - transactionTime;
        const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));

        if (diffInDays > 0) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log('Etherscan API Error: ', error.message);
      return false;
    }
  }
}
