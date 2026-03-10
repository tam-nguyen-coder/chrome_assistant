import React, { useState, useEffect } from 'react';
import { Settings, Key, Globe, Cpu, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Sparkles, ChevronDown, Plus, Pencil, Trash2, Zap, X, Save, Lock } from 'lucide-react';
import { PROVIDERS, SEED_ACTIONS } from '@/shared/constants';
import type { LLMConfig, ProviderId, ProviderPreset, AIAction } from '@/types';

type TabId = 'connection' | 'actions';

const DEFAULT_CONFIG: LLMConfig = {
  provider: 'anthropic',
  baseUrl: PROVIDERS.anthropic.baseUrl,
  apiKey: '',
  model: PROVIDERS.anthropic.defaultModel,
};

interface TestResult {
  success: boolean;
  message: string;
}

interface ActionFormData {
  emoji: string;
  name: string;
  prompt: string;
}

const EMPTY_FORM: ActionFormData = { emoji: '⚡', name: '', prompt: '' };

export default function Options() {
  const [activeTab, setActiveTab] = useState<TabId>('connection');

  // ── Connection tab state ──
  const [config, setConfig] = useState<LLMConfig>(DEFAULT_CONFIG);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [customModel, setCustomModel] = useState('');

  // ── Actions tab state ──
  const [actions, setActions] = useState<AIAction[]>(SEED_ACTIONS);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActionFormData>(EMPTY_FORM);
  const [actionSaved, setActionSaved] = useState(false);

  // Detect provider from baseUrl for backward compatibility
  const detectProvider = (baseUrl: string): ProviderId => {
    if (baseUrl.includes('anthropic.com')) return 'anthropic';
    if (baseUrl.includes('blackbox.ai')) return 'blackbox';
    return 'custom';
  };

  // ── Load config on mount ──
  useEffect(() => {
    chrome.storage.local.get('llmConfig', (result) => {
      if (result.llmConfig) {
        const merged: LLMConfig = { ...DEFAULT_CONFIG, ...result.llmConfig };
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

  // ── Load actions on mount (seed with defaults if empty) ──
  useEffect(() => {
    chrome.storage.local.get('customActions', (result: { customActions?: AIAction[] }) => {
      const stored = result.customActions;
      if (stored && stored.length > 0) {
        // Ensure Translate (isFixed) always exists — re-add if user somehow removed it
        const hasTranslate = stored.some(a => a.id === 'translate');
        if (!hasTranslate) {
          const translateAction = SEED_ACTIONS.find(a => a.id === 'translate')!;
          const withTranslate = [...stored, translateAction];
          chrome.storage.local.set({ customActions: withTranslate });
          setActions(withTranslate);
        } else {
          setActions(stored);
        }
      } else {
        // First load or empty — seed with defaults
        chrome.storage.local.set({ customActions: SEED_ACTIONS });
        setActions(SEED_ACTIONS);
      }
    });
  }, []);

  // ── Connection handlers ──
  const handleProviderChange = (providerId: ProviderId) => {
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

  const handleModelChange = (modelId: string) => {
    setConfig({ ...config, model: modelId });
    setShowModelDropdown(false);
    setTestResult(null);
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const model = e.target.value;
    setCustomModel(model);
    setConfig({ ...config, model });
  };

  const handleCustomBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      let body: string;

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
        const errData = await res.json().catch(() => ({})) as { error?: { message?: string } };
        const errMsg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        setTestResult({ success: false, message: errMsg });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` });
    } finally {
      setTesting(false);
    }
  };

  // ── Action handlers ──
  const persistActions = (updatedActions: AIAction[]) => {
    setActions(updatedActions);
    chrome.storage.local.set({ customActions: updatedActions });
  };

  const handleAddAction = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsFormVisible(true);
  };

  const handleEditAction = (action: AIAction) => {
    const emojiMatch = action.label.match(/^(\S+)\s/);
    setEditingId(action.id);
    setFormData({
      emoji: emojiMatch ? emojiMatch[1] : '⚡',
      name: action.label.replace(/^\S+\s/, ''),
      prompt: action.prompt,
    });
    setIsFormVisible(true);
  };

  const handleDeleteAction = (actionId: string) => {
    // Prevent deleting fixed actions
    const action = actions.find(a => a.id === actionId);
    if (action?.isFixed) return;
    const updated = actions.filter(a => a.id !== actionId);
    persistActions(updated);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSaveAction = () => {
    if (!formData.name.trim() || !formData.prompt.trim()) return;

    const prompt = formData.prompt.trim();

    if (editingId) {
      // Edit existing — for fixed actions, only prompt changes
      const existingAction = actions.find(a => a.id === editingId);
      const isFixed = existingAction?.isFixed;

      const updated = actions.map(a => {
        if (a.id !== editingId) return a;
        if (isFixed) {
          // Fixed action: only update prompt
          return { ...a, prompt };
        }
        // Non-fixed: update everything
        const label = `${formData.emoji} ${formData.name.trim()}`;
        return { ...a, label, prompt, emoji: formData.emoji };
      });
      persistActions(updated);
    } else {
      // Add new
      const label = `${formData.emoji} ${formData.name.trim()}`;
      const newAction: AIAction = {
        id: `custom-${Date.now()}`,
        label,
        prompt,
        emoji: formData.emoji,
      };
      persistActions([...actions, newAction]);
    }

    setIsFormVisible(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setActionSaved(true);
    setTimeout(() => setActionSaved(false), 2000);
  };

  // ── Style classes ──
  const inputClass = "w-full px-4 py-3 bg-bg-tertiary/60 border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-glow transition-all duration-200 text-sm";
  const selectClass = "w-full px-4 py-3 bg-bg-tertiary/60 border border-border rounded-xl text-text-primary focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-glow transition-all duration-200 text-sm cursor-pointer flex items-center justify-between";
  const dropdownClass = "absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in-up";
  const dropdownItemClass = "px-4 py-2.5 text-sm text-text-secondary hover:bg-accent/10 hover:text-text-primary cursor-pointer transition-colors";
  const dropdownItemActiveClass = "px-4 py-2.5 text-sm text-accent-light bg-accent/10 cursor-pointer";

  const currentProvider: ProviderPreset = PROVIDERS[config.provider] || PROVIDERS.custom;
  const isCustomProvider = config.provider === 'custom';

  // Check if currently editing a fixed action
  const editingAction = editingId ? actions.find(a => a.id === editingId) : null;
  const isEditingFixed = editingAction?.isFixed || false;

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-accent to-accent-light mb-4 shadow-lg shadow-accent-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">LLM Assistant</h1>
          <p className="text-text-secondary mt-1 text-sm">Configure your AI assistant</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-bg-secondary/60 border border-border rounded-xl p-1">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'connection'
                ? 'bg-accent/15 text-accent-light shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Settings className="w-4 h-4" />
            Connection
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'actions'
                ? 'bg-accent/15 text-accent-light shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Zap className="w-4 h-4" />
            Actions
          </button>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/*  CONNECTION TAB                                 */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'connection' && (
          <>
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
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />}
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-accent to-accent-light text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-accent-glow transition-all duration-200"
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
          </>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/*  ACTIONS TAB                                    */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'actions' && (
          <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Actions</h2>
                <p className="text-xs text-text-muted mt-0.5">Manage your AI actions and prompts</p>
              </div>
              {!isFormVisible && (
                <button
                  onClick={handleAddAction}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-linear-to-r from-accent to-accent-light text-white rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-accent-glow transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Action
                </button>
              )}
            </div>

            {/* Success indicator */}
            {actionSaved && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-success/10 border border-success/30 rounded-xl text-sm text-success animate-fade-in-up">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Action saved successfully!
              </div>
            )}

            {/* Add/Edit Form */}
            {isFormVisible && (
              <div className="mb-5 p-4 bg-bg-tertiary/40 border border-border-active/50 rounded-xl animate-fade-in-up">
                <h3 className="text-sm font-medium text-text-primary mb-4">
                  {editingId ? (isEditingFixed ? 'Edit Prompt' : 'Edit Action') : 'New Action'}
                </h3>
                <div className="space-y-3.5">
                  {/* Emoji + Name row — disabled for fixed actions */}
                  {!isEditingFixed && (
                    <div className="flex gap-3">
                      <div className="w-20">
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Emoji</label>
                        <input
                          type="text"
                          value={formData.emoji}
                          onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                          placeholder="⚡"
                          maxLength={4}
                          className={`${inputClass} text-center text-lg`}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Action Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Code Review, Fix Grammar"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fixed action info */}
                  {isEditingFixed && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 border border-accent/15 rounded-lg">
                      <Lock className="w-3.5 h-3.5 text-accent-light shrink-0" />
                      <span className="text-xs text-text-secondary">
                        <strong className="text-text-primary">{editingAction?.label}</strong> — name is fixed, but you can customize the prompt below.
                      </span>
                    </div>
                  )}

                  {/* Prompt */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Prompt Template</label>
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      placeholder="e.g., Please review the following code for bugs and improvements:\n\n"
                      rows={4}
                      className={`${inputClass} resize-none`}
                    />
                    <p className="text-[11px] text-text-muted mt-1.5">
                      The selected text will be appended after this prompt automatically.
                    </p>
                  </div>

                  {/* Form actions */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={handleCancelForm}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-muted hover:text-text-secondary text-sm transition-all duration-200"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAction}
                      disabled={isEditingFixed ? !formData.prompt.trim() : (!formData.name.trim() || !formData.prompt.trim())}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-linear-to-r from-accent to-accent-light text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-accent-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {editingId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions List */}
            <div className="space-y-2.5">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className={`group flex items-start gap-3.5 p-3.5 bg-bg-tertiary/40 border border-border rounded-xl hover:border-border-active/50 transition-all duration-200 ${
                    editingId === action.id ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  {/* Emoji */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    action.isFixed
                      ? 'bg-accent/15 border border-accent/25'
                      : 'bg-accent/10 border border-accent/20'
                  }`}>
                    {action.label.split(' ')[0]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-text-primary">
                        {action.label.split(' ').slice(1).join(' ')}
                      </span>
                      {action.isFixed && (
                        <span title="Fixed action — cannot be deleted">
                          <Lock className="w-3 h-3 text-text-muted" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">
                      {action.prompt.substring(0, 80)}{action.prompt.length > 80 ? '…' : ''}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleEditAction(action)}
                      className="p-2 rounded-lg text-text-muted hover:text-accent-light hover:bg-accent/10 transition-all duration-150"
                      title={action.isFixed ? 'Edit prompt' : 'Edit'}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!action.isFixed && (
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all duration-150"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}