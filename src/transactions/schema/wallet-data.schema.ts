import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { BridgeDataDto } from '../dto/bridge-data.dto';
import { BridgeDataSchema } from './bridge-data.schema';

@Schema()
export class WalletData {
  @Prop({ required: true })
  bridgeName: string;

  @Prop({ required: true })
  contractAddress: string;

  @Prop({ type: [BridgeDataSchema], default: [] })
  bridgeData: BridgeDataDto[];
}

export const WalletDataSchema = SchemaFactory.createForClass(WalletData);
