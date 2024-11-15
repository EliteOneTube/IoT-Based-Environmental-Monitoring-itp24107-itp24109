import Api from './Api';
import MQTTManager from './MQTTManager';
import Database from './Database';

export default class Manager {
    private api: Api;

    private mqtt: MQTTManager;

    private database: Database;

    constructor() {
        this.database = new Database(process.env.DB_URL || 'mongodb://localhost:27017/iot');

        this.api = new Api(this.database);

        this.database.connect();

        this.mqtt = new MQTTManager(process.env.MQTT_HOST || 'mqtt://localhost:1883');

        this.mqtt.subscribe('weathernest');

        this.mqtt.onMessage((topic, message) => {
            // Parse the message as JSON and check if it has the expected properties
            let data;

            try {
                data = JSON.parse(message.toString());
            } catch (error) {
                console.error('Error parsing message:', error);
                return;
            }

            if (!data.temperature || !data.humidity || !data.timestamp) {
                console.error('Invalid message:', data);
                return;
            }

            // Add the data to the database
            this.database.addWeatherData(data.temperature, data.humidity, data.timestamp);
        });
    }
}