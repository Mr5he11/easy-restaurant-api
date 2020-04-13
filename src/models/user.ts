import { Document, Schema, Model, model } from 'mongoose';
import jsonwebtoken from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export enum Roles {
  Cook = "cook",
  Waiter = "waiter",
  CashDesk = "cash_desk",
  Bartender = "bartender"
}

export interface IUser extends Document {
  readonly _id: Schema.Types.ObjectId,
  username: string,
  password: string,
  name: {
    first: string,
    last: string
  }
  role: string,
  sessions: [{
    ip: string,
    token: string,
    issued: Date
  }]
  validatePassword: (pwd: string) => boolean,
  generateToken: (exp?: string) => string,
  generateRefreshToken: (ip: string) => Promise<string>
}

// declare user static members and methods here
interface IUserModel extends Model<IUser> {
  roles: Readonly<object>
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: {
    type: String,
    set: (value: any) => bcrypt.hashSync(value, 12)
  },
  name: {
    first: String,
    last: String
  },
  sessions: [{
    ip: String,
    token: String,
    issued: Date
  }],
  role: { type: String, enum: Object.values(Roles), required: true }
})

UserSchema.methods.validatePassword = function (pwd: string): boolean {
  return bcrypt.compareSync(pwd, this.password);
}

UserSchema.methods.generateToken = function (exp: string = '5m'): string {
  return jsonwebtoken.sign({
    username: this.username,
    role: this.role,
    id: this._id
  }, process.env.JWT_SECRET!, { expiresIn: exp })
}

UserSchema.methods.generateRefreshToken = async function (ip: string): Promise<string> {
  let token = randomBytes(48).toString("base64");

  if (!token)
    throw ("Error generating random token")

  let session = {
    ip: ip,
    token: token,
    issued: new Date()
  };

  let signedToken;

  await this.updateOne({ $push: { sessions: session } })
    .then(u => {
      signedToken = jsonwebtoken.sign({
        username: this.username,
        role: this.role,
        id: this._id,
        token: token
      }, process.env.JWT_SECRET!)
    })
  return (signedToken || '')

}

UserSchema.statics.roles = Object.values(Roles);

const User = model<IUser, IUserModel>('User', UserSchema)
export default User