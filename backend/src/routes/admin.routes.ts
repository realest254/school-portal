import { Router } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { StudentController } from '../controllers/student.controller';
import { TeacherController } from '../controllers/teacher.controller';
import { NotificationController } from '../controllers/notification.controller';
import { IndisciplineController } from '../controllers/indiscipline.controller';
import { teacherValidation, studentValidation, notificationValidation } from '../validators/admin.validator';
import { indisciplineValidation } from '../validators/indiscipline.validator';
import classRoutes from './class.routes';
import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

// Mount class routes
router.use('/classes', classRoutes);

// Notification Routes
router.post(
  '/notifications',
  notificationValidation.create,
  NotificationController.createNotification as RequestHandler
);

router.put(
  '/notifications/:id',
  notificationValidation.update,
  NotificationController.updateNotification as RequestHandler
);

router.get(
  '/notifications',
  notificationValidation.getAll,
  NotificationController.getAllNotifications as RequestHandler
);

router.get(
  '/notifications/:id',
  notificationValidation.getById,
  NotificationController.getNotification as RequestHandler
);

router.delete(
  '/notifications/:id',
  notificationValidation.delete,
  NotificationController.deleteNotification as RequestHandler
);

// Student Routes
router.get(
  '/students',
  studentValidation.getAll,
  StudentController.getAllStudents as RequestHandler
);

router.get('/students/class/:className', StudentController.getStudentsByClass as RequestHandler);
router.get('/students/:identifier', StudentController.getStudentByIdentifier as RequestHandler);
router.post('/students', studentValidation.create, StudentController.createStudent as RequestHandler);
router.put('/students/:id', studentValidation.update, StudentController.updateStudent as RequestHandler);
router.delete('/students/:id', StudentController.deleteStudent as RequestHandler);

// Teacher Routes
router.get('/teachers', TeacherController.getAllTeachers as RequestHandler);
router.get('/teachers/:identifier', TeacherController.getTeacherByIdentifier as RequestHandler);
router.post('/teachers', teacherValidation.create, TeacherController.createTeacher as RequestHandler);
router.put('/teachers/:id', teacherValidation.update, TeacherController.updateTeacher as RequestHandler);
router.delete('/teachers/:id', TeacherController.deleteTeacher as RequestHandler);

// Indiscipline Routes
router.post(
  '/indiscipline',
  indisciplineValidation.validateCreate,
  IndisciplineController.create as RequestHandler
);

router.put(
  '/indiscipline/:id',
  indisciplineValidation.validateUpdate,
  IndisciplineController.update as RequestHandler
);

router.delete(
  '/indiscipline/:id',
  IndisciplineController.delete as RequestHandler
);

router.get(
  '/indiscipline',
  indisciplineValidation.validateFilters,
  IndisciplineController.getAll as RequestHandler
);

router.get(
  '/indiscipline/student/:studentId',
  IndisciplineController.getByStudentId as RequestHandler
);

export default router;
