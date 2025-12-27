import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="bg-white py-16" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              من <span className="text-brand-orange">نحن</span>
            </h1>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto">
              تعرف على المزيد عن معهدنا ومهمتنا في تقديم تعليم عالي الجودة
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-brand-orange">مهمتنا</h2>
            <p className="text-gray-800 text-lg leading-relaxed">
              مهمتنا هي تقديم خدمات تعليمية استثنائية من خلال نظام إدارة شامل
              يمكّن المعلمين ويدعم الطلاب ويضمن العمليات الفعالة. نحن ملتزمون
              بالتميز في التعليم والتحسين المستمر في جميع جوانب معهدنا.
            </p>
          </Card>

          {/* Vision Section */}
          <Card className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-brand-green">رؤيتنا</h2>
            <p className="text-gray-800 text-lg leading-relaxed">
              أن نصبح مؤسسة تعليمية رائدة تجمع بين طرق التدريس التقليدية والتكنولوجيا
              الحديثة، مما يخلق بيئة يمكن للطلاب فيها أن يزدهروا، والمعلمون أن يتفوقوا،
              والمجتمع أن يستفيد من التعليم عالي الجودة.
            </p>
          </Card>





          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-orange">التميز</h3>
              <p className="text-gray-800">
                نسعى للتميز في كل ما نقوم به، من التدريس إلى الإدارة.
              </p>
            </Card>
            <Card>
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-green">النزاهة</h3>
              <p className="text-gray-800">
                نحافظ على أعلى معايير الصدق والسلوك الأخلاقي.
              </p>
            </Card>
            <Card>
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2 text-brand-blue">الابتكار</h3>
              <p className="text-gray-800">
                نتبنى طرق التدريس المبتكرة والتكنولوجيا الحديثة.
              </p>
            </Card>
          </div>

          {/* History Section */}
          <Card>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">تاريخنا</h2>
            <p className="text-gray-800 text-lg leading-relaxed mb-4">
              تأسس معهدنا بشغف للتعليم، وقد خدم المجتمع لسنوات عديدة. بدأنا بهدف
              بسيط: تقديم تعليم عالي الجودة في بيئة داعمة.
            </p>
            <p className="text-gray-800 text-lg leading-relaxed">
              على مر السنين، نما معهدنا وتطور، واعتمد تقنيات ومنهجيات جديدة لخدمة
              طلابنا ومعلمينا بشكل أفضل. اليوم، نواصل البناء على أساس التميز بينما
              نتطلع إلى مستقبل أكثر إشراقاً.
            </p>
          </Card>

          {/* Practical Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">ساعات العمل</h2>
              <ul className="text-gray-800">
                <li>الأحد - الخميس: 9:00 ص - 9:00 م</li>
                <li>الجمعة: إغلاق</li>
                <li>السبت: 10:00 ص - 4:00 م</li>
              </ul>
            </Card>
            <Card>
              <h2 className="text-2xl font-bold mb-3 text-gray-900">الموقع والتواصل</h2>
              <p className="text-gray-800 mb-1">📍 العنوان: سيتم تحديد العنوان هنا</p>
              <p className="text-gray-800 mb-1">☎️ الهاتف: 0000000000</p>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

