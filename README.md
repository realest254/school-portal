# School Portal

A comprehensive educational management system with a modern, responsive interface featuring performance analytics, user management, and administrative tools.

## 🎯 Features

### 📊 Analytics Dashboard
- School Overview with performance trends
- Subject-wise performance analysis
- Class distribution statistics
- Theme-aware interactive charts (Light/Dark mode)
- Real-time data visualization

### 👥 User Management
- Student management system
- Teacher statistics
- Class management
- Comprehensive user profiles
- Role-based access control

### 📝 Administrative Tools
- Notification system
- Report generation
- Performance tracking
- Attendance management
- Discipline management

## 🚀 Technology Stack

### Frontend
- React.js with Vite
- Ant Design (UI Components)
- @ant-design/plots (Data Visualization)
- Tailwind CSS (Styling)
- Context API (State Management)
- Axios (HTTP Client)

### Backend
- Node.js with TypeScript
- PostgreSQL (Database)
- Express.js (Web Framework)
- Zod (Schema Validation)
- SQL Template Strings (SQL Injection Protection)
- JWT (Authentication)

### Security Features
- SQL Injection Protection
- Input Validation with Zod
- Role-based Access Control
- Secure Password Handling
- JWT-based Authentication
- Transaction Management
- Error Handling with Context

## 🛠️ Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/school-portal.git
```

2. Install dependencies for both frontend and backend:
```bash
# Frontend
cd school-portal/frontend
npm install

# Backend
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/school_portal
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
```

4. Start the development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend (in a new terminal)
cd frontend
npm run dev
```

## 🎨 Theme Support

The application supports both light and dark themes with:
- Theme-aware components
- Consistent styling across all pages
- High contrast ratios for accessibility
- Smooth theme transitions
- Persistent theme preference

### Chart Theming
- Theme-aware axis labels and titles
- Contrast-optimized data points
- Readable tooltips in both themes
- Grid lines with appropriate opacity
- Theme-specific color palettes

## 🔄 Recent Updates

### Security Enhancements
- Implemented SQL injection protection using SQL template literals
- Added comprehensive input validation with Zod
- Enhanced error handling with context-aware messages
- Improved transaction management
- Added type-safe dynamic query building

### Backend Improvements
- Refactored notification service for better security
- Enhanced invite service with improved validation
- Updated student and teacher services
- Removed unused settings-related files
- Added comprehensive error logging

### Frontend Updates
- Converted TypeScript files to JavaScript for consistency
- Updated Vite configuration
- Enhanced service layer error handling
- Improved API integration
- Better state management

## 🔜 Roadmap

- [ ] Advanced analytics features
- [ ] PDF report generation
- [ ] Email notification system
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Mobile app development

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.