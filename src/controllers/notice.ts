import { Handler } from 'express';
import Notice from '../models/notice';

export const get: Handler = async (req, res, next) => {
  const userId = req.user.id;
  let query = Notice.find({to: userId}).sort({timestamp: -1}).populate({path: 'from', select: '_id username role'})
  if (req.query && req.query.limit) {
    query = query.limit(parseInt(req.query.limit));
  }
  query
    .then(notices => {
      if (notices) {
        res.status(200).json({ notices });
      } else {
        return next({ statusCode: 404, error: true, errormessage: "No notice found" });
      }
    })
    .catch(
      err => next({ 
        statusCode: 500, 
        error: true, 
        errormessage: err 
      })
    );
}

export const remove: Handler = async (req, res, next) => {
  const userId = req.user.id;
  const noticeId = req.params.noticeId;
  Notice.findOne({_id: noticeId})
    .then(notice => {
      if (notice) {
        notice.to = notice.to.filter(u => `${u}` != userId);
        notice.save((err, data) => {
          if (err) {
            return next({ statusCode: 500, error: true, errormessage: "Notice DB errors" });
          }
          res.status(200).end();
        });
      } else {
        return next({ statusCode: 404, error: true, errormessage: "No notice found" });
      }
    })
    .catch(
      err => next({
        statusCode: 500,
        error: true,
        errormessage: err
      })
    );
}