/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Presentation, 
  BookOpen, 
  ChevronRight, 
  Copy, 
  Check,
  LayoutGrid,
  ArrowRight,
  Database,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from './lib/firebase';
import AdminPanel from './components/AdminPanel';

export interface PromptExample {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  prompt: string;
  howToUse: string;
  resultSample: string;
  resultImageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
}

const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case 'FileText': return <FileText className={className} />;
    case 'Image': return <ImageIcon className={className} />;
    case 'Presentation': return <Presentation className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    default: return <LayoutGrid className={className} />;
  }
};

export default function App() {
  const [isAdminView, setIsAdminView] = useState(window.location.hash === '#admin');
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<PromptExample[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptExample | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminView(window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const qCats = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const qPrompts = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'));
    const unsubPrompts = onSnapshot(qPrompts, (snapshot) => {
      setPrompts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptExample)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'prompts'));

    return () => { unsubCats(); unsubPrompts(); };
  }, []);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategoryId, searchQuery, prompts]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isAdminView) return <AdminPanel />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/50">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg cursor-pointer transition-transform hover:scale-105" onClick={() => (window.location.hash = '')}>
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block cursor-pointer" onClick={() => (window.location.hash = '')}>
                AI Trợ Lý <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-200 dark:decoration-blue-400/30">Cán Bộ</span>
              </h1>
            </div>
            
            <div className="relative flex-1 max-w-md mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Tìm kiếm mẫu prompt..."
                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-gray-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-500 dark:text-gray-400"
                title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button 
                onClick={() => (window.location.hash = 'admin')}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                title="Quản trị"
              >
                <Database className="w-4 h-4" />
              </button>
              
              <a 
                href="#huong-dan-chi-tiet" 
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
              >
                Tư duy AI
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
          </div>
        )}

        {/* Welcome Section */}
        {!loading && !selectedCategoryId && !searchQuery && (
          <section className="mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-900/50">
                    Chính Phủ Số 2024
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-[1.1] mb-6">
                    Nâng cao hiệu suất công việc với <span className="text-blue-600 dark:text-blue-400">Trí tuệ nhân tạo</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                    Thư viện prompt mẫu chuẩn hóa dành cho cán bộ cấp xã phường. Soạn thảo văn bản, thiết kế tuyên truyền và lập báo cáo chỉ trong vài phút.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setSelectedCategoryId(categories[0]?.id)}
                      className="px-6 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                      Khám phá ngay <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => document.getElementById('huong-dan-chi-tiet')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      Xem hướng dẫn
                    </button>
                  </div>
                </motion.div>
              </div>
              
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {categories.slice(0, 4).map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-2xl/20 hover:-translate-y-1 transition-all cursor-pointer group"
                    id={`cat-card-${cat.id}`}
                  >
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                      <CategoryIcon name={cat.icon} className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{cat.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{cat.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Tabs */}
        {!loading && (
          <section className="mb-10 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedCategoryId === null 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    selectedCategoryId === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Prompt Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPrompts.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md dark:hover:shadow-2xl/20 transition-all group flex flex-col h-full"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {categories.find(c => c.id === p.categoryId)?.name || 'Prompt'}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(p.prompt, p.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {copiedId === p.id ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 mt-auto">
                  <button 
                    onClick={() => setSelectedPrompt(p)}
                    className="w-full text-left text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between group/btn"
                  >
                    Xem chi tiết & kết quả
                    <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* No Results */}
        {!loading && filteredPrompts.length === 0 && (
          <div className="py-20 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-500">Hãy thử từ khóa khác hoặc nạp dữ liệu trong trang quản trị.</p>
          </div>
        )}

        {/* Guide Section */}
        <section id="huong-dan-chi-tiet" className="mt-24 pt-20 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                Kỹ năng viết Prompt hiệu quả
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Làm chủ AI thông qua việc giao tiếp rõ ràng và đầy đủ bối cảnh.
              </p>
            </div>

              <div className="space-y-6">
                {[
                  { 
                    title: '1. Nhập vai (Role)', 
                    desc: 'Xác định vai trò của AI. Càng chi tiết càng tốt (VD: Cán bộ pháp chế, Chuyên gia thiết kế đồ họa).',
                    color: 'blue' 
                  },
                  { 
                    title: '2. Nhiệm vụ (Task)', 
                    desc: 'Mô tả cụ thể đầu ra mong muốn. Đừng yêu cầu chung chung, hãy dùng các động từ mạnh (Soạn thảo, Tóm tắt, Vẽ bảng biểu).',
                    color: 'blue'
                  },
                  { 
                    title: '3. Định dạng (Format)', 
                    desc: 'Yêu cầu định dạng cụ thể (VD: Bảng, Danh sách, Markdown, Email trang trọng).',
                    color: 'blue'
                  }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 mt-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <LayoutGrid className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-bold mb-2">AI Trợ Lý Cán Bộ</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Hướng tới Chính phủ điện tử & Chuyển đổi số toàn diện</p>
          <div className="mt-8 flex justify-center gap-4">
               <button onClick={() => window.location.hash = 'admin'} className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold uppercase tracking-widest transition-colors">Admin Dashboard</button>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPrompt(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded mb-2">
                       {categories.find(c => c.id === selectedPrompt.categoryId)?.name || 'Prompt'}
                    </span>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedPrompt.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPrompt(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <section>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Câu lệnh mẫu</h4>
                      <button 
                        onClick={() => copyToClipboard(selectedPrompt.prompt, 'modal')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedId === 'modal' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 font-mono text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedPrompt.prompt}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Ghi chú sử dụng</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPrompt.howToUse}</p>
                  </section>

                  {selectedPrompt.resultSample && (
                    <section>
                      <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Kết quả AI tham khảo</h4>
                      <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap italic opacity-80">
                        {selectedPrompt.resultSample}
                      </div>
                    </section>
                  )}

                  {selectedPrompt.resultImageUrl && (
                    <section>
                      <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Hình ảnh minh họa kết quả</h4>
                      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img 
                          src={selectedPrompt.resultImageUrl} 
                          alt="Minh họa kết quả" 
                          className="w-full h-auto object-contain bg-gray-50 dark:bg-gray-900"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </section>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <button 
                    onClick={() => copyToClipboard(selectedPrompt.prompt, 'modal')}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    {copiedId === 'modal' ? 'Đã sao chép!' : 'Sao chép prompt'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

