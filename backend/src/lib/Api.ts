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

        this.database = database;

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

        router.use('/swagger', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));

        router.route('/weather')
        .all(this.authenticateToken.bind(this))
        .post(this.addWeatherData.bind(this))
        .get(this.getWeatherData.bind(this));

        // router.post('/weather', this.authenticateToken.bind(this), async (req: Request, res: Response) => {
        //     console.log(req.body);

        //     const { temperature, humidity, timestamp } = req.body;

        //     await this.database.addWeatherData(temperature, humidity, timestamp);

        //     res.json({
        //         message: 'Weather data saved'
        //     });
        // });

        // router.get('/weather', this.authenticateToken.bind(this), async (req: Request, res: Response) => {
        //     const weatherData = await this.database.getWeatherData();

        //     res.json(weatherData);
        // });

        this.express.use('/', router);
    }

    private async addWeatherData(req: Request, res: Response): Promise<void> {
        console.log(req.body);
        const { temperature, humidity, timestamp } = req.body;

        await this.database.addWeatherData(temperature, humidity, timestamp);

        res.json({
            message: 'Weather data saved'
        });
    }

    private async getWeatherData(req: Request, res: Response): Promise<void> {
        const weatherData = await this.database.getWeatherData();

        res.json(weatherData);
    }
}