import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('[Database Engine] Critical Initialization Failure: MONGODB_URI missing in environment variables.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri, {
      autoIndex: true, 
    });

    console.log('⚡ [Database Engine] MongoDB Connected Successfully to Remote Cluster.');
  } catch (error) {
    console.error('[Database Engine] Connection Refused / Topology Exception:', error);
    process.exit(1);
  }
};