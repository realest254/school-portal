import { Router } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { StudentController } from '../controllers/student.controller';
import { TeacherController } from '../controllers/teacher.controller';
import { NotificationController } from '../controllers/notification.controller';
import { IndisciplineController } from '../controllers/indiscipline.controller';
import { teacherValidation, studentValidation, notificationValidation } from '../validators/admin.validator';
import { indisciplineValidation } from '../validators/indiscipline.validator';
import classRoutes from './class.routes';

const router = Router();
const notificationController = new NotificationController();
const indisciplineController = new IndisciplineController();

// Apply authentication middleware to all admin routes
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

// Mount class routes
router.use('/classes', classRoutes);

// Notification Routes
router.post(
  '/notifications',
  notificationValidation.validateCreate,
  notificationController.create
);

router.put(
  '/notifications/:id',
  notificationValidation.validateUpdate,
  notificationController.update
);

router.get(
  '/notifications',
  notificationValidation.validateGetAll,
  notificationController.getAll
);

router.get(
  '/notifications/:id',
  notificationValidation.validateGetById,
  notificationController.getById
);

router.delete(
  '/notifications/:id',
  notificationValidation.validateDelete,
  notificationController.delete
);

router.get(
  '/notifications/recipient',
  notificationValidation.validateGetForRecipient,
  notificationController.getForRecipient
);

// Student Routes
router.get('/students', StudentController.getAllStudents);
router.get('/students/:id', StudentController.getStudentById);
router.post('/students', studentValidation.create, StudentController.createStudent);
router.put('/students/:id', studentValidation.update, StudentController.updateStudent);
router.delete('/students/:id', StudentController.deleteStudent);

// Teacher Routes
router.get('/teachers', TeacherController.getTeachers);
router.get('/teachers/:id', TeacherController.getTeacherById);
router.post('/teachers', teacherValidation.create, TeacherController.createTeacher);
router.put('/teachers/:id', teacherValidation.update, TeacherController.updateTeacher);
router.delete('/teachers/:id', TeacherController.deleteTeacher);

// Indiscipline Routes
router.post(
  '/indiscipline',
  indisciplineValidation.validateCreate,
  indisciplineController.create
);

router.put(
  '/indiscipline/:id',
  indisciplineValidation.validateUpdate,
  indisciplineController.update
);

router.delete(
  '/indiscipline/:id',
  indisciplineController.delete
);

router.get(
  '/indiscipline',
  indisciplineValidation.validateFilters,
  indisciplineController.getAll
);

router.get(
  '/indiscipline/:id',
  indisciplineController.getById
);

router.get(
  '/indiscipline/student/:studentId',
  indisciplineController.getByStudentId
);

export default router;
