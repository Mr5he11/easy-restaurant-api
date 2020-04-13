import { Handler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

const renew: Handler = async (req, res, next) => {

  let token = req.headers!['authorization']!.split(" ")[1];
  let session = req.body.session;

  // Read authorization token from header
  let tokenPayload = <any>jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'], ignoreExpiration: true }, (err, decoded) => {
    if (!err) return decoded;
  });
  // Read refresh token from body
  let sessionPayload = <any>jwt.verify(session, process.env.JWT_SECRET!, { algorithms: ['HS256'], ignoreExpiration: true }, (err, decoded) => {
    if (!err) return decoded
  });

  // Check that both tokens belong to the same user
  if (!tokenPayload || !sessionPayload || tokenPayload.username != sessionPayload.username)
    return next({ statusCode: 401, error: true, errormessage: "Unauthorized" });

  let user = await User.findOne({ "username": sessionPayload.username, "sessions.token": sessionPayload.token })
    .then(user => user)
    .catch(() => null)

  // If user is not found, user does not exists or refresh token is not valid anymore
  if (!user)
    return next({ statusCode: 401, error: true, errormessage: "Unauthorized" });

  // Generate a new authorization token token for the user
  let newToken = user.generateToken();
  res.status(200).json({
    error: false,
    errormessage: "",
    token: newToken,
    session: session
  });
}

export default renew;