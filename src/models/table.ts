import { Document, Schema, model } from "mongoose";
import { IOrder, OrderSchema } from "./order";

export const ServiceSchema: Schema = new Schema({
	covers: { type: Number, required: true },
	waiter: { type: Schema.Types.ObjectId, required: true, ref: "User" },
	orders: [OrderSchema],
	timestamp: { type: Date },
	done: { type: Boolean, default: false }
});

export interface ITable extends Document {
	readonly _id: Schema.Types.ObjectId;
	number: number;
	seats: number,
	busy: boolean;
	services: [any];
}

const TableSchema: Schema = new Schema({
	number: { type: Number, required: true, unique: true },
	seats: { type: Number, required: true },
	busy: { type: Boolean, default: false },
	services: [ServiceSchema]
});

const Table = model<ITable>('Table', TableSchema);
export default Table; 