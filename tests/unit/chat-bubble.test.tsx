import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatBubble } from "@/components/molecules/ChatBubble";

describe("ChatBubble", () => {
  it("should render user message with correct styling", () => {
    render(<ChatBubble role="user" content="Cześć!" />);
    expect(screen.getByText("Cześć!")).toBeInTheDocument();
  });

  it("should render assistant message with markdown", () => {
    render(<ChatBubble role="assistant" content="**Cześć!** Jak mogę pomóc?" />);
    expect(screen.getByText(/Jak mogę pomóc/)).toBeInTheDocument();
  });

  it("should show source badge for RAG responses", () => {
    render(
      <ChatBubble role="assistant" content="Na podstawie dokumentu..." sourceType="rag" />
    );
    expect(screen.getByText(/RAG/)).toBeInTheDocument();
  });

  it("should show source badge for web search responses", () => {
    render(
      <ChatBubble role="assistant" content="Wyniki wyszukiwania..." sourceType="web" />
    );
    expect(screen.getByText(/Web/)).toBeInTheDocument();
  });

  it("should NOT show source badge for user messages", () => {
    render(<ChatBubble role="user" content="Test" sourceType="ai" />);
    expect(screen.queryByText("AI")).not.toBeInTheDocument();
  });

  it("should show streaming indicator when isStreaming is true", () => {
    render(
      <ChatBubble role="assistant" content="Generating..." isStreaming={true} />
    );
    expect(screen.getByText("▊")).toBeInTheDocument();
  });

  it("should NOT show streaming indicator when isStreaming is false", () => {
    render(
      <ChatBubble role="assistant" content="Done." isStreaming={false} />
    );
    expect(screen.queryByText("▊")).not.toBeInTheDocument();
  });
});
