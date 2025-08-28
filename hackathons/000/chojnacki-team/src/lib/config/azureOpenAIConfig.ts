export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

export const defaultAzureOpenAIConfig: Partial<AzureOpenAIConfig> = {
  apiVersion: '2025-03-01-preview',
  deploymentName: 'gpt-4.1-mini' // Default deployment name, can be overridden
};

export function getAzureOpenAIConfig(): AzureOpenAIConfig {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || defaultAzureOpenAIConfig.apiVersion!;
  const deploymentName = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME || defaultAzureOpenAIConfig.deploymentName!;

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure OpenAI configuration missing. Please set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY environment variables.'
    );
  }

  return {
    endpoint,
    apiKey,
    apiVersion,
    deploymentName
  };
}
