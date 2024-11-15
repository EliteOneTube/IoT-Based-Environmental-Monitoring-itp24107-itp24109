import express, { Request, Response } from 'express';
import Database from './Database';
import swaggerUi from 'swagger-ui-express';

export default class Api {
    public express: express.Application;

    private database: Database;

    private swaggerDocument = require('../../swagger.json');

    constructor(database: Database) {
        this.express = express();
        this.mountRoutes();

        const port = process.env.PORT || 3000;

        this.express.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }

    private mountRoutes(): void {
        const router = express.Router();

        router.use('/', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));

        router.get('/weather', async (req: Request, res: Response) => {
            const weatherData = await this.database.getWeatherData();

            res.json(weatherData);
        });

        router.post('/weather', async (req: Request, res: Response) => {
            const { temperature, humidity, timestamp } = req.body;

            await this.database.addWeatherData(temperature, humidity, timestamp);

            res.json({
                message: 'Weather data saved'
            });
        });

        this.express.use('/', router);
    }
}