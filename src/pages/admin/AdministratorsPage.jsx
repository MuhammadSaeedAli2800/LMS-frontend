import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, fieldAria, inputClassName } from '../../components/FormField';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { Spinner } from '../../components/Spinner';
import { TemporaryPasswordDialog } from '../../components/TemporaryPasswordDialog';
import { PAGE_SIZE } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { createAdmin, listAdmins } from '../../services/adminService';
import { displayValue } from '../../utils/format';
import { hasErrors, isValidEmail, mapFieldErrors } from '../../utils/validation';

export function AdministratorsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  useDocumentTitle('Administrators');

  useEffect(() => {
    setAppliedSearch(debouncedSearch);
  }, [debouncedSearch]);

  const queryKey = appliedSearch;
  const [seenQuery, setSeenQuery] = useState(queryKey);
  if (seenQuery !== queryKey) {
    setSeenQuery(queryKey);
    if (page !== 1) setPage(1);
  }

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setListError('');
    listAdmins({ search: appliedSearch.trim(), page, limit: PAGE_SIZE })
      .then((result) => {
        if (ignore) return;
        const data = result.data || {};
        const list = Array.isArray(data.admins) ? data.admins : [];
        setRows(list);
        setPagination(data.pagination || { page, limit: PAGE_SIZE, total: list.length, totalPages: 1 });
      })
      .catch((error) => {
        if (ignore || error.code === 'MUST_CHANGE_PASSWORD') return;
        setRows([]);
        setListError(error.message || 'Could not load administrators.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [appliedSearch, page, reloadKey]);

  function openCreate() {
    setName('');
    setEmail('');
    setFormErrors({});
    setFormError('');
    setFormOpen(true);
  }

  async function handleCreate(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Full name is required.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    setFormErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    try {
      const result = await createAdmin({ name: name.trim(), email: email.trim() });
      const password = result.data?.temporaryPassword;
      setFormOpen(false);
      setReloadKey((value) => value + 1);
      if (!password) {
        toast.error('The administrator was created, but no temporary password was returned.');
        return;
      }
      setTemporaryPassword(password);
      toast.success('Administrator created.');
    } catch (error) {
      if (error.code === 'MUST_CHANGE_PASSWORD') return;
      const fieldErrors = mapFieldErrors(error);
      if (hasErrors(fieldErrors)) setFormErrors(fieldErrors);
      setFormError(error.message || 'Could not create this administrator.');
      toast.error(error.message || 'Could not create this administrator.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Administrators" description="Privileged accounts. Creating one is deliberate, and these accounts cannot be deleted here.">
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add administrator
        </Button>
      </PageHeader>

      <form
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search);
        }}
      >
        <FormField id="admin-search" label="Search administrators">
          <input
            {...fieldAria('admin-search', '')}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or email"
            className={inputClassName}
          />
        </FormField>
        <div className="mt-4 flex gap-2">
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {search || appliedSearch ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('');
                setAppliedSearch('');
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </form>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-700">
          {loading
            ? 'Loading administrators'
            : `${pagination.total || 0} ${pagination.total === 1 ? 'administrator' : 'administrators'}`}
        </h2>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner className="h-6 w-6 text-primary" label="Loading administrators" />
          </div>
        ) : null}
        {!loading && listError ? (
          <ErrorMessage message={listError} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : null}
        {!loading && !listError && rows.length === 0 ? (
          <EmptyState
            title={appliedSearch.trim() ? 'No administrators match this search' : 'No administrators yet'}
            description={
              appliedSearch.trim()
                ? 'Try a different name or email.'
                : 'Add an administrator when another person needs to manage the school.'
            }
          />
        ) : null}
        {!loading && !listError && rows.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th scope="col" className="px-3 py-3 font-medium">Name</th>
                    <th scope="col" className="px-3 py-3 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id || row.email} className="border-b border-gray-100">
                      <td className="px-3 py-3 text-gray-900">{displayValue(row.name)}</td>
                      <td className="break-all px-3 py-3 text-gray-900">{displayValue(row.email)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <article key={row.id || row.email} className="rounded-xl border border-gray-200 p-4">
                  <h3 className="font-medium text-gray-900">{displayValue(row.name)}</h3>
                  <p className="mt-1 break-all text-sm text-gray-600">{displayValue(row.email)}</p>
                </article>
              ))}
            </div>
            <div className="mt-4">
              <Pagination
                page={pagination.page || page}
                totalPages={pagination.totalPages || 1}
                total={pagination.total || 0}
                noun="administrators"
                onPageChange={setPage}
              />
            </div>
          </>
        ) : null}
      </section>

      <Modal
        open={formOpen}
        title="Add administrator"
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        dismissible={!saving}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleCreate} noValidate>
          {formError ? <ErrorMessage message={formError} /> : null}
          <p className="text-sm text-gray-600">
            New administrators receive a temporary password and must change it at first login. You cannot assign a different role.
          </p>
          <FormField id="admin-name" label="Full name" error={formErrors.name}>
            <input
              {...fieldAria('admin-name', formErrors.name)}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              className={inputClassName}
            />
          </FormField>
          <FormField id="admin-email" label="Email" error={formErrors.email}>
            <input
              {...fieldAria('admin-email', formErrors.email)}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
              className={inputClassName}
            />
          </FormField>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 text-white" label="Creating administrator" /> : null}
              Create administrator
            </Button>
          </div>
        </form>
      </Modal>

      <TemporaryPasswordDialog
        open={Boolean(temporaryPassword)}
        password={temporaryPassword}
        audience="administrator"
        onClose={() => setTemporaryPassword('')}
      />
    </div>
  );
}
