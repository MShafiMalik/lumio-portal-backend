import { Test, TestingModule } from '@nestjs/testing';
import { EtherscanService } from './etherscan.service';
import { TransactionsService } from '../transactions/transactions.service';
import { JobQueueService } from '../job-queue/job-queue.service';
import { DbVersionService } from '../db-version/db-version.service';
import { getModelToken } from '@nestjs/mongoose';
import { Bridge } from './schema/bridges.schema';
import { CreateBridgeDto } from './dto/create-bridge.dto';
import { Model } from 'mongoose';
import { JsonRpcProvider, ethers } from 'ethers';
import { IJobs } from '../utils/interfaces/jobs.interface';
import { UniswapStatus } from '../transactions/schema/uniswap-status.schema';
import { Transaction } from '../transactions/schema/transaction.schema';
import { DbVersion } from '../db-version/schema/db-version.schema';
import { UtilsService } from '../utils/utils.service';
import { CHUNKS } from '../utils/constants/common';
import { JOBS } from '../utils/constants/jobs';

jest.mock('../utils/constants/jobs', () => {
  return {
    JOBS: [
      {
        jobName: 'Lumio',
        name: 'Lumio',
        contractAddress: '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc',
        startBlock: 19314571,
        rpcUrl: 'https://api.etherscan.io/api',
        topics: [
          '0x35d79ab81f2b2017e19afb5c5571778877782d7a8786f5907f93b0f4702f4f23',
        ],
        abi: [],
        getArgsData: (argsData: any) => ({
          user: argsData[1],
          amount: BigInt(argsData[2]).toString(),
        }),
        chalk: 'yellow',
      },
    ],
  };
});

const mockEthersProvider = {
  getBlockNumber: jest.fn(),
  getLogs: jest.fn(),
};

const mockEthersContract = {
  interface: {
    parseLog: jest
      .fn()
      .mockReturnValue({ args: { user: 'mockUser', amount: '100' } }),
  },
};

jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');

  return {
    ...originalModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => mockEthersProvider),
    Contract: jest.fn().mockImplementation(() => mockEthersContract),
  };
});

describe('EtherscanService', () => {
  let etherscanService: EtherscanService;
  let transactionsService: TransactionsService;
  let jobQueueService: JobQueueService;
  let bridgeModel: Model<Bridge>;
  let mockProvider: jest.Mocked<JsonRpcProvider>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtherscanService,
        TransactionsService,
        JobQueueService,
        DbVersionService,
        UtilsService,
        {
          provide: getModelToken(Bridge.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(UniswapStatus.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(DbVersion.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(DbVersion.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    etherscanService = module.get<EtherscanService>(EtherscanService);
    jobQueueService = module.get<JobQueueService>(JobQueueService);
    bridgeModel = module.get<Model<Bridge>>(getModelToken(Bridge.name));
    mockProvider = new JsonRpcProvider() as jest.Mocked<JsonRpcProvider>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(etherscanService).toBeDefined();
  });

  describe('addBridgeData', () => {
    it('should add bridge data to the database', async () => {
      const createBridgeDto: CreateBridgeDto = {
        bridgeName: 'TestBridge',
        startBlock: 0,
      };
      const expectedResult = { ...createBridgeDto, _id: 'mockId' };
      jest
        .spyOn(bridgeModel, 'create')
        .mockResolvedValueOnce(expectedResult as any);

      const result = await etherscanService.addBridgeData(createBridgeDto);

      expect(result).toEqual(expectedResult);
      expect(bridgeModel.create).toHaveBeenCalledWith(createBridgeDto);
    });
  });

  describe('getBridgeData', () => {
    it('should get bridge data from the database by bridgeName', async () => {
      const bridgeName = 'TestBridge';
      const expectedResult = { bridgeName, startBlock: 0 };
      jest
        .spyOn(bridgeModel, 'findOne')
        .mockResolvedValueOnce(expectedResult as any);

      const result = await etherscanService.getBridgeData(bridgeName);

      expect(result).toEqual(expectedResult);
      expect(bridgeModel.findOne).toHaveBeenCalledWith({ bridgeName });
    });
  });

  describe('updateBridgeData', () => {
    it('should update bridge data in the database', async () => {
      const bridgeName = 'TestBridge';
      const startBlock = 100;
      jest
        .spyOn(bridgeModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(jest.fn());

      await etherscanService.updateBridgeData(bridgeName, startBlock);

      expect(bridgeModel.findOneAndUpdate).toHaveBeenCalledWith(
        { bridgeName },
        { startBlock },
      );
    });
  });

  describe('runSingleJob', () => {
    it('should run a single job and add transactions to transactionsService', async () => {
      const jobData: IJobs = {
        startBlock: 0,
        contractAddress: '0x123abc',
        abi: [],
        topics: [],
        name: 'TestJob',
        getArgsData: jest.fn((argsData) => ({
          user: argsData.user,
          amount: argsData.amount,
        })),
        rpcUrl: 'http://rpc-mock-url',
        chalk: 'green',
        jobName: 'job',
        transService: transactionsService,
        etherscanService: etherscanService,
        chunks: CHUNKS,
      };

      jest
        .spyOn(transactionsService, 'addBulkTransactions')
        .mockResolvedValueOnce();

      jest
        .spyOn(ethers, 'Contract')
        .mockImplementation(() => mockEthersContract as any);

      const mockUpdateBridgeData = jest.fn().mockImplementation();

      jest
        .spyOn(etherscanService, 'updateBridgeData')
        .mockImplementation(mockUpdateBridgeData);

      await etherscanService.runSingleJob(jobData);

      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
      expect(mockProvider.getLogs).toHaveBeenCalled();
    });

    it('should catch and log errors', async () => {
      const jobData: IJobs = {
        startBlock: 0,
        contractAddress: '0x123abc',
        abi: [],
        topics: [],
        name: 'TestJob',
        getArgsData: jest.fn((argsData) => ({
          user: argsData.user,
          amount: argsData.amount,
        })),
        rpcUrl: 'http://rpc-mock-url',
        chalk: 'green',
        jobName: 'job',
        transService: transactionsService,
        etherscanService: etherscanService,
        chunks: CHUNKS,
      };

      jest.spyOn(mockProvider, 'getBlockNumber').mockResolvedValueOnce(100);

      jest
        .spyOn(transactionsService, 'addBulkTransactions')
        .mockResolvedValueOnce();

      jest
        .spyOn(ethers, 'Contract')
        .mockImplementation(() => mockEthersContract as any);

      const consoleErrorSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const mockUpdateBridgeData = jest.fn().mockImplementation();

      jest
        .spyOn(etherscanService, 'updateBridgeData')
        .mockImplementation(() => {
          throw new Error('updateBridgeData error');
        });

      await etherscanService.runSingleJob(jobData);

      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
      expect(mockProvider.getLogs).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(mockUpdateBridgeData).not.toHaveBeenCalled();
      expect(transactionsService.addBulkTransactions).not.toHaveBeenCalled();
    });
  });

  describe('runAllJobs', () => {
    it('should create jobs for all JOBS and update startBlock if necessary', async () => {
      const mockDbData = {
        bridgeName: 'Lumio',
        startBlock: 19314571,
      };

      jest
        .spyOn(etherscanService, 'getBridgeData')
        .mockResolvedValue(mockDbData);

      jest.spyOn(jobQueueService, 'createJobWithWorker').mockResolvedValue();

      await etherscanService.runAllJobs();

      for (const job of JOBS) {
        expect(etherscanService.getBridgeData).toHaveBeenCalledWith(
          job.jobName,
        );

        expect(jobQueueService.createJobWithWorker).toHaveBeenCalledWith({
          jobData: job,
          jobName: job.jobName,
          jobFunction: etherscanService.runSingleJob,
        });
      }
    });
  });
});
