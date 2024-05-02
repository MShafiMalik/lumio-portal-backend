import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TransactionsModule } from './transactions/transactions.module';
import { JobQueueModule } from './job-queue/job-queue.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EtherscanModule } from './etherscan/etherscan.module';
import { DbVersionModule } from './db-version/db-version.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STRING),
    EtherscanModule,
    JobQueueModule,
    TransactionsModule,
    DbVersionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
