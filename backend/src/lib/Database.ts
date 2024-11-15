import mongoose from 'mongoose';
import { weather } from '../types/database';

export default class MongoDBManager {
    constructor(private uri: string) {}

    private weatherSchema = new mongoose.Schema<weather>({
        temperature: Number,
        humidity: Number,
        timestamp: String
    });

    private weatherModel = mongoose.model<weather>('Weather', this.weatherSchema);

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
}