# Project Overview

This repository contains a full-stack application with a backend and frontend structure. Below is an overview of the project structure and its key components.

## Backend

The backend is built with Python and follows a modular structure. It includes the following key directories:

- **api**: Contains route handlers and dependencies for various endpoints.
  - `routes/`: Includes route files for authentication, client orders, livreur orders, manager orders, and user management.
- **core**: Contains core configurations, database setup, and security utilities.
- **models**: Defines the data models for the application, such as `order` and `user`.
- **schemas**: Contains Pydantic schemas for data validation and serialization.
- **services**: Implements business logic for authentication and order management.
- **utils**: Includes utility scripts like `seed.py` for seeding the database.

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

### Database Structure

The database consists of the following tables:

#### User Table
| Column Name      | Data Type   | Description                     |
|------------------|-------------|---------------------------------|
| id               | Integer     | Primary key, unique identifier for the user |
| full_name        | String(100) | Full name of the user           |
| email            | String(150) | Unique email address of the user |
| hashed_password  | String      | Hashed password for authentication |
| role             | Enum        | Role of the user (admin, manager, livreur, client) |
| phone            | String(20)  | Phone number of the user        |
| is_active        | Boolean     | Indicates if the user is active |
| is_available     | Boolean     | Indicates if the user is available (for livreurs) |
| created_at       | DateTime    | Timestamp of user creation      |
| updated_at       | DateTime    | Timestamp of last update        |

#### Order Table
| Column Name          | Data Type   | Description                     |
|----------------------|-------------|---------------------------------|
| id                   | Integer     | Primary key, unique identifier for the order |
| sender_name          | String(100) | Name of the sender              |
| sender_phone         | String(20)  | Phone number of the sender      |
| sender_address       | String(255) | Address of the sender           |
| origin_city          | String(100) | Origin city of the package      |
| receiver_name        | String(100) | Name of the receiver            |
| receiver_phone       | String(20)  | Phone number of the receiver    |
| receiver_address     | String(255) | Address of the receiver         |
| destination_city     | String(100) | Destination city of the package |
| package_description  | Text        | Description of the package      |
| payment_type         | Enum        | Payment type (sender or receiver pays) |
| status               | Enum        | Status of the order (pending, assigned, etc.) |
| client_id            | Integer     | Foreign key referencing the user who created the order |

## Frontend

The frontend is built with React and Vite. It includes the following key directories:

- **components**: Contains reusable UI components and layout components.
- **context**: Manages global state using React Context API.
- **pages**: Includes page components for different user roles (admin, client, livreur, manager).
- **services**: Contains API service files for interacting with the backend.
- **assets**: Stores static assets like images and icons.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
backend/
  main.py
  requirements.txt
  app/
    api/
      dependencies.py
      routes/
        auth.py
        client_orders.py
        livreur_orders.py
        manager_orders.py
        users.py
    core/
      config.py
      database.py
      security.py
    models/
      order.py
      user.py
    schemas/
      order.py
      user.py
    services/
      auth_service.py
      order_service.py
    utils/
      seed.py
frontend/
  eslint.config.js
  index.html
  package.json
  README.md
  vite.config.js
  public/
  src/
    App.css
    App.jsx
    index.css
    main.jsx
    assets/
    components/
      layout/
        AuthLayout.jsx
        DashboardLayout.jsx
        ProtectedRoute.jsx
      ui/
        Alert.jsx
        Button.jsx
        DashboardUI.jsx
        Input.jsx
        OrderUI.jsx
    context/
      AuthContext.jsx
    pages/
      admin/
        AdminDashboard.jsx
      auth/
        AdminCreateUserPage.jsx
        LoginPage.jsx
        RegisterPage.jsx
      client/
        ClientDashboard.jsx
      livreur/
        LivreurDashboard.jsx
      manager/
        ManagerDashboard.jsx
    services/
      api.js
      authService.js
      orderService.js
```

