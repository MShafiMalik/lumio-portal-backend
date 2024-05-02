import { Test, TestingModule } from '@nestjs/testing';
import { UtilsService } from '../utils/utils.service';
import axios from 'axios';

jest.mock('axios');

describe('UtilsService', () => {
  let utilsService: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilsService],
    }).compile();
    utilsService = module.get<UtilsService>(UtilsService);
  });

  afterEach((done) => {
    jest.clearAllMocks();
    done();
  });

  it('Should be defined', () => {
    expect(utilsService).toBeDefined();
  });

  describe('getTokensPricesInUsed', () => {
    it('should get tokens prices in USD', async () => {
      const responseMock = {
        ethereum: 36.338,
        pepe: 0.00000734,
        pork: 0,
        usdc: 0,
        usdt: 0,
      };
      const ethToUsdResponse = {
        data: {
          ethereum: {
            usd: 36.338,
          },
          pepe: { usd: 0.00000734 },
          pork: { usd: 0.00002715 },
        },
      };

      (
        axios.get as jest.MockedFunction<typeof axios.get>
      ).mockResolvedValueOnce(ethToUsdResponse);

      const convertedValue = await utilsService.getTokensPricesInUsed();
      expect(convertedValue).toEqual(responseMock);
    });

    it('should return 0 when there is an error during conversion', async () => {
      (
        axios.get as jest.MockedFunction<typeof axios.get>
      ).mockRejectedValueOnce(new Error('API error'));

      const convertedValue = await utilsService.getTokensPricesInUsed();
      expect(convertedValue).toEqual({
        ethereum: 0,
        pepe: 0,
        pork: 0,
        usdc: 0,
        usdt: 0,
      });
    });
  });

  describe('getBlastArgsData', () => {
    it('should extract Blast args data correctly', () => {
      const argsData = ['user1', 'Blast', 100];
      const result = utilsService.getBlastArgsData(argsData);
      expect(result).toEqual({ user: 'user1', amount: '100' });
    });
  });

  describe('getLumioArgsData', () => {
    it('should extract Lumio args data correctly', () => {
      const argsData = ['Lumio', 'user2', 200];
      const result = utilsService.getLumioArgsData(argsData);

      expect(result).toEqual({ user: 'user2', amount: '200' });
    });
  });
});
