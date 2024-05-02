import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DbVersionDocument = HydratedDocument<DbVersion>;

@Schema()
export class DbVersion {
  @Prop({ required: true, unique: true })
  version: string;
}

export const DbVersionSchema = SchemaFactory.createForClass(DbVersion);
