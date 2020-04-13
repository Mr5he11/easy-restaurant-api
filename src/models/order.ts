import { Document, Schema, model } from "mongoose";
import { Types } from './item'

export interface IOrder extends Document {
	readonly _id: Schema.Types.ObjectId;
	readonly created_at: Schema.Types.Date;
	processed: Schema.Types.Date;
	type: string;
	items: [{
		item: Schema.Types.ObjectId,
		quantity: number,
		cook: Schema.Types.ObjectId,
		start: Date,
		end: Date
	}];
};

export const OrderSchema: Schema = new Schema({
	created_at: { type: Date, default: Date.now() },
	processed: { type: Date, default: null },
	type: { type: String, required: true, enum: Object.values(Types) },
	items: [{
		item: { type: Schema.Types.ObjectId, required: true, ref: "Item" },
		quantity: { type: Number, required: true },
		cook: { type: Schema.Types.ObjectId, ref: "User" },
		start: Date,
		end: Date
	}]
});

const Order = model<IOrder>('Order', OrderSchema);
export default Order; 