/**
 * V.ai Model Manager
 * Extracted Web-LLM implementation for V.ai
 * Model: Phi-3.5-mini-instruct-q4f16_1-MLC
 */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

export class VAIEngine {
    constructor() {
        this.engine = null;
        this.selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC";
        this.systemPrompt = "You are a helpful AI assistant."; // Default fallback
    }

    /**
     * Initializes the WebGPU engine and loads the model
     * @param {Function} onProgressCallback - Callback to track loading progress
     * @param {string} customSystemPrompt - (Optional) The system instructions for the AI
     */
    async init(onProgressCallback, customSystemPrompt = null) {
        try {
            this.engine = new webllm.MLCEngine();
            
            if (customSystemPrompt) {
                this.systemPrompt = customSystemPrompt;
            }
            
            if (onProgressCallback) {
                this.engine.setInitProgressCallback(onProgressCallback);
            }

            await this.engine.reload(this.selectedModel);
            return true;
        } catch (err) {
            console.error("V.ai Initialization Error:", err);
            throw new Error("WebGPU not supported or model failed to load.");
        }
    }

    /**
     * Sends a message to the model and streams the response
     * @param {string} userText - The user prompt
     * @param {Function} onChunk - Callback for each chunk of text received
     */
    async ask(userText, onChunk) {
        if (!this.engine) throw new Error("Engine not initialized. Call init() first.");

        const messages = [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: userText }
        ];

        try {
            const chunks = await this.engine.chat.completions.create({
                messages,
                stream: true,
            });

            let fullText = "";
            for await (const chunk of chunks) {
                const content = chunk.choices[0]?.delta?.content || "";
                fullText += content;
                if (onChunk) onChunk(fullText, content);
            }
            return fullText;
        } catch (error) {
            console.error("V.ai Stream Error:", error);
            throw error;
        }
    }
}
