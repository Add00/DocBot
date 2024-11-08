class Chat {
    #ollama;

    constructor(ollama) {
        this.#ollama = ollama;
    }

    async talk(stream, model, contents) {
        return await this.#ollama.chat({
            stream: stream,
            model: model,
            messages: [
                {
                    role: 'user',
                    content: `Document the following code using JSDoc:\n ${contents}`,
                },
            ],
        });
    }
}

export { Chat };