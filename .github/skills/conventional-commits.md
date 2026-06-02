# Skill: Crafting Conventional Commit Messages

Use this skill whenever you need to draft or format commit messages for this repository. All commits must strictly adhere to the Conventional Commits 1.0.0 specification.

---

## Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**. The header has a special structure that includes a **type**, a **scope**, and a **description**:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 1. The Commit Header (Required)

- **type**: Must be one of the following:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `build`: Changes that affect the build system or external dependencies (example scopes: npm, docker)
  - `ci`: Changes to CI configuration files and scripts (example scopes: github-actions)
  - `chore`: Other changes that don't modify src or test files
  - `revert`: Reverts a previous commit
- **scope** (Optional): A noun describing a section of the codebase (e.g., `db`, `server`, `ui`, `theme`).
- **description**: A short summary of the code changes.
  - Use the imperative, present tense: "change" not "changed" nor "changes"
  - Don't capitalize the first letter
  - No dot (`.`) at the end

### 2. The Commit Body (Optional)

- Use the imperative, present tense: "change" not "changed" nor "changes".
- Include the motivation for the change and contrast it with previous behavior.

### 3. Breaking Changes (Optional)

- A breaking change must be indicated by a `!` after the type/scope in the header, or by a `BREAKING CHANGE:` footer.
- The footer description must explain what has changed and how to migrate.

### 4. Footer Guidelines

- Always include a line indicating the commit was co-authored by an AI agent, just the model that was used. For example:

```
Co-authored-by: Google Gemini 3.5
```

## Practical Example

```
feat(server): add rate limiter for login attempts

Implement memory-based IP tracking to limit failed password attempts
to a maximum of 5 attempts within 15 minutes. This protects endpoints
against brute force attacks.

Co-authored-by: Google Gemini 3.5
```

---

## Instructions for Agents

When requested to draft a commit message:

1. Examine the list of changed files and run a git diff (`git diff --cached` or `git diff`) to understand the changes.
2. Identify the primary **type** of change.
3. Identify the **scope** (e.g. `repo`, `db`, `server`, `client`, `ci`).
4. Generate a clean, descriptive message fitting the rules above.
5. Provide the output in a fenced code block so it can be easily copied by the user.
