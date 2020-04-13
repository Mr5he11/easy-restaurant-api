import { Router } from 'express'
import * as controller from '../controllers/notice'

const notices = Router();

notices.route('/')
  // this route can be used to retrieve all items or just those of a certain type
  // by adding 'itemType' in the request body
  .get(controller.get)

notices.route('/:noticeId')
  .delete(controller.remove)

export default notices