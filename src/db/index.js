import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('Db connected successfully');
    } catch (error) {
        console.log('Error in connecting Database', error);
        process.exit(1);
    }
};

export default connectDB;