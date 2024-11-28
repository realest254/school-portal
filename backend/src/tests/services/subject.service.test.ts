import { SubjectTestService, Subject } from './subject.service';
import { table } from 'table';

// Test utilities
async function logTestStep(description: string) {
  console.log(`\n🔍 TEST STEP: ${description}`);
  console.log('─'.repeat(50));
}

function formatAsTable(data: any[]): string {
  if (data.length === 0) return 'No data';

  const keys = Array.from(new Set(
    data.flatMap(obj => Object.keys(obj))
  ));

  const header = keys;
  const rows = data.map(obj => 
    keys.map(key => {
      const value = obj[key];
      if (value === null) return 'NULL';
      if (value === undefined) return '';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );

  return table([header, ...rows]);
}

async function showTableContents() {
  const service = SubjectTestService.getInstance();
  const subjects = await service.getAll();
  console.log('\nCurrent subjects table contents:');
  console.log(formatAsTable(subjects));
}

describe('Subject Service', () => {
  const service = SubjectTestService.getInstance();

  beforeAll(async () => {
    await service.initialize();
  });

  beforeEach(async () => {
    // Reset database before each test
    await service.initialize();
  });

  describe('create', () => {
    it('should create a new subject', async () => {
      const data = {
        name: 'Mathematics',
        description: 'Basic mathematics and algebra'
      };

      const subject = await service.create(data);
      expect(subject).toBeDefined();
      expect(subject.name).toBe(data.name);
      expect(subject.description).toBe(data.description);
    });

    it('should throw error when creating subject with duplicate name', async () => {
      const data = {
        name: 'Mathematics',
        description: 'Basic mathematics and algebra'
      };

      await service.create(data);
      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should throw error when name is missing', async () => {
      const data = {
        description: 'Basic mathematics and algebra'
      } as any;

      await expect(service.create(data)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update subject description', async () => {
      const subject = await service.create({
        name: 'Mathematics',
        description: 'Basic mathematics'
      });

      const updated = await service.update(subject.id, {
        description: 'Advanced mathematics'
      });

      expect(updated.description).toBe('Advanced mathematics');
      expect(updated.name).toBe(subject.name);
    });

    it('should throw error when updating non-existent subject', async () => {
      await expect(
        service.update('non-existent-id', { description: 'test' })
      ).rejects.toThrow('Subject not found');
    });

    it('should throw error when updating to existing name', async () => {
      await service.create({
        name: 'Mathematics',
        description: 'Math'
      });

      const physics = await service.create({
        name: 'Physics',
        description: 'Physics'
      });

      await expect(
        service.update(physics.id, { name: 'Mathematics' })
      ).rejects.toThrow('already exists');
    });
  });

  describe('delete', () => {
    it('should delete a subject', async () => {
      const subject = await service.create({
        name: 'Mathematics',
        description: 'Basic mathematics'
      });

      await service.delete(subject.id);
      const result = await service.getById(subject.id);
      expect(result).toBeNull();
    });

    it('should throw error when deleting non-existent subject', async () => {
      await expect(
        service.delete('non-existent-id')
      ).rejects.toThrow('Subject not found');
    });

    it('should throw error when deleting subject assigned to teacher', async () => {
      const subject = await service.create({
        name: 'Mathematics',
        description: 'Basic mathematics'
      });

      // Insert a teacher with this subject using the helper method
      await service.__test_insertTeacher('teacher1', [subject.id]);

      await expect(
        service.delete(subject.id)
      ).rejects.toThrow('Cannot delete subject that is assigned to teachers');
    });
  });

  describe('search', () => {
    it('should find subjects by partial name match', async () => {
      await service.create({ name: 'Mathematics' });
      await service.create({ name: 'Advanced Mathematics' });
      await service.create({ name: 'Physics' });

      const results = await service.search('math');
      expect(results).toHaveLength(2);
      expect(results.map((s: Subject) => s.name)).toContain('Mathematics');
      expect(results.map((s: Subject) => s.name)).toContain('Advanced Mathematics');
    });

    it('should return empty array when no matches found', async () => {
      await service.create({ name: 'Mathematics' });
      const results = await service.search('chemistry');
      expect(results).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    it('should return all subjects ordered by name', async () => {
      await service.create({ name: 'Physics' });
      await service.create({ name: 'Chemistry' });
      await service.create({ name: 'Biology' });

      const subjects = await service.getAll();
      expect(subjects).toHaveLength(3);
      expect(subjects[0].name).toBe('Biology');
      expect(subjects[1].name).toBe('Chemistry');
      expect(subjects[2].name).toBe('Physics');
    });

    it('should return empty array when no subjects exist', async () => {
      const subjects = await service.getAll();
      expect(subjects).toHaveLength(0);
    });
  });
});
