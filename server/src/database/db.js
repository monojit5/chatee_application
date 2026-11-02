import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

export const connectDb = async() => {
try {
    if (!process.env.DATABASE) {
        throw new Error('DATABASE is not configured.');
    }
    await mongoose.connect(process.env.DATABASE);
    console.log('Database connected');
} catch (error) {
    console.error('Could not connect to MongoDB:', error.message);
    throw error;
}
};