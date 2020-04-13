import { Router } from 'express'
import * as controller from '../controllers/user'

const users = Router();

users.route('/')
  .get(controller.getAll)
  .post(controller.create)

users.route('/:username')
  .get(controller.get)
  .put(controller.update)
  .patch(controller.updatePartial)
  .delete(controller.remove)

export default users