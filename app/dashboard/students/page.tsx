'use client';

import { useEffect, useState } from 'react';
import { api, getAuthToken } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Student, EducationLevel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    parent_contact: '',
    education_level_id: '',
    class: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    full_name?: string;
    parent_contact?: string;
    education_level_id?: string;
  }>({});
  const [filters, setFilters] = useState({
    search: '',
    education_level_id: '',
    show_deleted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deletionNote, setDeletionNote] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { isAuthenticated, loading: authLoading, isAdmin, isTeacher } = useAuth();
  const canManageStudents = isAdmin || isTeacher;

  const loadData = async () => {
    // Check if we have a token before making the request
    const token = getAuthToken();
    
    if (!token) {
      // No token, don't make the request - DashboardLayout will handle redirect
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const [studentsRes, levelsRes] = await Promise.all([
        api.getStudents(filters.show_deleted),
        api.getEducationLevels(),
      ]);

      console.log('Students response:', studentsRes);
      console.log('Education levels response:', levelsRes);

      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data as Student[]);
      } else {
        console.error('Failed to load students:', studentsRes);
        // Check if it's an authentication error
        const isAuthError = studentsRes?.error?.includes('Session expired') ||
                           studentsRes?.error?.includes('Authentication required');
        if (isAuthError) {
          // Authentication error - tokens are already cleared
          // Don't set error, just return and let DashboardLayout handle redirect
          return;
        }
      }
      
      if (levelsRes && levelsRes.success && levelsRes.data) {
        console.log('Education levels data:', levelsRes.data);
        if (Array.isArray(levelsRes.data)) {
          if (levelsRes.data.length > 0) {
            setEducationLevels(levelsRes.data as EducationLevel[]);
            console.log('Education levels set:', levelsRes.data);
          } else {
            console.warn('Education levels array is empty');
            setError('لا توجد مستويات تعليمية في قاعدة البيانات');
          }
        } else {
          console.error('Education levels data is not an array:', typeof levelsRes.data, levelsRes.data);
          setError('خطأ في بيانات المستويات التعليمية');
        }
      } else {
        console.error('Failed to load education levels. Response:', levelsRes);
        const errorMsg = levelsRes?.error || 'فشل تحميل المستويات التعليمية';
        
        // Check if it's an authentication error (session expired, expired token, etc.)
        const isAuthError = errorMsg.includes('refresh token') || 
                           errorMsg.includes('expired') || 
                           errorMsg.includes('Invalid') ||
                           errorMsg.includes('Session expired') ||
                           errorMsg.includes('Authentication required');
        
        if (isAuthError) {
          // Authentication error - tokens are already cleared by API client
          // AuthContext will update and DashboardLayout will redirect
          // Don't set error message or update state
          console.log('Authentication error detected, waiting for redirect');
          return;
        }
        
        // Only set error for non-authentication errors
        setError(errorMsg);
        // Don't set empty array, keep previous state if any
        if (educationLevels.length === 0) {
          setEducationLevels([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Check if it's an authentication error
      const isAuthError = error?.status === 401 || 
                         error?.message?.includes('refresh token') || 
                         error?.message?.includes('expired') ||
                         error?.message?.includes('Session expired') ||
                         error?.message?.includes('Authentication required');
      
      if (isAuthError) {
        // Authentication error - tokens are already cleared
        // Don't set error, just return and let DashboardLayout handle redirect
        console.log('Authentication error in catch block, waiting for redirect');
        return;
      }
      
      // Only set error for non-authentication errors
      const errorMsg = error?.message || 'حدث خطأ أثناء تحميل البيانات';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [filters.show_deleted]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    // If not authenticated, don't do anything - DashboardLayout will redirect
    if (!isAuthenticated) {
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Reload education levels when form is shown to ensure fresh data
  useEffect(() => {
    if (showForm && educationLevels.length === 0 && !loading && isAuthenticated) {
      console.log('Form shown but no education levels, reloading...');
      const token = getAuthToken();
      if (!token) {
        return;
      }
      const loadLevels = async () => {
        try {
          const levelsRes = await api.getEducationLevels();
          console.log('Education levels reload response:', levelsRes);
          if (levelsRes.success && levelsRes.data && Array.isArray(levelsRes.data)) {
            setEducationLevels(levelsRes.data);
          } else if (levelsRes?.error?.includes('Session expired') || levelsRes?.error?.includes('Authentication')) {
            // Authentication error - don't do anything, let DashboardLayout handle redirect
            return;
          }
        } catch (error: any) {
          // Only log if it's not an authentication error
          if (error?.status !== 401 && !error?.message?.includes('expired') && !error?.message?.includes('Authentication')) {
            console.error('Error reloading education levels:', error);
          }
        }
      };
      loadLevels();
    }
  }, [showForm, educationLevels.length, loading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const validationErrors: typeof fieldErrors = {};
    if (!formData.full_name.trim()) {
      validationErrors.full_name = 'الاسم الكامل مطلوب';
    }
    if (!formData.education_level_id) {
      validationErrors.education_level_id = 'يرجى اختيار المستوى التعليمي';
    }
    if (formData.parent_contact.trim()) {
      const phoneRegex = /^05\d{8}$/;
      if (!phoneRegex.test(formData.parent_contact.trim())) {
        validationErrors.parent_contact = 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    try {
      const submitData = {
        full_name: formData.full_name,
        parent_contact: formData.parent_contact || null,
        education_level_id: formData.education_level_id ? parseInt(formData.education_level_id) : null,
        class: formData.class?.trim() || null,
      };

      if (editingStudent) {
        const response = await api.updateStudent(editingStudent.id, submitData);
        if (response.success) {
          await loadData();
          resetForm();
        } else {
          if (response.error?.includes('الطالب موجود')) {
            setFieldErrors({ full_name: 'الطالب موجود مسبقًا بهذا الاسم' });
          } else if (response.error?.includes('المستوى')) {
            setFieldErrors({ education_level_id: response.error });
          } else if (response.error?.includes('الهاتف')) {
            setFieldErrors({ parent_contact: response.error });
          } else {
            setError(response.error || 'فشل تحديث الطالب');
          }
        }
      } else {
        const response = await api.createStudent(submitData);
        if (response.success) {
          await loadData();
          resetForm();
        } else {
          if (response.error?.includes('الطالب موجود')) {
            setFieldErrors({ full_name: 'الطالب موجود مسبقًا' });
          } else if (response.error?.includes('المستوى')) {
            setFieldErrors({ education_level_id: response.error });
          } else if (response.error?.includes('الهاتف')) {
            setFieldErrors({ parent_contact: response.error });
          } else {
            setError(response.error || 'فشل إضافة الطالب');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      parent_contact: student.parent_contact || '',
      education_level_id: student.education_level_id?.toString() || '',
      class: student.class || '',
    });
    setShowForm(true);
  };

  const handleDelete = (student: Student) => {
    if (!isAdmin) return;
    setStudentToDelete(student);
    setDeletionNote('');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    if (isAdmin && !deletionNote.trim()) {
      alert('يرجى كتابة سبب الحذف');
      return;
    }
    
    setDeleting(true);
    try {
      const note = deletionNote.trim() || undefined;
      const response = await api.deleteStudent(studentToDelete.id, note);
      
      if (!response.success) {
        alert(response.error || 'فشل حذف الطالب');
        return;
      }
      
      alert('تم حذف الطالب وجميع دروسه بنجاح');
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      setDeletionNote('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء حذف الطالب');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', parent_contact: '', education_level_id: '', class: '' });
    setEditingStudent(null);
    setShowForm(false);
    setError('');
    setFieldErrors({});
  };

  const columns = [
    { key: 'id', header: 'الرقم' },
    { 
      key: 'full_name', 
      header: 'الاسم الكامل',
      render: (student: Student) => (
        <span className={student.deleted_at ? 'text-red-600 line-through' : ''}>
          {student.full_name}
        </span>
      ),
    },
    {
      key: 'education_level',
      header: 'المستوى التعليمي',
      render: (student: any) => student.education_level?.name_ar || '-',
    },
    {
      key: 'class',
      header: 'الصف',
      render: (student: Student) => student.class || '-',
    },
    { key: 'parent_contact', header: 'جهة اتصال ولي الأمر' },
  ];

  // Add status column for admins
  if (isAdmin) {
    columns.push({
      key: 'status',
      header: 'الحالة',
      render: (student: Student) => {
        if (student.deleted_at) {
          return <span className="text-red-600 font-semibold">محذوف</span>;
        }
        return <span className="text-green-600">نشط</span>;
      },
    });
    
    // Add deletion note column for admins
    columns.push({
      key: 'deletion_note',
      header: 'سبب الحذف',
      render: (student: Student) => student.deletion_note || '-',
    });
  }

  // Add teacher column for admins
  if (isAdmin) {
    columns.push({
      key: 'created_by_teacher',
      header: 'المعلم الذي أضاف الطالب',
      render: (student: Student) => student.created_by_teacher?.full_name || '-',
    });
  }

  if (isAdmin) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      render: (student: Student) => (
        <div className="flex gap-2">
          {!student.deleted_at && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleEdit(student)}
              >
                تعديل
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(student)}
              >
                حذف
              </Button>
            </>
          )}
          {student.deleted_at && (
            <span className="text-gray-500 text-sm">لا يمكن التعديل</span>
          )}
        </div>
      ),
    });
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      !filters.search ||
      student.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (student.parent_contact && student.parent_contact.includes(filters.search));
    const matchesLevel =
      !filters.education_level_id ||
      student.education_level_id === Number(filters.education_level_id);
    return matchesSearch && matchesLevel;
  });

  if (loading || authLoading) {
    return <div className="text-center py-8 text-gray-900">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">الطلاب</h1>
        {canManageStudents && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            إضافة طالب جديد
          </Button>
        )}
      </div>

      {canManageStudents && showForm && (
        <Card
          title={editingStudent ? 'تعديل الطالب' : 'إضافة طالب جديد'}
          className="mb-6 max-w-2xl w-full mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !error.includes('Session expired') && !error.includes('Authentication') && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              label="الاسم الكامل"
              type="text"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                setFieldErrors((prev) => ({ ...prev, full_name: undefined }));
              }}
              required
            />
            {fieldErrors.full_name && (
              <p className="text-sm text-red-600">{fieldErrors.full_name}</p>
            )}
            <Input
              label="جهة اتصال ولي الأمر"
              type="tel"
              value={formData.parent_contact}
              onChange={(e) => {
                setFormData({ ...formData, parent_contact: e.target.value });
                setFieldErrors((prev) => ({ ...prev, parent_contact: undefined }));
              }}
            />
            {fieldErrors.parent_contact && (
              <p className="text-sm text-red-600">{fieldErrors.parent_contact}</p>
            )}
            {loading ? (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  المستوى التعليمي
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                  جاري التحميل...
                </div>
              </div>
            ) : (
              <>
                <Select
                  label="المستوى التعليمي"
                  value={formData.education_level_id}
                  onChange={(e) => {
                    setFormData({ ...formData, education_level_id: e.target.value });
                    setFieldErrors((prev) => ({ ...prev, education_level_id: undefined }));
                  }}
                  options={[
                    { value: '', label: 'اختر المستوى التعليمي' },
                    ...educationLevels.map((level) => ({
                      value: level.id.toString(),
                      label: level.name_ar || level.name_en || `Level ${level.id}`,
                    })),
                  ]}
                  required
                />
                {fieldErrors.education_level_id && (
                  <p className="text-sm text-red-600">{fieldErrors.education_level_id}</p>
                )}
                {educationLevels.length === 0 && (
                  <p className="text-sm text-red-600">
                    لا توجد مستويات تعليمية متاحة. يرجى التحقق من الاتصال بالخادم.
                  </p>
                )}
              </>
            )}

            {canManageStudents && (
              <Input
                label="الصف"
                type="text"
                value={formData.class}
                onChange={(e) => {
                  setFormData({ ...formData, class: e.target.value });
                }}
                placeholder="مثال: أول، ثاني، ثالث..."
              />
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                isLoading={submitting}
                disabled={loading || educationLevels.length === 0}
              >
                {editingStudent ? 'حفظ التغييرات' : 'إضافة'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                إلغاء
              </Button>
            </div>
            {educationLevels.length === 0 && !loading && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ لا يمكن إضافة طالب بدون مستويات تعليمية. يرجى التأكد من وجود مستويات تعليمية في قاعدة البيانات.
              </p>
            )}
          </form>
        </Card>
      )}

      <Card
        title="تصفية الطلاب"
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="بحث بالاسم أو الهاتف"
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            placeholder="اكتب جزءًا من الاسم أو رقم الهاتف"
          />
          <Select
            label="المستوى التعليمي"
            value={filters.education_level_id}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                education_level_id: e.target.value,
              }))
            }
            options={[
              { value: '', label: 'جميع المستويات' },
              ...educationLevels.map((level) => ({
                value: level.id.toString(),
                label: level.name_ar || level.name_en || `Level ${level.id}`,
              })),
            ]}
          />
          {isAdmin && (
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.show_deleted}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      show_deleted: e.target.checked,
                    }));
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">إظهار الطلاب المحذوفين</span>
              </label>
            </div>
          )}
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() =>
                setFilters({
                  search: '',
                  education_level_id: '',
                  show_deleted: false,
                })
              }
              disabled={!filters.search && !filters.education_level_id && !filters.show_deleted}
            >
              مسح التصفية
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={filteredStudents}
          emptyMessage={filters.search || filters.education_level_id ? 'لا توجد نتائج مطابقة للتصفية' : 'لا يوجد طلاب'}
        />
      </Card>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStudentToDelete(null);
          setDeletionNote('');
        }}
        ariaLabel="تأكيد حذف الطالب"
      >
        <Card title="تأكيد حذف الطالب">
          <div className="space-y-4">
            <p className="text-gray-700">
              هل أنت متأكد من حذف الطالب <strong>{studentToDelete?.full_name}</strong>؟
              <br />
              سيتم حذف جميع دروس هذا الطالب أيضاً (فردية، جماعية، وعلاجية).
              <br />
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
            
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الحذف (مطلوب)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={deletionNote}
                  onChange={(e) => setDeletionNote(e.target.value)}
                  placeholder="اكتب سبب الحذف هنا... (مثال: اسم الطالب خاطئ)"
                  required
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setStudentToDelete(null);
                  setDeletionNote('');
                }}
                disabled={deleting}
              >
                إلغاء
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={deleting}
                disabled={isAdmin && !deletionNote.trim()}
              >
                حذف
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
}
