import {
  createStudent,
  getStudent,
  listStudents,
  deleteStudent,
  resetStudentPassword,
  updateStudent,
  updateStudentStatus,
} from '../../services/adminService';
import { listCourses } from '../../services/academicService';
import { PeopleDirectory } from './PeopleDirectory';

export function StudentsPage() {
  return (
    <PeopleDirectory
      title="Students"
      description="Create student accounts and keep their records up to date."
      noun="student"
      plural="students"
      listKey="students"
      idField="studentId"
      idLabel="Student ID"
      includeClass
      showSchedule
      load={listStudents}
      loadCourses={listCourses}
      getRecord={getStudent}
      createRecord={createStudent}
      updateRecord={updateStudent}
      setStatus={updateStudentStatus}
      deleteRecord={deleteStudent}
      resetPassword={resetStudentPassword}
    />
  );
}
