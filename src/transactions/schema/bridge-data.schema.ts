import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { TokensEnum } from '../../utils/enums/tokens.enum';

@Schema()
export class BridgeData {
  @Prop({ required: true })
  blockNumber: string;

  @Prop({ required: true })
  timeStamp: string;

  @Prop({ required: true, unique: true })
  hash: string;

  @Prop({ required: true })
  value: string;

  @Prop({
    type: String,
    required: true,
    enum: TokensEnum,
    default: TokensEnum.eth,
  })
  token: string;
}
export const BridgeDataSchema = SchemaFactory.createForClass(BridgeData);
