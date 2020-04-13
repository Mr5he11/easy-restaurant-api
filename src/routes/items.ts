import { Router } from 'express'
import * as controller from '../controllers/item'

const items = Router();

items.route('/')
    // this route can be used to retrieve all items or just those of a certain type
    // by adding 'itemType' in the request body
    .get(controller.get)
    .post(controller.create)

items.route('/:itemName')
    .get(controller.get)
    .put(controller.update)
    .delete(controller.remove)

export default items