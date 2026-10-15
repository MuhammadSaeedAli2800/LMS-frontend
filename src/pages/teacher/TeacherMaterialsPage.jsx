import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { createMaterial, deleteMaterial, fetchMaterials, fetchTeacherCourses, updateMaterial } from '../../services/academicService';

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx';

export function TeacherMaterialsPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Learning materials');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherCourses();
      const list = result.data.courses || [];
      setCourses(list);
      setCourseId((current) => current || list[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    if (!courseId) return;
    try {
      const result = await fetchMaterials(courseId);
      setMaterials(result.data.materials || []);
    } catch (err) {
      toast.error(err.message || 'Could not load materials.');
    }
  }, [courseId]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const course = courses.find((item) => item.id === courseId);
  const archived = course?.status === 'archived';

  async function onCreate(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get('file');
    setBusy(true);
    try {
      await createMaterial(courseId, {
        title: form.get('title'),
        description: form.get('description'),
        externalUrl: form.get('externalUrl'),
        file: file && file.name ? file : null,
      });
      toast.success('Material added.');
      formElement.reset();
      await loadMaterials();
    } catch (err) {
      toast.error(err.message || 'Could not add the material.');
    } finally {
      setBusy(false);
    }
  }

  async function onEdit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    setBusy(true);
    try {
      await updateMaterial(editing.id, {
        title: form.get('title'),
        description: form.get('description'),
        externalUrl: form.get('externalUrl'),
        file: file && file.name ? file : null,
      });
      toast.success('Material updated.');
      setEditing(null);
      await loadMaterials();
    } catch (err) {
      toast.error(err.message || 'Could not update the material.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(material) {
    setBusy(true);
    try {
      await deleteMaterial(material.id);
      toast.success('Material removed.');
      await loadMaterials();
    } catch (err) {
      toast.error(err.message || 'Could not remove the material.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Learning materials" description="Upload a PDF, Word document, or PowerPoint file, or add a video or learning link. Files can be up to 10 MB." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading materials" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={loadCourses} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No assigned courses" /></div> : null}
      {!loading && !error && course ? (
        <section className="space-y-4">
          <FormField id="material-course" label="Course">
            <select id="material-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              {courses.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.courseCode}</option>)}
            </select>
          </FormField>
          <ScheduleText course={course} />
          {archived ? <p className="text-sm text-gray-600">This course is archived, so materials cannot be changed.</p> : (
            <form key={editing?.id || 'new'} className="panel space-y-3 bg-slate-50 p-5" onSubmit={editing ? onEdit : onCreate}>
              <FormField id="material-title" label="Title"><input id="material-title" name="title" className={inputClassName} required minLength={2} defaultValue={editing?.title || ''} /></FormField>
              <FormField id="material-description" label="Description"><textarea id="material-description" name="description" className={inputClassName} rows={2} defaultValue={editing?.description || ''} /></FormField>
              <FormField id="material-link" label="Video or learning link"><input id="material-link" name="externalUrl" className={inputClassName} placeholder="https://" defaultValue={editing?.externalUrl || ''} /></FormField>
              <FormField id="material-file" label="File"><input id="material-file" name="file" type="file" accept={ACCEPT} className={inputClassName} /></FormField>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save material' : 'Add material'}</Button>
                {editing ? <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button> : null}
              </div>
            </form>
          )}
          {materials.length === 0 ? <EmptyState title="No materials" /> : (
            <ul className="panel divide-y divide-line">
              {materials.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.externalUrl ? <a className="text-primary hover:underline" href={item.externalUrl} target="_blank" rel="noreferrer">Open link</a> : null}
                    {item.downloadPath ? <a className="ml-3 text-primary hover:underline" href={item.downloadPath}>Download</a> : null}
                  </div>
                  {archived ? null : (
                    <div className="flex gap-3">
                      <button type="button" className="font-medium text-primary hover:underline" onClick={() => setEditing(item)}>Edit</button>
                      <button type="button" className="font-medium text-red-700 hover:underline" onClick={() => onDelete(item)}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
