import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden" dir="rtl">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-2xl font-extrabold">
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">مركز</span>
                {' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">تميز</span>
              </h3>
            </div>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              نظام إدارة شامل للمعاهد الخاصة، يوفر أدوات فعالة لإدارة المعلمين والطلاب
              والدروس والمدفوعات.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">من نحن</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">اتصل بنا</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="group-hover:translate-x-[-4px] transition-transform">تسجيل الدخول</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white">معلومات الاتصال</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <svg
                    className="w-5 h-5 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span className="text-gray-300 mt-2 group-hover:text-white transition-colors">الرينه</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors font-semibold">0508746129</span>
              </li>
              <li className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <span className="text-orange-400">👤</span>
                </div>
                <span className="text-gray-300 group-hover:text-white transition-colors font-semibold">ولاء مناصره</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {currentYear} <span className="text-orange-400 font-semibold">مركز تميز</span>. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}

