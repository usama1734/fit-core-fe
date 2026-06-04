# FitCore Frontend

React + Vite + Tailwind CSS. Connects to FitCore backend API.

## Setup

```bash
cp .env.example .env
# VITE_API_URL=http://localhost:4000/api
npm install
npm run dev
```

## Pages

| Route         | Roles                              |
| ------------- | ---------------------------------- |
| `/login`      | Public                             |
| `/dashboard`  | All                                |
| `/members`    | Admin, Trainer                     |
| `/trainers`   | Admin                              |
| `/plans`      | All (CRUD admin)                   |
| `/attendance` | All (QR admin/trainer)             |
| `/payments`   | All (Stripe checkout member/admin) |

## Components

- `Sidebar`, `Navbar`, `AppLayout`
- `DashboardCard`, `DataTable`, `ModalForm`
- `QrScanner` (html5-qrcode)
