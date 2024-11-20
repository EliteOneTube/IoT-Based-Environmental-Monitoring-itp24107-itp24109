import mongoose from 'mongoose';
import { weather } from '../types/database';

export default class MongoDBManager {
    constructor(private uri: string) {}

    private weatherSchema = new mongoose.Schema<weather>({
        temperature: Number,
        humidity: Number,
        timestamp: String
    });

    private userSchema = new mongoose.Schema({
        userId: String,
        token: String
    });

    private weatherModel = mongoose.model<weather>('Weather', this.weatherSchema);

    private userModel = mongoose.model('User', this.userSchema);

    async connect(): Promise<void> {
        try {
            await mongoose.connect(this.uri);

            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    }

    async addWeatherData(temperature: number, humidity: number, timestamp: string): Promise<void> {
        const weatherData = new this.weatherModel({
            temperature,
            humidity,
            timestamp
        });

        await weatherData.save();
    }

    async getWeatherData(): Promise<weather[]> {
        return this.weatherModel.find();
    }

    async addUser(userId: string, token: string): Promise<void> {
        const user = new this.userModel({
            userId,
            token
        });

        await user.save();
    }

    async verifyToken(token: string): Promise<boolean> {
        return await this.userModel.find({ token }).countDocuments() > 0;
    }
}