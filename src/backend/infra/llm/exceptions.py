class LLMConfigurationError(RuntimeError):
    pass


class UnsupportedLLMProviderError(LLMConfigurationError):
    pass


class MissingOpenAIAPIKeyError(LLMConfigurationError):
    pass


class MissingGigaChatAPIKeyError(LLMConfigurationError):
    pass


class MissingAnthropicAPIKeyError(LLMConfigurationError):
    pass
