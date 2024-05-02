import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { TOKEN_NAMES } from './constants/token-names';
import { ConfigModule } from '@nestjs/config';
import { ITokenPricesInUsd } from './interfaces/token-prices-in-usd.interface';
ConfigModule.forRoot();

@Injectable()
export class UtilsService {
  async getTokensPricesInUsed(): Promise<ITokenPricesInUsd> {
    const response = {
      ethereum: 0,
      pepe: 0,
      pork: 0,
      usdt: 0,
      usdc: 0,
    };

    try {
      const coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
      const coingeckoApiUrl =
        process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
      const tokensStr = Object.values(TOKEN_NAMES).join(',');
      const url = `${coingeckoApiUrl}/simple/price?ids=${tokensStr}&vs_currencies=usd&x_cg_demo_api_key=${coingeckoApiKey}`;
      const result = await axios.get(url);

      for (const [key, tokenName] of Object.entries(TOKEN_NAMES)) {
        if (result.data[tokenName]) {
          response[key] = result.data[tokenName].usd || 0;
        }
      }

      return response;
    } catch (error) {
      console.log('Error:', error.message);
      return response;
    }
  }

  getBlastArgsData(argsData: any) {
    return {
      user: argsData[0],
      amount: BigInt(argsData[2]).toString(),
    };
  }

  getLumioArgsData(argsData: any) {
    return {
      user: argsData[1],
      amount: BigInt(argsData[2]).toString(),
    };
  }

  getLumioPepePorkArgsData(argsData: any) {
    return {
      user: argsData[3],
      amount: BigInt(argsData[4]).toString(),
    };
  }
}
