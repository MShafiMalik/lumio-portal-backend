import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import {
  Transaction,
  TransactionSchema,
} from '../src/transactions/schema/transaction.schema';
import { TransactionDto } from '../src/transactions/dto/transaction.dto';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { Model } from 'mongoose';
import { TokensEnum } from '../src/utils/enums/tokens.enum';

describe('TransactionsModule', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let transactionModel: Model<Transaction>;

  const mockWalletAddress = '0x05bFBa34a229dD926208dC4Bca5Be4e2d3235eE5';
  const mockWalletAddress_ = '0x05bFBa34a229dD926208dC4Bca5Be4e2d3235eE1';

  const mockData: TransactionDto = {
    walletAddress: mockWalletAddress,
    walletData: [
      {
        bridgeName: 'Lumio',
        contractAddress: '0xdB5C6b73CB1c5875995a42D64C250BF8BC69a8bc',
        bridgeData: [
          {
            blockNumber: '19315337',
            timeStamp: '1708994015',
            hash: '0x55c23fa89e41c1d8ed05bfbddcf8e53fbb08ee9c3a4557eb01274c6c4cd7b549',
            value: '200000000000000000',
            token: TokensEnum.eth,
          },
        ],
      },
      {
        bridgeName: 'Blast',
        contractAddress: '0x5F6AE08B8AeB7078cf2F96AFb089D7c9f51DA47d',
        bridgeData: [
          {
            blockNumber: '18616448',
            timeStamp: '1700525027',
            hash: '0xda087153fb9f0bbc216b9fa30338e546926842c7e325c2ae313837b6d629bb32',
            value: '1000000000000000000000',
            token: TokensEnum.eth,
          },
        ],
      },
      {
        bridgeName: 'Optimism',
        contractAddress: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
        bridgeData: [
          {
            blockNumber: '12687347',
            timeStamp: '1624409432',
            hash: '0x4104c59735b2d3ec4a7c817d0c40c3447408a2c31b4b886dd1e5f7e42d4902c9',
            value: '10000000000000000',
            token: TokensEnum.eth,
          },
        ],
      },
    ],
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TransactionsModule,
        MongooseModule.forRootAsync({
          useFactory: async () => {
            mongoServer = await MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            return {
              uri,
            };
          },
        }),
        MongooseModule.forFeature([
          { name: Transaction.name, schema: TransactionSchema },
        ]),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    transactionModel = module.get<Model<Transaction>>(
      getModelToken(Transaction.name),
    );
  });

  beforeEach(async () => {
    await transactionModel.create(mockData);
  });

  afterEach(async () => {
    await transactionModel.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('/transactions/:wallet (GET)', () => {
    it('should return response with valid types when transactions exist for wallet address', async () => {
      const response = await request(app.getHttpServer()).get(
        `/transactions/${mockWalletAddress}`,
      );

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(
        expect.arrayContaining(['walletInfo', 'walletStatus']),
      );

      const walletInfo = response.body.walletInfo;
      expect(typeof walletInfo).toBe('object');
      expect(Object.keys(walletInfo)).toEqual(
        expect.arrayContaining([
          'walletAddress',
          'totalTransVolumeEth',
          'totalTransVolumeUsd',
          'totalTrans',
        ]),
      );
      expect(typeof walletInfo.walletAddress).toBe('string');
      expect(typeof walletInfo.totalTransVolumeEth).toBe('string');
      expect(typeof walletInfo.totalTransVolumeUsd).toBe('string');
      expect(typeof walletInfo.totalTrans).toBe('number');

      const walletStatus = response.body.walletStatus;
      expect(typeof walletStatus).toBe('object');
      expect(Object.keys(walletStatus)).toEqual(
        expect.arrayContaining(['optimism', 'blast', 'earlyBird', 'uniswap']),
      );
      expect(typeof walletStatus.optimism).toBe('boolean');
      expect(typeof walletStatus.blast).toBe('boolean');
      expect(typeof walletStatus.earlyBird).toBe('boolean');
      expect(typeof walletStatus.uniswap).toBe('boolean');
    });

    it('should return response with null for walletInfo when transactions donot exist for wallet address', async () => {
      const response = await request(app.getHttpServer()).get(
        `/transactions/${mockWalletAddress_}`,
      );

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(
        expect.arrayContaining(['walletInfo', 'walletStatus']),
      );

      const walletInfo = response.body.walletInfo;
      expect(walletInfo).toBe(null);

      const walletStatus = response.body.walletStatus;
      expect(typeof walletStatus).toBe('object');
      expect(Object.keys(walletStatus)).toEqual(
        expect.arrayContaining(['optimism', 'blast', 'earlyBird', 'uniswap']),
      );
      expect(typeof walletStatus.optimism).toBe('boolean');
      expect(typeof walletStatus.blast).toBe('boolean');
      expect(typeof walletStatus.earlyBird).toBe('boolean');
      expect(typeof walletStatus.uniswap).toBe('boolean');
    });
  });
});
