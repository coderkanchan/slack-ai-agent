import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error({ context: 'Database Engine Connection' }, '[Database Engine] Critical Initialization Failure: MONGODB_URI missing in environment variables.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    logger.info('⚡ [Database Engine] MongoDB Connected Successfully to Remote Cluster.');
  } catch (error) {
    logger.error({ error, context: 'Database Engine Connection' }, '[Database Engine] Connection Refused / Topology Exception:');
    process.exit(1);
  }
};