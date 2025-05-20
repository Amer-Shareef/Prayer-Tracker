# Prayer-Tracker

Prayer Tracker is a full-stack application designed to help Muslim communities keep track of prayer attendance, mosque activities, and community engagement. The application provides different user roles (Member, Founder/Mosque Leader, and Super Admin) with specific features tailored to their needs.

## Features

### For Members

- **Prayer Tracking**: Record your daily prayers and track your streak
- **Statistics Dashboard**: View detailed insights about your prayer habits
- **Pickup Requests**: Request transportation to the mosque for prayers
- **Wakeup Call Service**: Request wakeup calls for Fajr prayer
- **Mosque Information**: Access information about your mosque, including prayer times

### For Founders (Mosque Leaders)

- **Mosque Management**: Manage your mosque's information and prayer times
- **Attendance Tracking**: View comprehensive reports on member attendance
- **Announcements**: Create and manage mosque announcements
- **Pickup Management**: Approve and assign drivers for member pickup requests
- **Send Reminders**: Send prayer reminders to mosque members
- **Member Management**: View and manage mosque members

### For Super Admins

- **Mosque Oversight**: Manage all mosques in the system
- **User Role Management**: Promote users to founders or admins
- **System Statistics**: View overall platform statistics

## Technologies Used

### Frontend

- React.js
- Tailwind CSS
- React Router
- Context API for state management

### Backend

- Node.js
- Express.js
- MySQL
- JSON Web Tokens (JWT) for authentication

### Prerequisites

1. **Clone the repository**

   ```
   git clone https://github.com/Amer-Shareef/Prayer-Tracker.git
   cd Prayer-Tracker
   ```

2. **Backend Setup**

   ```
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory with the following variables:

   ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_local_password
    DB_NAME=prayer_tracker
    PORT=5000
    JWT_SECRET=supersecretkey
   ```

3. **Frontend Setup**

   ```
   cd ../frontend
   npm install
   ```

   Create a `.env` file in the frontend directory:

4. **Seed the Database (Optional)**

   ```
   cd ../backend
   npm run seed
   ```

   This will create initial user accounts:

   - Super Admin: testadmin / password123
   - Founder: testfounder / password123
   - Member: testmember / password123

5. **Start the Application**

   Start the backend server:

   ```
   cd backend
   node server.js
   ```

   In a separate terminal, start the frontend development server:

   ```
   cd frontend
   npm start
   ```

   The application will be available at `http://localhost:3000`.
