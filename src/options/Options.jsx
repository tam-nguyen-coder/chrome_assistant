import React, { useState, useEffect } from 'react';
import { Settings, Key, Globe, Cpu, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Sparkles, ChevronDown } from 'lucide-react';

// Provider presets
const PROVIDERS = {
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

const DEFAULT_CONFIG = {
  provider: 'anthropic',
  baseUrl: PROVIDERS.anthropic.baseUrl,
  apiKey: '',
  model: PROVIDERS.anthropic.defaultModel,
};

export default function Options() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [customModel, setCustomModel] = useState('');

  // Detect provider from baseUrl for backward compatibility
  const detectProvider = (baseUrl) => {
    if (baseUrl.includes('anthropic.com')) return 'anthropic';
    if (baseUrl.includes('blackbox.ai')) return 'blackbox';
    return 'custom';
  };

  useEffect(() => {
    chrome.storage.local.get('llmConfig', (result) => {
      if (result.llmConfig) {
        const merged = { ...DEFAULT_CONFIG, ...result.llmConfig };
        // Backward compatibility: detect provider if not set
        if (!merged.provider) {
          merged.provider = detectProvider(merged.baseUrl);
        }
        setConfig(merged);
        if (merged.provider === 'custom' && merged.model) {
          setCustomModel(merged.model);
        }
      }
    });
  }, []);

  const handleProviderChange = (providerId) => {
    const provider = PROVIDERS[providerId];
    setConfig({
      ...config,
      provider: providerId,
      baseUrl: provider.baseUrl,
      model: provider.defaultModel,
    });
    setShowProviderDropdown(false);
    setTestResult(null);
  };

  const handleModelChange = (modelId) => {
    setConfig({ ...config, model: modelId });
    setShowModelDropdown(false);
    setTestResult(null);
  };

  const handleCustomModelChange = (e) => {
    const model = e.target.value;
    setCustomModel(model);
    setConfig({ ...config, model });
  };

  const handleCustomBaseUrlChange = (e) => {
    setConfig({ ...config, baseUrl: e.target.value });
    setTestResult(null);
  };

  const handleSave = () => {
    chrome.storage.local.set({ llmConfig: config }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const isAnthropic = config.provider === 'anthropic' || config.baseUrl.includes('anthropic');
      const url = isAnthropic
        ? `${config.baseUrl.replace(/\/$/, '')}/v1/messages`
        : `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

      const headers = {
        'Content-Type': 'application/json',
      };
      let body;

      if (isAnthropic) {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        body = JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
      } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
      }

      const res = await fetch(url, { method: 'POST', headers, body });
      if (res.ok) {
        setTestResult({ success: true, message: 'Connection successful! API is responding.' });
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        setTestResult({ success: false, message: errMsg });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Network error: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-bg-tertiary/60 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-glow transition-all duration-200 text-sm";
  const selectClass = "w-full px-4 py-3 bg-bg-tertiary/60 border border-border rounded-xl text-text-primary focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-glow transition-all duration-200 text-sm cursor-pointer flex items-center justify-between";
  const dropdownClass = "absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in-up";
  const dropdownItemClass = "px-4 py-2.5 text-sm text-text-secondary hover:bg-accent/10 hover:text-text-primary cursor-pointer transition-colors";
  const dropdownItemActiveClass = "px-4 py-2.5 text-sm text-accent-light bg-accent/10 cursor-pointer";

  const currentProvider = PROVIDERS[config.provider] || PROVIDERS.custom;
  const isCustomProvider = config.provider === 'custom';

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-light mb-4 shadow-lg shadow-accent-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">LLM Assistant</h1>
          <p className="text-text-secondary mt-1 text-sm">Configure your AI connection</p>
        </div>

        {/* Config Card */}
        <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl">
          <div className="space-y-5">
            {/* Provider Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Cpu className="w-4 h-4" /> Provider
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className={selectClass}
                >
                  <span>{currentProvider.name}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showProviderDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showProviderDropdown && (
                  <div className={dropdownClass}>
                    {Object.values(PROVIDERS).map((provider) => (
                      <div
                        key={provider.id}
                        className={config.provider === provider.id ? dropdownItemActiveClass : dropdownItemClass}
                        onClick={() => handleProviderChange(provider.id)}
                      >
                        {provider.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Base URL (only for Custom provider) */}
            {isCustomProvider && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                  <Globe className="w-4 h-4" /> Base URL
                </label>
                <input
                  type="url"
                  value={config.baseUrl}
                  onChange={handleCustomBaseUrlChange}
                  placeholder="https://api.example.com"
                  className={inputClass}
                />
              </div>
            )}

            {/* API Key */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Key className="w-4 h-4" /> API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={config.provider === 'anthropic' ? 'sk-ant-api03-...' : 'Enter your API key'}
                  className={`${inputClass} pr-12`}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Cpu className="w-4 h-4" /> Model
              </label>
              {isCustomProvider ? (
                <input
                  type="text"
                  value={customModel}
                  onChange={handleCustomModelChange}
                  placeholder="model-name"
                  className={inputClass}
                />
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className={selectClass}
                  >
                    <span>
                      {currentProvider.models.find(m => m.id === config.model)?.name || config.model}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showModelDropdown && currentProvider.models.length > 0 && (
                    <div className={dropdownClass}>
                      {currentProvider.models.map((model) => (
                        <div
                          key={model.id}
                          className={config.model === model.id ? dropdownItemActiveClass : dropdownItemClass}
                          onClick={() => handleModelChange(model.id)}
                        >
                          {model.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-5 flex items-start gap-2.5 p-3.5 rounded-xl text-sm animate-fade-in-up ${
              testResult.success
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-error/10 border border-error/30 text-error'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleTestConnection}
              disabled={testing || !config.apiKey || !config.baseUrl}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-border-active transition-all duration-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-accent-glow transition-all duration-200"
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : null}
              {saved ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-5 text-center">
          <p className="text-xs text-text-muted flex items-center justify-center gap-1.5">
            <Key className="w-3 h-3" />
            Your API key is stored locally and never sent to third-party servers.
          </p>
        </div>
      </div>
    </div>
  );
}
