import { Injectable, OnModuleInit } from '@nestjs/common';
import { JsonRpcProvider, ethers } from 'ethers';
import { TransactionsService } from '../transactions/transactions.service';
import { CHUNKS, TOKEN_ADDRESSES } from '../utils/constants/common';
import { JobQueueService } from '../job-queue/job-queue.service';
import { InjectModel } from '@nestjs/mongoose';
import { Bridge } from './schema/bridges.schema';
import { Model } from 'mongoose';
import { IJobs } from '../utils/interfaces/jobs.interface';
import { CreateBridgeDto } from './dto/create-bridge.dto';
import { WalletDataDto } from '../transactions/dto/wallet-data.dto';
import { DbVersionService } from '../db-version/db-version.service';
import { TokensEnum } from '../utils/enums/tokens.enum';
import { JOBS, tokenJobName } from '../utils/constants/jobs';
import axios from 'axios';
const chalk = import('chalk');

@Injectable()
export class EtherscanService implements OnModuleInit {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly jobQueueService: JobQueueService,
    private readonly dbVersionService: DbVersionService,
    @InjectModel(Bridge.name)
    private readonly bridgeModel: Model<Bridge>,
  ) {}
  async onModuleInit() {
    await this.dbVersionService.resetAllModels();

    const redis = this.jobQueueService.getRedisConnection();
    redis.flushdb();
    this.runAllJobs();
  }

  async runSingleJob(job: IJobs): Promise<IJobs> {
    const newChalk = await chalk;

    try {
      const {
        startBlock,
        contractAddress,
        abi,
        topics,
        name,
        getArgsData,
        transService,
        etherscanService,
        chunks,
      } = job;

      const provider = new JsonRpcProvider(job.rpcUrl);
      let endblock = await provider.getBlockNumber();
      endblock =
        startBlock + chunks < endblock ? startBlock + chunks : endblock;

      const logs = await provider.getLogs({
        fromBlock: startBlock,
        toBlock: endblock,
        address: contractAddress,
        topics,
      });
      console.log(
        newChalk[job.chalk](
          `${job.jobName}: Block ${startBlock} - ${endblock}, chunks: ${chunks}`,
        ),
      );

      const contract = new ethers.Contract(contractAddress, abi, provider);

      const filteredData = [];

      const processLogData = (timestamp: number, number: number, log: any) => {
        const argsData = contract.interface.parseLog(log).args;

        let tokenName = TokensEnum.eth;
        if (job.jobName === tokenJobName) {
          const findToken = Object.keys(TOKEN_ADDRESSES).find(
            (key) => TOKEN_ADDRESSES[key] === argsData[0],
          );
          tokenName = findToken ? TokensEnum[findToken] : tokenName;
        }

        const { user, amount } = getArgsData(argsData);

        const index = filteredData.findIndex(
          (item) => item.walletAddress === user,
        );
        const transData = {
          hash: log.transactionHash,
          timeStamp: String(Number(timestamp)),
          blockNumber: String(Number(number)),
          value: BigInt(amount).toString(),
          token: tokenName,
        };

        if (index === -1) {
          const walletData = {
            bridgeName: name,
            contractAddress: log.address,
            bridgeData: [transData],
          };

          filteredData.push({
            walletAddress: user,
            walletData: [walletData],
          });
        } else {
          const walletData = filteredData[index].walletData;

          const walletDataIndex = walletData.findIndex(
            (wData: WalletDataDto) => wData.bridgeName === name,
          );

          if (walletDataIndex !== -1) {
            walletData[walletDataIndex].bridgeData.push(transData);
          } else {
            walletData.push({
              bridgeName: name,
              contractAddress: log.address,
              bridgeData: [transData],
            });
          }

          filteredData[index].walletData = walletData;
        }
      };

      const getLogData = async (log: any, attempts: number) => {
        try {
          const response = await axios.post(
            job.rpcUrl,
            {
              jsonrpc: '2.0',
              method: 'eth_getBlockByNumber',
              params: [`0x${Number(log.blockNumber).toString(16)}`, false],
              id: 1,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );

          const { timestamp, number } = response.data.result;

          processLogData(timestamp, number, log);
        } catch (error) {
          if (attempts >= 5) throw new Error(error);
          attempts++;
          await getLogData(log, attempts);
        }
      };

      const promisesArr = logs.map((log) => getLogData(log, 1));
      await Promise.all(promisesArr);

      await transService.addBulkTransactions(filteredData, job.jobName);
      await etherscanService.updateBridgeData(job.jobName, endblock);

      job.startBlock = endblock;
      job.chunks = CHUNKS;

      return job;
    } catch (error) {
      console.log(
        newChalk[job.chalk](`${job.jobName}: `),
        newChalk.red('Error: ', error),
      );
      if (
        error.error &&
        (error.error.code === -32602 ||
          error.error.code === -32020 ||
          error.error.code === -32005)
      ) {
        job.chunks =
          Math.floor(job.chunks / 2) === 0 ? 200 : Math.floor(job.chunks / 2);
        this.runSingleJob(job);
      }
    }
  }

  async runAllJobs() {
    for (const job of JOBS) {
      const dbData = await this.getBridgeData(job.jobName);
      if (!dbData) {
        const newBridge = await this.addBridgeData({
          bridgeName: job.jobName,
          startBlock: job.startBlock,
        });
        job.startBlock = newBridge.startBlock;
      } else {
        job.startBlock = dbData.startBlock;
      }

      job.transService = this.transactionsService;
      job.etherscanService = this;

      await this.jobQueueService.createJobWithWorker({
        jobData: job,
        jobName: job.jobName,
        jobFunction: this.runSingleJob,
      });
    }
  }

  async addBridgeData(createBridgeDto: CreateBridgeDto): Promise<Bridge> {
    return this.bridgeModel.create(createBridgeDto);
  }

  async getBridgeData(bridgeName: string): Promise<Bridge> {
    return this.bridgeModel.findOne({ bridgeName });
  }

  async updateBridgeData(
    bridgeName: string,
    startBlock: number,
  ): Promise<void> {
    await this.bridgeModel.findOneAndUpdate({ bridgeName }, { startBlock });
  }
}
