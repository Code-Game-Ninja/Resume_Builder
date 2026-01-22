## [CRITICAL] - READ FIRST

### No Emojis - Use React Icons

- **NEVER** use emojis in **code logic**, **component JSX**, or **static UI elements**
- **ALWAYS** use icons from `lucide-react` or `react-icons` library instead for UI elements
- **EXCEPTION:** User-generated content (UGC) CAN contain emojis:
  - Mock data simulating user posts, comments, messages
  - Content that would come from a database/API in production
  - Chat messages, social feed posts, reviews written by users
- This applies to:
  - React components and JSX (use icons, not emojis)
  - Static data files (use icons, not emojis)
  - User-generated mock content (emojis are OK here)
- **Examples:**
  - Instead of `🏆` in a badge component, use `<Trophy />` from lucide-react
  - Instead of `⭐` in a rating component, use `<Star />` from lucide-react
  - But a mock user post like `content: '🎉 We won the championship!'` is fine
- Design documents in `Design/` folder may use emojis for visual clarity

### Token Limit Awareness

- **DO NOT** attempt to complete entire features, large files, or complex tasks in a single response
- AI models have token generation limits (typically 4,000-8,000 tokens per response)
- When approaching the limit, **STOP and ask for the next prompt** instead of cutting off work
- **Break down large tasks** into smaller, manageable chunks:
  - Create one file at a time
  - Implement one component or feature per prompt
  - Split large refactoring into multiple steps
  - Build incrementally rather than monolithically

### Best Practices for Large Tasks

1. **Plan First:** Ask user for confirmation before starting
2. **Chunk Work:** Break into logical, independent steps
3. **Communicate Progress:** Report what's done and what's pending
4. **Ask for Next Steps:** After completing a chunk, ask "What should I work on next?"
5. **Avoid Truncation:** Never cut off or use "..." to indicate omitted code

### Incremental File Creation (MANDATORY for Large Files)

- **NEVER** try to create an entire file in one response
- **ALWAYS** follow this step-by-step approach:
  1. **Step 1 - Imports & Setup:** Create file with all imports, types/interfaces, and constants
  2. **Step 2 - Core Components:** Add main component structure and state
  3. **Step 3 - Sub-components:** Add helper components one by one
  4. **Step 4 - Logic & Handlers:** Add event handlers, API calls, effects
  5. **Step 5 - Review & Fix:** Review for errors, run dev server, fix any issues
- **After each step:** check your token limit and ask for user prompt to continue to next step if needed
- **Example workflow:**
  ```
  User: "Create EventDetailPage"
  AI: Creates file with imports, types, mock data → "Step 1 done. (check your token limit if not enough to complete task.) Say 'next' for Step 2"
  User: "next"
  AI: Adds main component structure → "Step 2 done. Say 'next' for Step 3"
  ... and so on
  ```
