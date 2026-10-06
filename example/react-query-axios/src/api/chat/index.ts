import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../axiosInstance';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'bot';
  timestamp: number;
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const { data } = await axiosInstance.get<ChatMessage[]>('/chat');
  return data;
}

export async function sendMessage(text: string): Promise<ChatMessage> {
  const { data } = await axiosInstance.post<ChatMessage>('/chat', { text });
  return data;
}

export const chatKeys = {
  all: ['chat'] as const,
};

export function useChatMessages() {
  return useQuery({
    queryKey: chatKeys.all,
    queryFn: fetchMessages,
    refetchInterval: 2000, // Poll every 2 seconds for bot replies
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.all });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(chatKeys.all);

      queryClient.setQueryData<ChatMessage[]>(chatKeys.all, (old = []) => [
        ...old,
        { id: 'optimistic-' + Date.now(), text, sender: 'me', timestamp: Date.now() }
      ]);

      return { previousMessages };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(chatKeys.all, context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
