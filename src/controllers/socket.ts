import { Handler } from 'express';
import SocketIoHelper from '../helpers/socketio'
import { pushNotice } from '../helpers/notice';
import { Roles } from '../models/user';

export const emit: Handler = async (req, res, next) => {
  const userId = req.body.userId;
  const eventName = req.body.eventName;
  const room = req.body.room;
  const message = req.body.message;
  pushNotice(req.user.id, userId ? userId : room, message, () => {
    if (!!userId) {
      SocketIoHelper.emitToUser(userId, eventName);
    }
    if (!!room) {
      SocketIoHelper.emitToRoom(room, eventName);
    }
  });
  res.status(202).end();
}