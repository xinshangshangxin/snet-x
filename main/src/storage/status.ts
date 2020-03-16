import { StatusModel } from './db';
import { Status } from './interface';

async function get(): Promise<Status> {
  const status = await StatusModel.findOne({ isDefault: true });
  return status || {};
}

async function save(status: Partial<Omit<Status, '_id'>>) {
  return StatusModel.updateOne(
    {
      isDefault: true,
    },
    {
      $set: {
        ...status,
        isDefault: true,
      },
    },
    {
      upsert: true,
    }
  );
}

export { get as getStatus, save as saveStatus };
