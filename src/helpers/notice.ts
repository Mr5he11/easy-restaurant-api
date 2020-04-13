import Notice from '../models/notice';
import User, { Roles } from '../models/user';
import SocketHelper from '../helpers/socketio'

export function pushNotice(from: string, to: string, message: string, cb: Function) {
  const findBlock: any = {};
  if (to == Roles.Waiter || to == Roles.Cook || to == Roles.Bartender || to == Roles.CashDesk) {
    findBlock.role = to;
  } else {
    findBlock._id = to;
  }
  User
    .find(findBlock)
    .select('_id')
    .then(userIds => {
      if (userIds && userIds.length > 0) {
        console.log(userIds);
        Notice
          .create({ from: from, to: userIds, message: message })
          .then(message => {
            console.log(message);
            cb();
            if (!!findBlock._id) {
              SocketHelper.emitToUser(findBlock._id, 'fetchNotices');
            }
            if (!!findBlock.role) {
              SocketHelper.emitToRoom(findBlock.role, 'fetchNotices');
            }
            return true;
          })
          .catch(err => {
            console.error(err);
            return false;
          });
      } else {
        console.error("ERROR: no user for notice delivering");
      }
    })
    .catch(err => {
      console.error(err);
      return false;
    });
}