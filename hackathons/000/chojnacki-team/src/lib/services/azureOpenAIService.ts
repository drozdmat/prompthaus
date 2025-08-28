import { AzureOpenAI } from "openai";
import { getAzureOpenAIConfig, type AzureOpenAIConfig } from '../config/azureOpenAIConfig.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AzureOpenAIService {
  private client: AzureOpenAI;
  private config: AzureOpenAIConfig;

  constructor() {
    this.config = getAzureOpenAIConfig();
    this.client = new AzureOpenAI({
      endpoint: this.config.endpoint,
      apiKey: this.config.apiKey,
      apiVersion: this.config.apiVersion,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Send a chat completion request to Azure OpenAI
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    }
  ): Promise<OpenAIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.deploymentName,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: options?.maxTokens || 500,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty || 0,
        presence_penalty: options?.presencePenalty || 0
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No response content received from Azure OpenAI');
      }

      return {
        content: choice.message.content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      console.error('Azure OpenAI API Error:', error);
      throw new Error(`Failed to get response from Azure OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a simple text completion
   */
  async generateText(
    prompt: string,
    systemMessage?: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.chatCompletion(messages, options);
    return response.content;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    try {
      getAzureOpenAIConfig();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current configuration (without exposing API key)
   */
  getConfigInfo(): Omit<AzureOpenAIConfig, 'apiKey'> {
    return {
      endpoint: this.config.endpoint,
      apiVersion: this.config.apiVersion,
      deploymentName: this.config.deploymentName
    };
  }
}

// Export a singleton instance
export const azureOpenAIService = new AzureOpenAIService();
