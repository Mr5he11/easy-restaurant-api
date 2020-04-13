import { Handler } from 'express'
import User from '../models/user'

const login: Handler = async (req, res, next) => {

  // If we reach this point, the user is successfully authenticated and
  // has been injected into req.user

  // We now generate a JWT with the useful user data
  // and return it as response

  let token;
  let refresh;
  let user = new User(req.user);

  try {
    token = await user.generateToken();
    refresh = await user.generateRefreshToken(req.ip);
  }
  catch (error) {
    return next({ statusCode: 500, error: true, errormessage: "Error generating token" })
  }

  res.status(200).json({
    error: false,
    errormessage: "",
    token: token,
    session: refresh
  });

}

export default login;