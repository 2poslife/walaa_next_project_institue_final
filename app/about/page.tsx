import { PublicLayout } from '@/components/layout/PublicLayout';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-16" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <h1 className="text-5xl font-bold text-gray-800 mb-4">
                من <span className="text-brand-orange">نحن</span>
              </h1>
              <p className="text-xl text-gray-800 max-w-3xl mx-auto">
                تعرف على المزيد عن معهدنا ومهمتنا في تقديم تعليم عالي الجودة
              </p>
            </div>
          </div>

          {/* Mission Section */}
          <div className="mb-8 group">
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-orange-50/50 border-2 border-orange-200/50 shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-bl-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/10 rounded-tr-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h2 className="text-3xl font-bold text-brand-orange">مهمتنا</h2>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pr-4">
                  مهمتنا هي تقديم خدمات تعليمية استثنائية من خلال نظام إدارة شامل
                  يمكّن المعلمين ويدعم الطلاب ويضمن العمليات الفعالة. نحن ملتزمون
                  بالتميز في التعليم والتحسين المستمر في جميع جوانب معهدنا.
                </p>
              </div>
            </div>
          </div>

          {/* Vision Section */}
          <div className="mb-8 group">
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50/50 border-2 border-green-200/50 shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-40 h-40 bg-green-500/10 rounded-br-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-400/10 rounded-tl-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👁️</span>
                  </div>
                  <h2 className="text-3xl font-bold text-brand-green">رؤيتنا</h2>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pr-4">
                  أن نصبح مؤسسة تعليمية رائدة تجمع بين طرق التدريس التقليدية والتكنولوجيا
                  الحديثة، مما يخلق بيئة يمكن للطلاب فيها أن يزدهروا، والمعلمون أن يتفوقوا،
                  والمجتمع أن يستفيد من التعليم عالي الجودة.
                </p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">قيمنا</h2>
              <p className="text-gray-600 text-lg">المبادئ الأساسية التي توجه عملنا</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Excellence Card */}
              <div className="group relative p-8 rounded-2xl bg-white border-2 border-orange-200/50 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-brand-orange">التميز</h3>
                  <p className="text-gray-700 leading-relaxed">
                    نسعى للتميز في كل ما نقوم به، من التدريس إلى الإدارة.
                  </p>
                </div>
              </div>

              {/* Integrity Card */}
              <div className="group relative p-8 rounded-2xl bg-white border-2 border-green-200/50 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-green-500/10 rounded-br-full"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <span className="text-4xl">🤝</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-brand-green">النزاهة</h3>
                  <p className="text-gray-700 leading-relaxed">
                    نحافظ على أعلى معايير الصدق والسلوك الأخلاقي.
                  </p>
                </div>
              </div>

              {/* Innovation Card */}
              <div className="group relative p-8 rounded-2xl bg-white border-2 border-blue-200/50 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <span className="text-4xl">📚</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-brand-blue">الابتكار</h3>
                  <p className="text-gray-700 leading-relaxed">
                    نتبنى طرق التدريس المبتكرة والتكنولوجيا الحديثة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="mb-8 group">
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-100/50 border-2 border-gray-200/50 shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/30 to-transparent"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gray-400/10 rounded-bl-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">📖</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">تاريخنا</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-800 text-lg leading-relaxed pr-4">
                    تأسس معهدنا بشغف للتعليم، وقد خدم المجتمع لسنوات عديدة. بدأنا بهدف
                    بسيط: تقديم تعليم عالي الجودة في بيئة داعمة.
                  </p>
                  <p className="text-gray-800 text-lg leading-relaxed pr-4">
                    على مر السنين، نما معهدنا وتطور، واعتمد تقنيات ومنهجيات جديدة لخدمة
                    طلابنا ومعلمينا بشكل أفضل. اليوم، نواصل البناء على أساس التميز بينما
                    نتطلع إلى مستقبل أكثر إشراقاً.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Teachers Section */}
          <div className="mt-8 group">
            <div className="relative p-10 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50/50 border-2 border-indigo-200/50 shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-bl-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/10 rounded-tr-full blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👨‍🏫</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">معلمونا</h2>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pr-4">
                  نحن فخورون بفريقنا من المعلمين المتميزين الذين يجلبون سنوات من الخبرة والشغف للتعليم.
                  معلمونا ملتزمون بتقديم تعليم عالي الجودة وخلق بيئة تعليمية محفزة وداعمة للطلاب.
                  نحن نؤمن بأن المعلمين هم العمود الفقري لنجاحنا، ونسعى جاهدين لتوفير الدعم والموارد
                  اللازمة لتمكينهم من تحقيق أفضل النتائج مع طلابهم.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
