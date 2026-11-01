# CoWork – Project Management System

CoWork is a full-stack project management application designed to help users organize projects, manage tasks, collaborate with team members, and track project progress through a centralized dashboard.

The application provides a clean, responsive interface with light and dark themes, user authentication, and project-wise team management.

Live Website: https://project-management-system-orcin-sigma.vercel.app/

Email: ali.raza@cowork.com
Password: abcd1234

## Features

### Dashboard

- Modern SaaS-style dashboard with a responsive layout.
- Overview of total projects, tasks, completed tasks, in-progress tasks, and team members.
- Recent projects with progress indicators.
- Personal task overview with deadlines and priority indicators.
- Recent activity and project collaborator information.
- Loading, error, and empty states.

### Project Management

- Create, view, update, and delete projects.
- Set project descriptions and deadlines.
- Manage project statuses.
- Track project completion progress.
- Assign team members to projects.

### Task Management

- Create and manage tasks.
- Associate tasks with projects.
- Update task status and details.
- Track completed and pending tasks.

### Team Management

- Manage project-wise team members.
- View team members associated with projects.
- Organize collaboration around individual projects.

### Authentication

- User registration and login.
- Password hashing with bcrypt.
- JWT-based authentication.
- Protected application routes.
- Persistent login using browser local storage.
- Logout functionality.

### User Profile

- Manage user profile information.
- Profile picture uploads using Cloudinary.

### Additional Features

- Responsive layout for different screen sizes.
- Light and dark themes.
- Sidebar navigation.
- MongoDB database integration.

## Technology Stack

**Frontend**

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

**Backend**

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- Multer
- Cloudinary

**Deployment**

- Vercel
- MongoDB Atlas
- Cloudinary

## Project Structure

project-management-system/
│
├── client/
│ ├── public/
│ └── src/
│ ├── api/
│ ├── assets/
│ ├── components/
│ ├── context/
│ ├── hooks/
│ ├── layouts/
│ ├── pages/
│ └── ...
│
├── server/
│ ├── config/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ ├── app.js
│ └── server.js
│
├── vercel.json
└── .gitignore

## Getting Started

Follow these instructions to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/hunzlawaien/project-management-system.git
```

```bash
cd project-management-system
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

### 3. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Add the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholder values with your own credentials.

**Note:** Never commit your `.env` file or expose your secret credentials publicly.

### 5. Run the Backend

From the `server` directory:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### 6. Run the Frontend

From the `client` directory:

```bash
npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

## Deployment

CoWork is configured for deployment through Vercel Services.

The frontend and backend are maintained in the same repository and deployed through a single Vercel project.

- Frontend: Served from the root domain.
- Backend: Handles API requests through `/api`.
- Database: MongoDB Atlas.
- Image storage: Cloudinary.

Configure the required backend environment variables in Vercel before deploying.

## Authentication and Security

- Passwords are hashed before being stored.
- JWT tokens are used to authenticate protected API requests.
- Protected backend routes validate authentication.
- Sensitive credentials are stored in environment variables.
- Authentication tokens are stored in browser local storage.

## Future Improvements

- Real-time notifications.
- Advanced task filtering and sorting.
- Task priority management.
- Due-date reminders.
- Enhanced team collaboration.
- Project analytics and reporting.

## Author

**Hunzla Waien**

- GitHub: [@hunzlawaien](https://github.com/hunzlawaien)
- LinkedIn: [Hunzla Waien](https://www.linkedin.com/in/hunzla-waien/)

---
