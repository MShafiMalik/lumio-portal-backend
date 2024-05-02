import { Module } from '@nestjs/common';
import { EtherscanService } from './etherscan.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { JobQueueModule } from '../job-queue/job-queue.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Bridge, BridgeSchema } from './schema/bridges.schema';
import { DbVersionModule } from '../db-version/db-version.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bridge.name, schema: BridgeSchema }]),
    TransactionsModule,
    JobQueueModule,
    DbVersionModule,
  ],
  providers: [EtherscanService],
  exports: [EtherscanService],
})
export class EtherscanModule {}
