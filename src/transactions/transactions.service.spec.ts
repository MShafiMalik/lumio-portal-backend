import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction } from './schema/transaction.schema';
import { UniswapStatus } from './schema/uniswap-status.schema';
import {
  blastBridgeDataMock,
  createTransactionDbDataMock,
  createTransactionMockData,
  tokensPricesInUsed,
  transLumioBlastMock,
  transactionMock1,
  transactionMock2,
  uniswapStatusMock,
  walletAddressMock1,
  walletDataMock,
} from './mocks/transactions.mcok';
import { InternalServerErrorException } from '@nestjs/common';
import { BRIDGES } from '../utils/constants/bridges';
import { UNISWAP_ROUTERS } from '../utils/constants/uniswap-routers';
import { BridgeDataDto } from './dto/bridge-data.dto';
import { UtilsService } from '../utils/utils.service';

import axios from 'axios';
jest.mock('axios');

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let utilsService: UtilsService;

  const mockTransactionModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockUniswapStatusModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        UtilsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: getModelToken(UniswapStatus.name),
          useValue: mockUniswapStatusModel,
        },
      ],
    }).compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    utilsService = module.get<UtilsService>(UtilsService);
  });

  afterEach((done) => {
    jest.clearAllMocks();
    done();
  });

  it('TransactionsService Should be defined', () => {
    expect(transactionsService).toBeDefined();
  });

  describe('addBulkTransactions', () => {
    it('Should create transactions in bulk', async () => {
      const transactionsMock = [transactionMock1, transactionMock2];
      const mockJobName = 'Lumio';

      const createTransactionSpy = jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValueOnce();

      await transactionsService.addBulkTransactions(
        transactionsMock,
        mockJobName,
      );

      expect(createTransactionSpy).toHaveBeenCalledTimes(
        transactionsMock.length,
      );
      expect(createTransactionSpy).toHaveBeenCalledWith(
        transactionMock1,
        mockJobName,
      );
      expect(createTransactionSpy).toHaveBeenCalledWith(
        transactionMock2,
        mockJobName,
      );
    });
  });

  describe('createTransaction', () => {
    it('Should update existing transaction with new wallet data', async () => {
      const mockJobName = 'Lumio';

      jest
        .spyOn(mockTransactionModel, 'findOne')
        .mockResolvedValue(createTransactionDbDataMock);

      await transactionsService.createTransaction(
        createTransactionMockData,
        mockJobName,
      );

      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
      expect(createTransactionDbDataMock.save).toHaveBeenCalled();
    });

    it('Should return a function when data already exist', async () => {
      const mockJobName = 'Lumio';

      jest.spyOn(mockTransactionModel, 'findOne').mockResolvedValue(null);

      await transactionsService.createTransaction(
        transactionMock1,
        mockJobName,
      );

      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        transactionMock1,
      );
    });

    it('Should log error when an error occurs during transaction creation', async () => {
      const mockJobName = 'Lumio';

      const error = new Error();
      jest.spyOn(mockTransactionModel, 'create').mockRejectedValueOnce(error);

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await transactionsService.createTransaction(
        transactionMock1,
        mockJobName,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Lumio: Error creating transaction:',
        error,
      );
    });
  });

  describe('getUniswapStatus', () => {
    it('Should return status from database if found', async () => {
      jest
        .spyOn(mockUniswapStatusModel, 'findOne')
        .mockResolvedValueOnce(uniswapStatusMock);

      const response =
        await transactionsService.getUniswapStatus(walletAddressMock1);
      expect(response).toEqual(true);
      expect(mockUniswapStatusModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
    });

    it('Should call Etherscan API and return true if status not found in database and API returns true', async () => {
      const uniswapStatus = true;
      jest.spyOn(mockUniswapStatusModel, 'findOne').mockResolvedValueOnce(null);
      const callEtherscanApiDataSpy = jest
        .spyOn(transactionsService, 'callEtherscanApiData')
        .mockResolvedValue(uniswapStatus);

      const response =
        await transactionsService.getUniswapStatus(walletAddressMock1);

      expect(response).toEqual(true);
      expect(callEtherscanApiDataSpy).toHaveBeenCalledTimes(
        Object.keys(UNISWAP_ROUTERS).length,
      );
      for (const key of Object.keys(UNISWAP_ROUTERS)) {
        expect(callEtherscanApiDataSpy).toHaveBeenCalledWith(
          UNISWAP_ROUTERS[key],
          walletAddressMock1,
        );
      }
      expect(mockUniswapStatusModel.create).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
        status: true,
      });
    });

    it('Should call Etherscan API and return false if status not found in database and API returns false', async () => {
      const uniswapStatus = false;
      jest.spyOn(mockUniswapStatusModel, 'findOne').mockResolvedValueOnce(null);
      const callEtherscanApiDataSpy = Object.keys(UNISWAP_ROUTERS).map(() =>
        jest
          .spyOn(transactionsService, 'callEtherscanApiData')
          .mockResolvedValueOnce(uniswapStatus),
      );

      const response =
        await transactionsService.getUniswapStatus(walletAddressMock1);

      expect(response).toEqual(false);
      Object.keys(UNISWAP_ROUTERS).forEach((key, index) =>
        expect(callEtherscanApiDataSpy[index]).toHaveBeenCalledWith(
          UNISWAP_ROUTERS[key],
          walletAddressMock1,
        ),
      );
      expect(mockUniswapStatusModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
    });

    it('Should throw InternalServerErrorException when an error occurs', async () => {
      jest
        .spyOn(mockUniswapStatusModel, 'findOne')
        .mockRejectedValueOnce(new InternalServerErrorException());

      await expect(
        transactionsService.getUniswapStatus(walletAddressMock1),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTransVolume', () => {
    it('Should get bridge data and return sum of bridge values', () => {
      const expectedVolume = 90755.100332;
      const volume = transactionsService.getTransVolume(blastBridgeDataMock);

      expect(volume).toEqual(expectedVolume);
    });
  });

  describe('getBlastVolumeWithDateRange', () => {
    it('should return correct volume when blastTransactions contains multiple items with timestamps before the cutoff date', () => {
      const blastTransactions: BridgeDataDto[] = blastBridgeDataMock;
      const expectedVolume = 2589.3453659999996;

      const volume =
        transactionsService.getBlastVolumeWithDateRange(blastTransactions);

      expect(volume).toEqual(expectedVolume);
    });
  });

  describe('getWalletStatuses', () => {
    it('Should get bridge data and return sum of bridge values and status', async () => {
      const responseMock = {
        blast: false,
        earlyBird: false,
        optimism: false,
        uniswap: false,
        pepe: false,
        pork: false,
        usdc: false,
        usdt: false,
      };
      const ethPrice = 2;
      const pepePrice = 0.005;
      const porkPrice = 0.0003;
      const usdcPrice = 1;
      const usdtPrice = 1;

      jest
        .spyOn(transactionsService, 'getUniswapStatus')
        .mockResolvedValueOnce(true);

      const response = await transactionsService.getWalletStatuses(
        walletAddressMock1,
        walletDataMock,
        ethPrice,
        pepePrice,
        porkPrice,
        usdcPrice,
        usdtPrice,
      );

      expect(response).toEqual(responseMock);
    });
  });

  describe('getTransactionsByWallet', () => {
    it('Should get wallet address and return wallet status and empty wallet data when wallet is not found in db', async () => {
      const responseMock = {
        walletInfo: {
          totalTransVolumeEth: '0',
          totalTransVolumeUsd: '0',
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

      jest.spyOn(mockTransactionModel, 'findOne').mockResolvedValueOnce(null);

      const response =
        await transactionsService.getTransactionsByWallet(walletAddressMock1);

      expect(response).toEqual(responseMock);
    });

    it('Should get wallet address and return wallet status and wallet data', async () => {
      const responseMock = {
        walletInfo: {
          totalTransVolumeEth: '0.0100',
          totalTransVolumeUsd: '0.3634',
          totalTrans: 1,
        },
        walletStatus: {
          blast: false,
          earlyBird: false,
          optimism: false,
          uniswap: false,
          pepe: false,
          pork: false,
          usdc: false,
          usdt: false,
        },
      };

      jest
        .spyOn(mockTransactionModel, 'findOne')
        .mockResolvedValueOnce(transLumioBlastMock);
      jest
        .spyOn(utilsService, 'getTokensPricesInUsed')
        .mockResolvedValueOnce(tokensPricesInUsed);

      const response =
        await transactionsService.getTransactionsByWallet(walletAddressMock1);

      expect(response).toEqual(responseMock);
      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
      expect(utilsService.getTokensPricesInUsed).toHaveBeenCalledWith();
    });

    it('Should get wallet address and return wallet status and wallet data as null when lumio transactions not found in db', async () => {
      const responseMock = {
        walletInfo: {
          totalTransVolumeEth: '0.0000',
          totalTransVolumeUsd: '0.0000',
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

      const walletData = transLumioBlastMock.walletData.filter(
        (item) => item.bridgeName !== BRIDGES.lumio,
      );
      const transactionMock = {
        walletAddress: transLumioBlastMock.walletAddress,
        walletData,
      };
      jest
        .spyOn(mockTransactionModel, 'findOne')
        .mockResolvedValueOnce(transactionMock);
      jest
        .spyOn(utilsService, 'getTokensPricesInUsed')
        .mockResolvedValueOnce(tokensPricesInUsed);

      const response =
        await transactionsService.getTransactionsByWallet(walletAddressMock1);

      expect(response).toEqual(responseMock);

      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
      expect(utilsService.getTokensPricesInUsed).toHaveBeenCalledWith();
    });

    it('Should throw InternalServerError when any issue in db', async () => {
      jest
        .spyOn(mockTransactionModel, 'findOne')
        .mockRejectedValueOnce(new InternalServerErrorException());

      await expect(
        transactionsService.getTransactionsByWallet(walletAddressMock1),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockTransactionModel.findOne).toHaveBeenCalledWith({
        walletAddress: walletAddressMock1,
      });
    });
  });

  describe('callEtherscanApiData', () => {
    it('should return false when API Key is not found', async () => {
      delete process.env.ETHERSCAN_API_KEY;
      const contractAddress = 'contractAddress123';
      const fromAddress = 'fromAddress123';

      const result = await transactionsService.callEtherscanApiData(
        contractAddress,
        fromAddress,
      );
      expect(result).toBe(false);
    });

    it('should return true when API response has transactions within 24 hours', async () => {
      process.env.ETHERSCAN_API_KEY = 'key123';
      const contractAddress = 'contractAddress123';
      const fromAddress = 'fromAddress123';
      const currentDate = new Date();
      const yesterdayDate = new Date(currentDate);
      yesterdayDate.setDate(currentDate.getDate() - 1);

      const apiResponse = {
        data: {
          result: [{ timeStamp: Math.floor(yesterdayDate.getTime() / 1000) }],
        },
      };

      (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue(
        apiResponse,
      );

      const result = await transactionsService.callEtherscanApiData(
        contractAddress,
        fromAddress,
      );

      expect(axios.get).toHaveBeenCalledWith(expect.any(String), {
        params: {
          module: 'account',
          action: 'txlist',
          contractaddress: contractAddress,
          address: fromAddress,
          page: 1,
          offset: 1,
          apikey: process.env.ETHERSCAN_API_KEY,
        },
      });
      expect(result).toBe(true);
    });

    it('should return true when API response has transactions not within 24 hours', async () => {
      process.env.ETHERSCAN_API_KEY = 'key123';
      const contractAddress = 'contractAddress123';
      const fromAddress = 'fromAddress123';
      const currentDate = new Date();
      const yesterdayDate = new Date(currentDate);
      yesterdayDate.setDate(currentDate.getDate() + 5);

      const apiResponse = {
        data: {
          result: [{ timeStamp: Math.floor(yesterdayDate.getTime() / 1000) }],
        },
      };

      (axios.get as jest.MockedFunction<typeof axios.get>).mockResolvedValue(
        apiResponse,
      );

      const result = await transactionsService.callEtherscanApiData(
        contractAddress,
        fromAddress,
      );

      expect(axios.get).toHaveBeenCalledWith(expect.any(String), {
        params: {
          module: 'account',
          action: 'txlist',
          contractaddress: contractAddress,
          address: fromAddress,
          page: 1,
          offset: 1,
          apikey: process.env.ETHERSCAN_API_KEY,
        },
      });
      expect(result).toBe(false);
    });

    it('should return false when there is an error in API response', async () => {
      const contractAddress = 'contractAddress123';
      const fromAddress = 'fromAddress123';

      (axios.get as jest.MockedFunction<typeof axios.get>).mockRejectedValue(
        new Error('API Error'),
      );

      const result = await transactionsService.callEtherscanApiData(
        contractAddress,
        fromAddress,
      );

      expect(result).toBe(false);
    });
  });
});
