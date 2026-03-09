import type { ProviderPreset } from '@/types';

export const PROVIDERS: Record<string, ProviderPreset> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    ],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  blackbox: {
    id: 'blackbox',
    name: 'Blackbox AI',
    baseUrl: 'https://api.blackbox.ai',
    models: [
      { id: 'blackboxai/minimax/minimax-m2.5', name: 'MiniMax M2.5' },
      { id: 'blackboxai/moonshotai/kimi-k2.5', name: 'Moonshot Kimi K2.5' },
    ],
    defaultModel: 'blackboxai/minimax/minimax-m2.5',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    baseUrl: '',
    models: [],
    defaultModel: '',
  },
};