'use client';

type Rule = {
  icon: string;
  title: string;
  description: string;
};

const rules: Rule[] = [
  {
    icon: '⏰',
    title: 'الالتزام بالمواعيد',
    description:
      'يجب الالتزام بمواعيد الدروس والحضور في الوقت المحدد.',
  },
  {
    icon: '🤐',
    title: 'الهدوء والانضباط',
    description:
      'الحفاظ على الهدوء والانضباط داخل قاعات الدراسة.',
  },
  {
    icon: '📵',
    title: 'إغلاق الهاتف',
    description:
      'إغلاق الهاتف المحمول أو وضعه على الوضع الصامت أثناء الدرس.',
  },
  {
    icon: '📝',
    title: 'إكمال الواجبات',
    description:
      'إكمال جميع الواجبات والأنشطة في الوقت المحدد.',
  },
  {
    icon: '🤝',
    title: 'الاحترام المتبادل',
    description:
      'التعامل باحترام متبادل بين الطلاب والمعلمين والإداريين.',
  },
  {
    icon: '🚫',
    title: 'منع الغياب',
    description:
      'إعلام المعهد مسبقاً في حالة الغياب مع عذر مقبول.',
  },
];

export function RulesSection() {
  return (
    <section className="py-16 bg-gray-100" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          قوانين المعهد
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rules.map((rule) => (
            <div
              key={rule.title}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 text-center"
            >
              <div className="text-6xl mb-4">{rule.icon}</div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                {rule.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


