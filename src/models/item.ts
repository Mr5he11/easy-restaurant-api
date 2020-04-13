import { Document, Schema, model, Model } from "mongoose";

export enum Types {
	Beverage = "beverage",
	Food = "food"
}

export interface IItem extends Document {
	readonly _id: Schema.Types.ObjectId;
	readonly name: string;
	price: number;
	type: string;
	subtype: string;
	time?: number;
};

const ItemSchema: Schema = new Schema({
	name: { type: String, unique: true, required: true },
	price: { type: Number, required: true },
	type: { type: String, required: true, enum: Object.values(Types) },
	subtype: { type: String },
	time: { type: Number },
});

interface IItemModel extends Model<IItem> {
	types: Readonly<object>
}

ItemSchema.statics.types = Object.values(Types);

const Item = model<IItem, IItemModel>('Item', ItemSchema);
export default Item; 