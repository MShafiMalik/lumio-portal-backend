import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BridgeDocument = HydratedDocument<Bridge>;

@Schema()
export class Bridge {
  @Prop({ required: true })
  bridgeName: string;

  @Prop({ required: true })
  startBlock: number;
}

export const BridgeSchema = SchemaFactory.createForClass(Bridge);
