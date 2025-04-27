export class Module {
    constructor(client) {
        this.client = client;
    }

    register() {
        throw new Error('Method register() must be implemented');
    }
}