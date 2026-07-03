---
title: Mental Models Cheat Sheet
subtitle: One-page reference for Verlin Labs core frameworks
downloadLabel: Print cheat sheet
---

## Information pipeline

**Input → Transform → Output → Feedback**

Use when debugging any system: Where did bad data enter? Where did the transform fail? Who checks the output?

## Compression lens

Complex ideas become usable when you find the **smallest accurate picture**. If you cannot draw it in 30 seconds, you do not understand it yet.

## Feedback loop

**Act → Measure → Learn → Adjust**

Applies to studying, product launches, and prompt engineering. No loop means no improvement — only hope.

## LLM mental model

**Tokenize → Attend → Predict next token**

The model does not “know” facts — it predicts plausible text. Your job: supply context, verify outputs, define success.

## RAG in one line

**Retrieve relevant chunks → prepend to prompt → generate with citations**

If retrieval fails, the answer will fail — fix search before rewriting prompts.

## Quick checks before trusting AI output

- Can I verify this in a primary source?
- Would I stake a grade / job / budget on this without review?
- Did I give enough context in the prompt?

## Go deeper

- [Mental Models Hub](/mental-models)
- [How LLMs work](/library/how-llms-work)
- [Full courses](/courses)