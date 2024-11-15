import * as mqtt from 'mqtt';

export default class MQTTManager {
    private client: mqtt.MqttClient;
    private host: string;
    private options: mqtt.IClientOptions;

    constructor(host: string, options?: mqtt.IClientOptions) {
        this.host = host;
        this.options = options || {};
        this.client = mqtt.connect(this.host, this.options);

        this.connect();
    }

    public connect(): void {
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
        });

        this.client.on('error', (err) => {
            console.error('Falied to connect to MQTT broker');
            this.client.end();
        });
    }

    public subscribe(topic: string): void {
        this.client.subscribe(topic, (err) => {
            if (err) {
                console.error('Failed to subscribe to topic: ', topic);
            } else {
                console.log(`Subscribed to topic: ${topic}`);
            }
        });
    }

    public onMessage(callback: (topic: string, message: Buffer) => void): void {
        this.client.on('message', (topic, message) => {
            callback(topic, message);
        });
    }

    public disconnect(): void {
        this.client.end(() => {
            console.log('Disconnected from MQTT broker');
        });
    }
}