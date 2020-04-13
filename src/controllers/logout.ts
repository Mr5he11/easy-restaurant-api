import { Handler } from 'express'
import jwt from 'jsonwebtoken';
import User from '../models/user'
import SocketIoHelper from '../helpers/socketio';

const logout: Handler = async (req, res, next) => {

  let session = req.body.session;
  
  let payload = <any>jwt.verify(session, process.env.JWT_SECRET!, { algorithms: ['HS256'], ignoreExpiration: true  }, (err, decoded) => {
    if (err)
      return next({ statusCode: 401, error: true, errormessage: "Unauthorized" });
    else
      return decoded;
  });

  User.updateOne(
    { username: req.user.username },
    { $pull: { sessions: { token: payload.token } } }
  )
  .then(() => {
    try {
      SocketIoHelper.disconnectSocket(payload.id);
    } catch (e) {
      console.error(e);
    }
    res.status(200).json({ error: false, errormessage: "", result: "User succesfully logged out" })
  })
  .catch(err => next({ statusCode: 500, error: true, errormessage: err }))
}

export default logout;