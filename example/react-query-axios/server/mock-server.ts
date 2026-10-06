import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Interface representing a Todo item in the mock backend.
 */
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

/**
 * Interface representing a Chat message in the mock backend.
 */
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'bot';
  timestamp: number;
}

/** In-memory Map storage for Todos keyed by ID */
const todosMap = new Map<number, Todo>([
  [1, { id: 1, title: 'Learn Vite Request Logger', completed: true }],
  [2, { id: 2, title: 'Integrate React Query & Axios', completed: true }],
  [3, { id: 3, title: 'Build modern Vite plugin', completed: false }],
]);

/** In-memory Map storage for Chat messages keyed by ID */
const chatMessagesMap = new Map<string, ChatMessage>([
  ['1', { id: '1', text: 'Hi there! I am doggy bot 🐶', sender: 'bot', timestamp: Date.now() - 10000 }],
]);

const DOGGY_REPLIES = ['Woof!', 'So cute!', 'Bark bark!', 'Give me a treat 🦴'] as const;

/**
 * Selects a random dog reply for the bot chat response.
 * @returns {string} Random dog message.
 */
function getRandomDogReply(): string {
  return DOGGY_REPLIES[Math.floor(Math.random() * DOGGY_REPLIES.length)];
}

/**
 * Generates a unique string ID.
 * @returns {string} Unique ID string.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Vite plugin that intercepts `/api/chat` and `/api/todos` requests with a mock server logic.
 * @returns {Plugin} Vite plugin configuration.
 */
export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api-endpoints',
    configureServer(server) {
      // Chat API
      server.middlewares.use('/api/chat', (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          setTimeout(() => {
            res.end(JSON.stringify(Array.from(chatMessagesMap.values())));
          }, 500);
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const data = body ? JSON.parse(body) : {};
            const userMsgId = generateId();
            const newMsg: ChatMessage = {
              id: userMsgId,
              text: data.text || '',
              sender: 'me',
              timestamp: Date.now(),
            };
            chatMessagesMap.set(userMsgId, newMsg);

            // Simulate bot reply
            setTimeout(() => {
              const botMsgId = generateId();
              chatMessagesMap.set(botMsgId, {
                id: botMsgId,
                text: getRandomDogReply(),
                sender: 'bot',
                timestamp: Date.now(),
              });
            }, 1500);

            setTimeout(() => {
              res.end(JSON.stringify(newMsg));
            }, 600);
          });
        }
      });

      // Todos API
      server.middlewares.use('/api/todos', (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'application/json');

        const url = req.url || '/';
        const idMatch = url.match(/^\/(\d+)$/);

        if (req.method === 'GET') {
          if (idMatch) {
            const id = Number(idMatch[1]);
            const todo = todosMap.get(id);
            res.end(JSON.stringify(todo || {}));
          } else {
            res.end(JSON.stringify(Array.from(todosMap.values())));
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const data = body ? JSON.parse(body) : {};
            const newId = Date.now();
            const newTodo: Todo = { id: newId, title: data.title || '', completed: false };
            todosMap.set(newId, newTodo);
            res.end(JSON.stringify(newTodo));
          });
        } else if (req.method === 'PATCH') {
          if (idMatch) {
            const id = Number(idMatch[1]);
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              const data = body ? JSON.parse(body) : {};
              const existing = todosMap.get(id);
              if (existing) {
                const updated = { ...existing, ...data };
                todosMap.set(id, updated);
                res.end(JSON.stringify(updated));
              } else {
                res.end(JSON.stringify({ error: 'Not found' }));
              }
            });
          }
        } else if (req.method === 'DELETE') {
          if (idMatch) {
            const id = Number(idMatch[1]);
            todosMap.delete(id);
            res.end(JSON.stringify({ success: true }));
          }
        }
      });
    },
  };
}

