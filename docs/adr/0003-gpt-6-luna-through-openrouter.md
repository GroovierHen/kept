# The AI is GPT-6 Luna through OpenRouter, not Gemini

The AI that writes Plans and marks Recalls is `openai/gpt-6-luna`, called through OpenRouter with reasoning off, and Gemini is removed rather than kept as a backup. Gemini calls were failing in use (5 of 8 `goal_plan` calls in `ai_usage` failed after about 58s each), and in a benchmark on 2026-11-02 of OpenRouter's free models and 125 cheap paid ones against Kept's own planner and grader cases, Luna was one of three models perfect over three rounds: 30 of 30 plans and 42 of 42 marks, 9.9s for a typical plan, about $0.0005 a plan. One provider means one wrapper, one key and one sentence to testers about where their answers go.

## Considered options

- **OpenRouter's free router (`openrouter/free`).** It sends each request to a random free model, so plan quality changes from person to person; the free tier allows 50 requests a day on an account under 10 credits; and the best free model fell for an injected instruction and prefixed every option with junk.
- **DeepSeek V4.1 Flash.** Also perfect and faster (5.0s), but its actions often ran past 12 words and its right option was often visibly the longest. Not kept as a backup model either, since that would add a second company, served by nine hosts, to the sentence testers read.
- **Gemma 4 26B.** Perfect and cheapest, but 6 of 30 plans took longer than 20s.
- **Reasoning on.** Low and medium effort both passed every case too, but added 4–5s a plan and, at medium, doubled the cost. Off until a case shows it's needed.

## Consequences

- Luna takes no `temperature`, so Try again can't run hotter for a different plan: it sends the first plan and asks for a different one.
- Every call denies data collection (`provider.data_collection: "deny"`). OpenRouter may serve Luna from OpenAI, Azure or Amazon Bedrock and switches between them itself, so there is no second model; when all fail, Kept does what it does when the AI is down.
- Luna is moderated: OpenRouter refuses flagged input with a 403 before the model sees it. That is a refusal, not an outage, and the person is asked to reword the Goal rather than shown Try again.
- Testers were told at sign-up that their answers go to Google's Gemini; the plan step now names OpenRouter and OpenAI's GPT-6 Luna, and existing testers are told in the tester group.
