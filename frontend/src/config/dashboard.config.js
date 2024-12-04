import { 
  LayoutDashboard, 
  Users, 
  BookOpen,
  Calendar,
  ClipboardList,
  MessageSquare,
  FileText,
  Settings,
  School,
  Bell,
  UserCog,
  GraduationCap,
  FileSpreadsheet,
  AlertTriangle,
  GraduationCap as AcademicsIcon,
  FileBarChart
} from 'lucide-react';

export const dashboardConfig = {
  admin: {
    title: 'Admin Portal',
    shortTitle: 'AP',
    navigation: [
      { icon: LayoutDashboard, name: 'Dashboard', path: 'dashboard' },
      { icon: Users, name: 'Teachers', path: 'teachers' },
      { icon: GraduationCap, name: 'Students', path: 'students' },
      { icon: AcademicsIcon, name: 'Academics', path: 'academics' },
      { icon: AlertTriangle, name: 'Indiscipline', path: 'indiscipline' },
      { icon: FileBarChart, name: 'Reports', path: 'reports' },
      { icon: Bell, name: 'Notifications', path: 'notifications' },
      { icon: Settings, name: 'Settings', path: 'settings' }
    ],
    defaultNotifications: [
      { id: 1, message: 'New student registration', time: '2 min ago' },
      { id: 2, message: 'Staff meeting reminder', time: '1 hour ago' },
      { id: 3, message: 'System maintenance notice', time: '2 hours ago' }
    ]
  },
  teacher: {
    title: 'Teacher Portal',
    shortTitle: 'TP',
    navigation: [
      { icon: LayoutDashboard, name: 'Dashboard', path: 'dashboard' },
      { icon: FileSpreadsheet, name: 'Grades', path: 'grades' }
    ],
    defaultNotifications: [
      { id: 1, message: 'Class schedule updated', time: '2 min ago' },
      { id: 2, message: 'New assignment submission', time: '1 hour ago' },
      { id: 3, message: 'Parent meeting reminder', time: '2 hours ago' }
    ]
  },
  student: {
    title: 'Student Portal',
    shortTitle: 'SP',
    navigation: [
      { icon: LayoutDashboard, name: 'Dashboard', path: 'dashboard' },
      { icon: BookOpen, name: 'Subjects', path: 'subjects' },
      { icon: Calendar, name: 'Schedule', path: 'schedule' },
      { icon: ClipboardList, name: 'Assignments', path: 'assignments' },
      { icon: FileSpreadsheet, name: 'Grades', path: 'grades' },
      { icon: MessageSquare, name: 'Messages', path: 'messages' },
      { icon: Settings, name: 'Settings', path: 'settings' }
    ],
    defaultNotifications: [
      { id: 1, message: 'New assignment posted', time: '2 min ago' },
      { id: 2, message: 'Grade updated', time: '1 hour ago' },
      { id: 3, message: 'Class schedule changed', time: '2 hours ago' }
    ]
  }
};
