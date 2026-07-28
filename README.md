# niDio

# next-themes

# next-intl

v0.1.0

Added:

- Next.js 16 app structure
- FSD architecture
- Auth module
- Login page
- Registration page
- React Hook Form + Zod validation
- TanStack Query mutations
- Axios API client
- JWT access token handling
- Refresh token cookie flow
- Base UI components:
  - Button
  - Input
  - PasswordInput
  - AuthLayout
  - Link

  новая схема для бд

1. User — только пользователь.
2. Couple — отношения двух людей.
3. Workspace — пространство (личное или общее).
4. Invite — приглашение, не зависящее от существования Couple.
5. Message / Space / Block — принадлежат Workspace.
   Регистрация
   ↓
   Создать Invite
   ↓
   Второй пользователь открывает ссылку
   ↓
   Принимает Invite
   ↓
   Создается Couple
   ↓
   Создается Workspace
   ↓
   Оба работают в одном пространстве
