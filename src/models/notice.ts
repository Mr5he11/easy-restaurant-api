import { Document, Schema, model } from "mongoose";

export interface INotice extends Document {
  readonly _id: Schema.Types.ObjectId;
  readonly from: Schema.Types.ObjectId;
  to: Schema.Types.ObjectId[];
  readonly message: Schema.Types.ObjectId;
  readonly timestamp: Schema.Types.ObjectId;
};

const NoticeSchema: Schema = new Schema({
  from: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: "User" 
  },
  to: {
    required: true,
    type: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  message: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now()
  }
});

const Notice = model<INotice>('Notice', NoticeSchema);
export default Notice; 