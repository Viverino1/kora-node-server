import PQueue from 'p-queue';
import AnimePahe from './AnimePahe.js';

export class Indexer {
    static queue: PQueue = new PQueue({ concurrency: 1 });
    static async initialize() {
        setInterval(() => {

        }, 1000 * 15);
    }
}