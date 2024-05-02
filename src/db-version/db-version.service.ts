import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DbVersion } from './schema/db-version.schema';
import { Model } from 'mongoose';
import { Transaction } from 'ethers';
import { Bridge } from '../etherscan/schema/bridges.schema';
import { UniswapStatus } from '../transactions/schema/uniswap-status.schema';
import { DB_VERSION } from '../utils/constants/common';

@Injectable()
export class DbVersionService {
  constructor(
    @InjectModel(DbVersion.name)
    private readonly dbVersionModel: Model<DbVersion>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Bridge.name)
    private readonly bridgeModel: Model<Bridge>,
    @InjectModel(UniswapStatus.name)
    private readonly uniswapStatusModel: Model<UniswapStatus>,
  ) {}

  async resetAllModels() {
    const dbVersion = await this.dbVersionModel.findOne();
    if (!dbVersion || dbVersion.version !== DB_VERSION) {
      await this.truncateAllModels();
      await this.dbVersionModel.create({ version: DB_VERSION });
    }
  }

  async truncateAllModels(): Promise<void> {
    await this.transactionModel.deleteMany({});
    await this.bridgeModel.deleteMany({});
    await this.uniswapStatusModel.deleteMany({});
    await this.dbVersionModel.deleteMany({});
  }
}
