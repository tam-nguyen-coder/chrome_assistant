# Change: Add Blackbox AI as LLM Provider

## Why
Currently, the extension only supports Anthropic as a predefined provider. Users want to use Blackbox AI as an alternative LLM provider. Blackbox AI requires users to provide their own API key, model name, and base URL, similar to the existing OpenAI-compatible configuration pattern.

## What Changes
- Add Blackbox AI as a selectable provider option in the Options page
- Provide a provider dropdown/selector with Anthropic and Blackbox AI options
- Pre-fill Blackbox AI base URL and common model names for convenience
- Maintain backward compatibility with existing manual configuration (custom base URL)
- Update streaming logic to handle Blackbox AI's OpenAI-compatible API format

## Impact
- **Affected specs**: New capability `provider-configuration`
- **Affected code**:
  - `src/options/Options.jsx` - Add provider selector UI
  - `src/sidepanel/hooks/useStreaming.js` - May need updates for Blackbox AI streaming format
  - `src/background/background.js` - No changes needed
- **User experience**: Users can quickly switch between Anthropic and Blackbox AI without manually entering base URLs
