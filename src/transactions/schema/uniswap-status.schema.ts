import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UniswapDocument = HydratedDocument<UniswapStatus>;

@Schema()
export class UniswapStatus {
  @Prop({ required: true, unique: true })
  walletAddress: string;

  @Prop({ required: true })
  status: boolean;
}
export const UniswapStatusSchema = SchemaFactory.createForClass(UniswapStatus);
