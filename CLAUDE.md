# CLAUDE.md — Project Rules

## ⚠️ These rules must not be edited unless explicitly stated and confirmed by the user.

---

## First Principle of Thinking

1. **Never assume the user is clear about what he needs**: stop and discuss when things are unclear.
2. **When the target is clear but the path is sub-optimal**: directly suggest the optimal path.
3. **Aim for fundamental reasons when questions arise**: don't make things up afterwards, and make sure to be able to answer "why" for every question.
4. **Be concise when outputting**: don't output information that doesn't affect the decision-making.

---

## Branch Management

- Do not create new branches without confirming with the user first.

---

## Chapter Design Requirements

- Before designing or implementing any chapter, read `docs/chapter-overview.md` in full for that chapter's entry.
- Check the chapter's **Flags In/Out**, **Statue Installations**, **Mechanics Introduced**, and **Open Inconsistencies** sections before writing any code or design.
- If a chapter's entry in `docs/chapter-overview.md` has unresolved ⚠️ inconsistencies, stop and discuss with the user before proceeding.
- After implementing a chapter, update `docs/chapter-overview.md` if any details changed during implementation.

---

## Code File Standards

- When creating or updating code files, always write/update a proper **file header** describing:
  - What the file does
  - Key definitions and data formats used
  - Any other necessary structural information
- When doing the **first scan of the repository**, only read file headers to minimize context usage.
