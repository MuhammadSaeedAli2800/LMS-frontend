import {
  createTeacher,
  getTeacher,
  listTeachers,
  deleteTeacher,
  resetTeacherPassword,
  updateTeacher,
  updateTeacherStatus,
} from '../../services/adminService';
import { PeopleDirectory } from './PeopleDirectory';

export function TeachersPage() {
  return (
    <PeopleDirectory
      title="Teachers"
      description="Create teacher accounts and keep their records up to date."
      noun="teacher"
      plural="teachers"
      listKey="teachers"
      idField="teacherId"
      idLabel="Teacher ID"
      showSchedule
      presentation="staff"
      load={listTeachers}
      getRecord={getTeacher}
      createRecord={createTeacher}
      updateRecord={updateTeacher}
      setStatus={updateTeacherStatus}
      deleteRecord={deleteTeacher}
      resetPassword={resetTeacherPassword}
    />
  );
}
