import { Module } from '@nestjs/common';
import { DbVersionService } from './db-version.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DbVersion, DbVersionSchema } from './schema/db-version.schema';
import { Transaction } from 'ethers';
import { Bridge, BridgeSchema } from '../etherscan/schema/bridges.schema';
import {
  UniswapStatus,
  UniswapStatusSchema,
} from '../transactions/schema/uniswap-status.schema';
import { TransactionSchema } from '../transactions/schema/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DbVersion.name, schema: DbVersionSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Bridge.name, schema: BridgeSchema },
      { name: UniswapStatus.name, schema: UniswapStatusSchema },
    ]),
  ],
  providers: [DbVersionService],
  exports: [DbVersionService],
})
export class DbVersionModule {}
