import express, { Request, Response, NextFunction } from 'express';
import Database from './Database';
import swaggerUi from 'swagger-ui-express';

export default class Api {
    public express: express.Application;

    private database: Database;

    private swaggerDocument = require('../../swagger.json');

    constructor(database: Database) {
        this.express = express();
        this.mountRoutes();

        const port = process.env.API_PORT || 3000;

        this.express.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }

    private async authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) {
            res.sendStatus(401);
            return;
        }

        if (await this.database.verifyToken(token)) {
            next();
        } else {
            res.sendStatus(403); // Forbidden
        }
    }

    private mountRoutes(): void {
        const router = express.Router();

        router.use('/api/docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));

        router.get('/weather', this.authenticateToken.bind(this), async (req: Request, res: Response) => {
            const weatherData = await this.database.getWeatherData();

            res.json(weatherData);
        });

        router.post('/weather', this.authenticateToken.bind(this), async (req: Request, res: Response) => {
            const { temperature, humidity, timestamp } = req.body;

            await this.database.addWeatherData(temperature, humidity, timestamp);

            res.json({
                message: 'Weather data saved'
            });
        });

        this.express.use('/', router);
    }
}