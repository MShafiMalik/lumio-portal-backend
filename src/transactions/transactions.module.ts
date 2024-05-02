import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { TransactionsController } from './transactions.controller';
import {
  UniswapStatus,
  UniswapStatusSchema,
} from './schema/uniswap-status.schema';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: UniswapStatus.name, schema: UniswapStatusSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, UtilsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
