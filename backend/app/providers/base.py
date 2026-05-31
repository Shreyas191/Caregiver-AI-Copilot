"""Abstract base class for all model providers."""

import asyncio
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from app.providers.types import ChatResponse, Message, ToolDefinition


class ModelProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list[Message], model: str, **kwargs) -> ChatResponse:
        """Send a chat request and return a complete response."""
        ...

    @abstractmethod
    async def chat_with_tools(
        self,
        messages: list[Message],
        model: str,
        tools: list[ToolDefinition],
        **kwargs,
    ) -> ChatResponse:
        """Send a chat request with tool definitions; parse any tool calls in the response."""
        ...

    @abstractmethod
    async def chat_with_tools_stream(
        self,
        messages: list[Message],
        model: str,
        tools: list[ToolDefinition],
        queue: "asyncio.Queue[dict] | None" = None,
        **kwargs,
    ) -> ChatResponse:
        """Stream a tool-aware chat request.

        Text tokens are pushed to queue as they arrive (only for final text
        responses — tool-call iterations produce no queue output). Returns the
        complete ChatResponse once the stream is exhausted so the caller can
        inspect tool_calls and continue the loop unchanged.
        """
        ...

    @abstractmethod
    async def chat_stream(
        self, messages: list[Message], model: str, **kwargs
    ) -> AsyncIterator[str]:
        """Stream a chat response, yielding incremental text tokens."""
        ...

    @abstractmethod
    async def embed(self, texts: list[str], model: str) -> list[list[float]]:
        """Embed a list of texts; returns one vector per text."""
        ...
