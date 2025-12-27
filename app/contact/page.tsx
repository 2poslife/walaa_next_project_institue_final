'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Modal } from '@/components/ui/Modal';

export default function ContactPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsContactModalOpen(true);
  }, []);

  const closeAndGoBack = () => {
    setIsContactModalOpen(false);
    // Navigate back to the previous page (usually where the user clicked from)
    setTimeout(() => router.back(), 0);
  };

  return (
    <PublicLayout>
      <Modal open={isContactModalOpen} onClose={closeAndGoBack} ariaLabel="تواصل معنا">
        <div
          className="relative bg-slate-900 text-white shadow-2xl
                     h-[92vh] w-full overflow-y-auto rounded-none border-t-4 border-yellow-400 p-5
                     sm:h-[88vh]
                     md:h-auto md:max-h-[80vh] md:w-auto md:rounded-2xl md:border-2 md:p-8"
          dir="rtl"
        >
          <button
            onClick={closeAndGoBack}
            className="absolute right-4 top-4 md:-top-5 md:-right-5 bg-yellow-400 text-slate-900 rounded-full w-11 h-11 md:w-10 md:h-10 flex items-center justify-center shadow-lg active:scale-95 transition"
            aria-label="إغلاق"
          >
            ✕
          </button>

          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">تواصل معنا</h2>
            <p className="text-yellow-200 text-sm md:text-base">نحن دائماً هنا لمساعدتك</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <div className="rounded-xl bg-slate-800/80 border border-yellow-400/40 p-6 text-center">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">💻</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1">الدعم الفني</h3>
              <p className="text-yellow-300 font-semibold leading-snug">Mohammad<br />Sarahni</p>
            </div>
            <div className="rounded-xl bg-slate-800/80 border border-yellow-400/40 p-6 text-center">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">🧑‍💼</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1">تواصل مع صاحب المعهد</h3>
              <p className="text-yellow-300 text-sm md:text-base">أو يمكنك التواصل شخصياً</p>
            </div>
            <div className="rounded-xl bg-slate-800/80 border border-yellow-400/40 p-6 text-center">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">📞</div>
              <h3 className="text-lg md:text-xl font-semibold mb-1">اتصل بنا</h3>
              <a href="tel:0508746129" className="text-yellow-300 font-semibold text-base md:text-lg underline-offset-4 hover:underline active:opacity-80">
                0508746129
              </a>
            </div>
          </div>

          <div className="mt-6 text-center md:hidden">
            <button
              onClick={closeAndGoBack}
              className="w-full rounded-xl bg-yellow-400 text-slate-900 py-3 font-semibold active:scale-[0.99] transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </Modal>
    </PublicLayout>
  );
}

