import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chat } from '../chat.js';

describe('Chat', () => {
  const mockOllama = { chat: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('talk', () => {
    it('should call ollama.chat with the correct parameters', async () => {
      const chatInstance = new Chat(mockOllama);
      const stream = true;
      const model = 'testModel';
      const contents = 'function example() {}';

      const expectedResponse = { message: 'response' };
      mockOllama.chat.mockResolvedValue(expectedResponse);

      const result = await chatInstance.talk(stream, model, contents);

      expect(mockOllama.chat).toHaveBeenCalledWith({
        stream: stream,
        model: model,
        messages: [
          {
            role: 'user',
            content: `Document the following code using JSDoc:\n ${contents}`,
          },
        ],
      });

      // Assert that the result matches the expected response
      expect(result).toBe(expectedResponse);
    });

    it('should handle errors thrown by ollama.chat', async () => {
      const chatInstance = new Chat(mockOllama);
      const stream = true;
      const model = 'testModel';
      const contents = 'function example() {}';

      const error = new Error('Chat failed');
      mockOllama.chat.mockRejectedValue(error);

      await expect(chatInstance.talk(stream, model, contents)).rejects.toThrow('Chat failed');
    });
  });
});
