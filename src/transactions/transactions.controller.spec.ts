import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { UtilsService } from '../utils/utils.service';
import { getModelToken } from '@nestjs/mongoose';
import { Transaction } from './schema/transaction.schema';
import { UniswapStatus } from './schema/uniswap-status.schema';
import { walletAddressMock1 } from './mocks/transactions.mcok';

describe('TransactionsController', () => {
  let transactionsController: TransactionsController;
  let transactionsService: TransactionsService;

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
      controllers: [TransactionsController],
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

    transactionsController = module.get<TransactionsController>(
      TransactionsController,
    );
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  afterEach((done) => {
    jest.clearAllMocks();
    done();
  });

  describe('getTransactionsByWallet', () => {
    it('Should get wallet address and return wallet status and wallet data', async () => {
      const responseMock = {
        walletInfo: {
          totalTransVolumeEth: '0.0100',
          totalTransVolumeUsd: '36.3380',
          totalTrans: 1,
        },
        walletStatus: {
          optimism: false,
          blast: false,
          earlyBird: true,
          uniswap: true,
          pepe: false,
          pork: false,
          usdc: false,
          usdt: false,
        },
      };

      jest
        .spyOn(transactionsService, 'getTransactionsByWallet')
        .mockResolvedValueOnce(responseMock);

      const result =
        await transactionsController.getTransactionsByWallet(
          walletAddressMock1,
        );
      expect(result).toEqual(responseMock);
    });
  });
});
