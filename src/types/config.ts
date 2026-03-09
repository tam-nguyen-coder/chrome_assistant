export type ProviderId = 'anthropic' | 'blackbox' | 'custom';

export interface LLMConfig {
  provider: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ProviderModel {
  id: string;
  name: string;
}

export interface ProviderPreset {
  id: ProviderId;
  name: string;
  baseUrl: string;
  models: ProviderModel[];
  defaultModel: string;
}