import { Test, TestingModule } from '@nestjs/testing';
import { DbVersionService } from './db-version.service';
import { getModelToken } from '@nestjs/mongoose';
import { DB_VERSION } from '../utils/constants/common';
import { DbVersion } from './schema/db-version.schema';
import { Transaction } from '../transactions/schema/transaction.schema';
import { Bridge } from '../etherscan/schema/bridges.schema';
import { UniswapStatus } from '../transactions/schema/uniswap-status.schema';

describe('DbVersionService', () => {
  let dbVersionService: DbVersionService;

  const mockDbVersionModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };
  const mockTransactionModel = {
    deleteMany: jest.fn(),
  };
  const mockBridgeModel = {
    deleteMany: jest.fn(),
  };
  const mockUniswapStatusModel = {
    deleteMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbVersionService,
        {
          provide: getModelToken(DbVersion.name),
          useValue: mockDbVersionModel,
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: getModelToken(Bridge.name),
          useValue: mockBridgeModel,
        },
        {
          provide: getModelToken(UniswapStatus.name),
          useValue: mockUniswapStatusModel,
        },
      ],
    }).compile();

    dbVersionService = module.get<DbVersionService>(DbVersionService);
  });

  it('should be defined', () => {
    expect(dbVersionService).toBeDefined();
  });

  describe('resetAllModels', () => {
    it('should reset models if db version is different', async () => {
      const mockedDbVersion = { version: 1 };
      jest
        .spyOn(mockDbVersionModel, 'findOne')
        .mockResolvedValueOnce(mockedDbVersion);

      await dbVersionService.resetAllModels();
      expect(mockDbVersionModel.findOne).toHaveBeenCalled();
    });

    it('should not reset models if db version is the same', async () => {
      const mockedDbVersion = { version: DB_VERSION };
      jest
        .spyOn(mockDbVersionModel, 'findOne')
        .mockResolvedValueOnce(mockedDbVersion);

      await dbVersionService.resetAllModels();
      expect(mockDbVersionModel.findOne).toHaveBeenCalled();
    });
  });

  describe('truncateAllModels', () => {
    it('should truncate all models', async () => {
      jest.spyOn(mockTransactionModel, 'deleteMany').mockImplementation();
      jest.spyOn(mockBridgeModel, 'deleteMany').mockImplementation();
      jest.spyOn(mockUniswapStatusModel, 'deleteMany').mockImplementation();
      jest.spyOn(mockDbVersionModel, 'deleteMany').mockImplementation();

      await dbVersionService.truncateAllModels();
      expect(mockTransactionModel.deleteMany).toHaveBeenCalled();
      expect(mockBridgeModel.deleteMany).toHaveBeenCalled();
      expect(mockUniswapStatusModel.deleteMany).toHaveBeenCalled();
      expect(mockDbVersionModel.deleteMany).toHaveBeenCalled();
    });
  });
});
