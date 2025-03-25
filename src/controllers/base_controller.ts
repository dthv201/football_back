import { Request, Response } from "express";
import { isValidObjectId, Model } from "mongoose";

class BaseController<T> {
    model: Model<T>;
    constructor(model: any) {
        this.model = model;
    }

    async getAll(req: Request, res: Response) {
        const filter = req.query.owner;
        try {
            if (filter) {
                const item = await this.model.find({ owner: filter });
                
                res.send(item);
            } else {
                const items = await this.model.find();
                console.log("item in getall :", items);
                res.send(items);
            }
        } catch (error) {
            res.status(400).send(error);
        }
    };

    async getById(req: Request, res: Response) {
        const id = req.params.id;

        try {
            const item = await this.model.findById(id);
            if (item != null) {
                res.send(item);
            } else {
                res.status(404).send("not found");
            }
        } catch (error) {
            res.status(400).send(error);
        }
    };

    async create(req: Request, res: Response) {
      console.log("req.body in create :", req.body);
        const body = req.body;
        try {
            const item = await this.model.create(body);   
            res.status(201).send(item);
        } catch (error) {
            res.status(400).send(error);
        }
    };
    
    async update(req: Request, res: Response): Promise<void> {
      const id = req.params.id;
      const body = req.body;
      try {
        const updatedItem = await this.model.findByIdAndUpdate(id, body, { new: true });
        if (!updatedItem) {
          res.status(404).send("not found");
          return;
        }
        res.status(200).send(updatedItem);
      } catch (error) {
        res.status(400).send(error);
      }
    };
    

  async deleteItem(req: Request, res: Response): Promise<void> {
    const itemId = req.params.id;
    if (!isValidObjectId(itemId)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }
    try {
      const deletedItem = await this.model.findByIdAndDelete(itemId);
      if (!deletedItem) {
        res.status(404).json({ message: 'not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete item', error });
    }
  }
    
  
}


export default BaseController