import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { WalletDataDto } from '../dto/wallet-data.dto';
import { WalletDataSchema } from './wallet-data.schema';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema()
export class Transaction {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ type: [WalletDataSchema], default: [] })
  walletData: WalletDataDto[];

  @Prop({ default: now() })
  createdAt: Date;

  @Prop({ default: now() })
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
