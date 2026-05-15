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
  Moon,
  Star,
  Zap,
  Sparkles,
  Cpu,
  Shield,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from './lib/firebase';
import AdminPanel from './components/AdminPanel';

const AI_TOOLS = [
  {
    name: 'ChatGPT',
    desc: 'Chuyên gia ngôn ngữ, hội thoại và giải quyết vấn đề đa năng.',
    url: 'https://chat.openai.com',
    color: 'from-emerald-500 to-teal-600',
    tags: ['Hội thoại', 'Văn bản']
  },
  {
    name: 'Gemini',
    desc: 'AI thông minh nhất từ Google, tích hợp sâu vào hệ sinh thái làm việc.',
    url: 'https://gemini.google.com',
    color: 'from-blue-500 to-indigo-600',
    tags: ['Google', 'Đa nhiệm']
  },
  {
    name: 'NotebookLM',
    desc: 'Trợ lý nghiên cứu và tóm tắt tài liệu, quản lý tri thức cá nhân.',
    url: 'https://notebooklm.google.com',
    color: 'from-purple-500 to-pink-600',
    tags: ['Nghiên cứu', 'Tóm tắt']
  },
  {
    name: 'Gamma AI',
    desc: 'Tự động tạo bài thuyết trình, website và tài liệu chỉ từ gợi ý.',
    url: 'https://gamma.app',
    color: 'from-indigo-600 to-violet-700',
    tags: ['Slides', 'Web']
  },
  {
    name: 'Canva AI',
    desc: 'Thiết kế hình ảnh và nội dung truyền thông trực quan với AI.',
    url: 'https://www.canva.com',
    color: 'from-cyan-500 to-blue-500',
    tags: ['Thiết kế', 'Hình ảnh']
  },
  {
    name: 'Grok',
    desc: 'AI từ X (Twitter) với truy cập dữ liệu thời gian thực và hài hước.',
    url: 'https://grok.x.ai',
    color: 'from-gray-700 to-black',
    tags: ['Tin tức', 'Real-time']
  }
];

const BUILDER_FIELDS = [
  { id: 'all', name: 'Tất cả', color: 'bg-gray-500' },
  { id: 'admin', name: 'Hành chính', color: 'bg-blue-500' },
  { id: 'legal', name: 'Tư pháp', color: 'bg-indigo-500' },
  { id: 'culture', name: 'Tuyên truyền', color: 'bg-orange-500' },
  { id: 'land', name: 'Địa chính', color: 'bg-emerald-500' },
  { id: 'tech', name: 'Số hóa', color: 'bg-cyan-500' },
  { id: 'social', name: 'An sinh xã hội', color: 'bg-rose-500' },
  { id: 'security', name: 'An ninh trật tự', color: 'bg-red-500' },
  { id: 'economy', name: 'Kinh tế', color: 'bg-yellow-500' },
  { id: 'health', name: 'Y tế cộng đồng', color: 'bg-teal-500' }
];

const SCENARIO_SUGGESTIONS = {
  roles: [
    { text: 'Cán bộ Văn phòng', field: 'admin' },
    { text: 'Cán bộ một cửa', field: 'admin' },
    { text: 'Kế toán ngân sách', field: 'admin' },
    { text: 'Văn thư lưu trữ', field: 'admin' },
    { text: 'Cán bộ Nội vụ', field: 'admin' },
    { text: 'Chủ tịch UBND xã', field: 'admin' },
    { text: 'Phó Chủ tịch UBND xã', field: 'admin' },

    { text: 'Cán bộ Tư pháp', field: 'legal' },
    { text: 'Công chức Hộ tịch', field: 'legal' },
    { text: 'Cán bộ tiếp công dân', field: 'legal' },
    { text: 'Cán bộ xử lý đơn thư', field: 'legal' },
    { text: 'Công an xã', field: 'security' },

    { text: 'Cán bộ Văn hóa', field: 'culture' },
    { text: 'Bí thư Đoàn', field: 'culture' },
    { text: 'Hội Phụ nữ', field: 'culture' },
    { text: 'Hội Nông dân', field: 'culture' },
    { text: 'Mặt trận Tổ quốc', field: 'culture' },

    { text: 'Cán bộ Địa chính', field: 'land' },
    { text: 'Chuyên gia Môi trường', field: 'land' },
    { text: 'Cán bộ xây dựng', field: 'land' },
    { text: 'Cán bộ quản lý đô thị', field: 'land' },
    { text: 'Cán bộ phòng chống thiên tai', field: 'land' },

    { text: 'Chuyên gia Chuyển đổi số', field: 'tech' },
    { text: 'Cán bộ CNTT', field: 'tech' },
    { text: 'Cán bộ phụ trách dịch vụ công trực tuyến', field: 'tech' },

    { text: 'Cán bộ Lao động - Thương binh và Xã hội', field: 'social' },
    { text: 'Cán bộ giảm nghèo', field: 'social' },
    { text: 'Cán bộ chính sách người có công', field: 'social' },

    { text: 'Cán bộ Kinh tế', field: 'economy' },
    { text: 'Cán bộ nông nghiệp', field: 'economy' },
    { text: 'Cán bộ hợp tác xã', field: 'economy' },

    { text: 'Cán bộ Y tế xã', field: 'health' },
    { text: 'Cộng tác viên dân số', field: 'health' },
    { text: 'Cán bộ phòng chống dịch', field: 'health' }
  ],

  contexts: [
    { text: 'Báo cáo quý I', field: 'admin' },
    { text: 'Báo cáo tháng', field: 'admin' },
    { text: 'Tổng hợp nhiệm vụ tuần', field: 'admin' },
    { text: 'Chuẩn bị họp giao ban', field: 'admin' },
    { text: 'Cải cách hành chính', field: 'admin' },
    { text: 'Xây dựng nông thôn mới', field: 'admin' },
    { text: 'Tiếp đoàn kiểm tra', field: 'admin' },
    { text: 'Theo dõi tiến độ nhiệm vụ lãnh đạo giao', field: 'admin' },

    { text: 'Tiếp đoàn thanh tra', field: 'legal' },
    { text: 'Giải quyết khiếu nại', field: 'legal' },
    { text: 'Hòa giải tranh chấp cơ sở', field: 'legal' },
    { text: 'Rà soát hồ sơ hộ tịch', field: 'legal' },
    { text: 'Chứng thực giấy tờ', field: 'legal' },
    { text: 'Tuyên truyền pháp luật cho người dân', field: 'legal' },

    { text: 'Tuyên truyền an toàn giao thông', field: 'culture' },
    { text: 'Ngày hội đại đoàn kết', field: 'culture' },
    { text: 'Tuyên truyền bảo vệ môi trường', field: 'culture' },
    { text: 'Tuyên truyền dịch vụ công trực tuyến', field: 'culture' },
    { text: 'Tổ chức lễ kỷ niệm', field: 'culture' },
    { text: 'Đăng tin lên Facebook/Zalo OA', field: 'culture' },

    { text: 'Giải quyết khiếu nại đất đai', field: 'land' },
    { text: 'Kiểm tra hiện trạng đất', field: 'land' },
    { text: 'Giải phóng mặt bằng', field: 'land' },
    { text: 'Phòng chống thiên tai', field: 'land' },
    { text: 'Ra quân vệ sinh môi trường', field: 'land' },
    { text: 'Xử lý rác thải nhựa', field: 'land' },

    { text: 'Khai thác dữ liệu dân cư', field: 'tech' },
    { text: 'Số hóa hồ sơ hành chính', field: 'tech' },
    { text: 'Hướng dẫn người dân nộp hồ sơ online', field: 'tech' },
    { text: 'Tạo biểu mẫu Google Form', field: 'tech' },
    { text: 'Tổng hợp dữ liệu Excel', field: 'tech' },
    { text: 'Tạo báo cáo Power BI', field: 'tech' },

    { text: 'Rà soát hộ nghèo', field: 'social' },
    { text: 'Chi trả chính sách an sinh', field: 'social' },
    { text: 'Hỗ trợ người có công', field: 'social' },
    { text: 'Vận động hỗ trợ hộ khó khăn', field: 'social' },

    { text: 'Đảm bảo an ninh trật tự', field: 'security' },
    { text: 'Tuyên truyền phòng cháy chữa cháy', field: 'security' },
    { text: 'Phòng chống tệ nạn xã hội', field: 'security' },
    { text: 'Xác minh thông tin cư trú', field: 'security' },

    { text: 'Phát triển kinh tế hộ gia đình', field: 'economy' },
    { text: 'Hỗ trợ sản xuất nông nghiệp', field: 'economy' },
    { text: 'Tuyên truyền chuyển đổi cây trồng', field: 'economy' },
    { text: 'Khuyến khích kinh doanh hộ cá thể', field: 'economy' },

    { text: 'Phòng chống dịch bệnh', field: 'health' },
    { text: 'Tuyên truyền vệ sinh an toàn thực phẩm', field: 'health' },
    { text: 'Chăm sóc sức khỏe cộng đồng', field: 'health' }
  ],

  tasks: [
    { text: 'Soạn thảo tờ trình', field: 'admin' },
    { text: 'Soạn công văn hành chính', field: 'admin' },
    { text: 'Soạn thông báo mời họp', field: 'admin' },
    { text: 'Lập lịch công tác tuần', field: 'admin' },
    { text: 'Tổng hợp báo cáo từ nhiều nguồn', field: 'admin' },
    { text: 'Viết báo cáo kết quả thực hiện', field: 'admin' },
    { text: 'Lập bảng phân công nhiệm vụ', field: 'admin' },
    { text: 'Trả lời ý kiến cử tri', field: 'admin' },
    { text: 'Xây dựng quy trình làm việc', field: 'admin' },

    { text: 'Xác minh hồ sơ pháp lý', field: 'legal' },
    { text: 'Dự thảo quyết định xử phạt', field: 'legal' },
    { text: 'Soạn biên bản làm việc', field: 'legal' },
    { text: 'Tóm tắt văn bản pháp luật', field: 'legal' },
    { text: 'Soạn nội dung hòa giải tranh chấp', field: 'legal' },
    { text: 'Viết phiếu hướng dẫn thủ tục pháp lý', field: 'legal' },
    { text: 'Phân tích nội dung đơn khiếu nại', field: 'legal' },

    { text: 'Viết bài tuyên truyền', field: 'culture' },
    { text: 'Lập kế hoạch sự kiện', field: 'culture' },
    { text: 'Thiết kế thông điệp truyền thông', field: 'culture' },
    { text: 'Viết kịch bản loa phát thanh', field: 'culture' },
    { text: 'Viết bài đăng Facebook', field: 'culture' },
    { text: 'Tạo khẩu hiệu tuyên truyền', field: 'culture' },
    { text: 'Soạn bài phát biểu khai mạc', field: 'culture' },

    { text: 'Lập biên bản kiểm tra hiện trạng', field: 'land' },
    { text: 'Soạn kế hoạch ra quân vệ sinh môi trường', field: 'land' },
    { text: 'Tổng hợp danh sách hộ ảnh hưởng giải phóng mặt bằng', field: 'land' },
    { text: 'Đề xuất phương án xử lý rác thải', field: 'land' },
    { text: 'Viết báo cáo phòng chống thiên tai', field: 'land' },
    { text: 'Soạn thông báo về trật tự xây dựng', field: 'land' },

    { text: 'Biên soạn hướng dẫn thủ tục trực tuyến', field: 'tech' },
    { text: 'Tạo prompt AI cho cán bộ', field: 'tech' },
    { text: 'Phân tích dữ liệu Excel', field: 'tech' },
    { text: 'Tạo bảng theo dõi tiến độ', field: 'tech' },
    { text: 'Tạo nội dung tập huấn chuyển đổi số', field: 'tech' },
    { text: 'Viết hướng dẫn sử dụng dịch vụ công', field: 'tech' },
    { text: 'Tạo checklist số hóa hồ sơ', field: 'tech' },

    { text: 'Lập danh sách hộ nghèo cần rà soát', field: 'social' },
    { text: 'Soạn kế hoạch thăm hỏi gia đình chính sách', field: 'social' },
    { text: 'Viết báo cáo an sinh xã hội', field: 'social' },
    { text: 'Soạn thông báo chi trả chế độ', field: 'social' },

    { text: 'Soạn kế hoạch đảm bảo an ninh trật tự', field: 'security' },
    { text: 'Viết thông báo phòng cháy chữa cháy', field: 'security' },
    { text: 'Lập phương án bảo vệ sự kiện', field: 'security' },

    { text: 'Lập kế hoạch phát triển kinh tế địa phương', field: 'economy' },
    { text: 'Viết báo cáo tình hình sản xuất nông nghiệp', field: 'economy' },
    { text: 'Soạn nội dung vận động hộ kinh doanh', field: 'economy' },

    { text: 'Soạn bài tuyên truyền phòng dịch', field: 'health' },
    { text: 'Lập kế hoạch kiểm tra an toàn thực phẩm', field: 'health' },
    { text: 'Viết khuyến cáo sức khỏe cộng đồng', field: 'health' }
  ],

  formats: [
    { text: 'Công văn hành chính', field: 'admin' },
    { text: 'Tờ trình chuẩn Nghị định 30', field: 'admin' },
    { text: 'Báo cáo chi tiết', field: 'admin' },
    { text: 'Thông báo mời họp', field: 'admin' },
    { text: 'Biên bản cuộc họp', field: 'admin' },
    { text: 'Lịch công tác tuần', field: 'admin' },
    { text: 'Bảng phân công nhiệm vụ', field: 'admin' },
    { text: 'Email trang trọng', field: 'admin' },

    { text: 'Biên bản làm việc', field: 'legal' },
    { text: 'Quyết định xử phạt', field: 'legal' },
    { text: 'Phiếu hướng dẫn thủ tục', field: 'legal' },
    { text: 'Bản tóm tắt văn bản pháp luật', field: 'legal' },
    { text: 'Nội dung trả lời đơn thư', field: 'legal' },

    { text: 'Bài đăng Facebook', field: 'culture' },
    { text: 'Kịch bản truyền thanh', field: 'culture' },
    { text: 'Infographic nội dung', field: 'culture' },
    { text: 'Bài phát biểu', field: 'culture' },
    { text: 'Poster tuyên truyền', field: 'culture' },
    { text: 'Kịch bản video ngắn', field: 'culture' },

    { text: 'Biên bản kiểm tra hiện trạng', field: 'land' },
    { text: 'Báo cáo môi trường', field: 'land' },
    { text: 'Kế hoạch ra quân', field: 'land' },
    { text: 'Danh sách hộ bị ảnh hưởng', field: 'land' },
    { text: 'Phương án xử lý hiện trường', field: 'land' },

    { text: 'Bảng so sánh dữ liệu', field: 'tech' },
    { text: 'Slide trình chiếu', field: 'tech' },
    { text: 'Checklist số hóa', field: 'tech' },
    { text: 'Quy trình thao tác', field: 'tech' },
    { text: 'Mẫu Google Form', field: 'tech' },
    { text: 'Dashboard mô tả số liệu', field: 'tech' },

    { text: 'Danh sách rà soát hộ nghèo', field: 'social' },
    { text: 'Thông báo chi trả chính sách', field: 'social' },
    { text: 'Báo cáo an sinh xã hội', field: 'social' },

    { text: 'Phương án đảm bảo an ninh', field: 'security' },
    { text: 'Thông báo phòng cháy chữa cháy', field: 'security' },
    { text: 'Kế hoạch tuần tra', field: 'security' },

    { text: 'Báo cáo kinh tế địa phương', field: 'economy' },
    { text: 'Kế hoạch hỗ trợ sản xuất', field: 'economy' },
    { text: 'Bảng thống kê hộ kinh doanh', field: 'economy' },

    { text: 'Khuyến cáo sức khỏe', field: 'health' },
    { text: 'Kế hoạch phòng chống dịch', field: 'health' },
    { text: 'Thông báo an toàn thực phẩm', field: 'health' }
  ]
};

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
  const [activeView, setActiveView] = useState<'home' | 'builder'>('home');
  const [selectedBuilderField, setSelectedBuilderField] = useState('all');

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptExample | null>(null);
  const [modalFontSize, setModalFontSize] = useState(14);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Prompt Generator State
  const [builderRole, setBuilderRole] = useState('');
  const [builderContext, setBuilderContext] = useState('');
  const [builderTask, setBuilderTask] = useState('');
  const [builderFormat, setBuilderFormat] = useState('');
  const [generatedResult, setGeneratedResult] = useState('');

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
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = p.title.toLowerCase().includes(searchLower) || 
                          p.description.toLowerCase().includes(searchLower) ||
                          p.prompt.toLowerCase().includes(searchLower);
      return matchCategory && matchSearch;
    });
  }, [selectedCategoryId, searchQuery, prompts]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or if clipboard API is unavailable
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleGeneratePrompt = () => {
    if (!builderRole || !builderTask) return;
    
    const prompt = `BẠN LÀ: ${builderRole}.
BỐI CẢNH: ${builderContext || 'Đang thực hiện công tác hành chính tại UBND cơ sở'}.
NHIỆM VỤ: ${builderTask}.
YÊU CẦU ĐỊNH DẠNG: ${builderFormat || 'Văn bản hành chính trang trọng, đầy đủ và chính xác'}.
HÃY PHẢN HỒI: Chuyên nghiệp, đúng quy định pháp luật và bám sát bối cảnh đã nêu.`;
    
    setGeneratedResult(prompt);
  };

  const handleClearBuilder = () => {
    setBuilderRole('');
    setBuilderContext('');
    setBuilderTask('');
    setBuilderFormat('');
    setGeneratedResult('');
    setSelectedBuilderField('all');
  };

  if (isAdminView) return <AdminPanel darkMode={darkMode} setDarkMode={setDarkMode} />;

  return (
    <div className="min-h-screen selection:bg-blue-100 dark:selection:bg-blue-900/50">
      {/* Header */}
      <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl cursor-pointer shadow-lg shadow-blue-500/30 transition-all hover:scale-110 active:scale-95" onClick={() => setActiveView('home')}>
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white hidden sm:block cursor-pointer" onClick={() => setActiveView('home')}>
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">PROMT</span>
              </h1>
            </div>

            <nav className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-2xl border border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setActiveView('home')}
                className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${activeView === 'home' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Thư viện
              </button>
              <button 
                onClick={() => setActiveView('builder')}
                className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${activeView === 'builder' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Tạo Prompt
              </button>
            </nav>
            
            <div className="relative flex-1 max-w-sm mx-4 group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm mẫu prompt..."
                className="w-full bg-gray-100 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 rounded-2xl py-2.5 pl-11 pr-11 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 dark:focus:border-blue-400/30 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400 shadow-sm"
                title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => (window.location.hash = 'admin')}
                className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm"
                title="Quản trị"
              >
                <Database className="w-5 h-5" />
              </button>
              
              <a 
                href="#huong-dan-chi-tiet" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-blue-500/25 active:scale-95 hidden xs:block"
              >
                #TƯ DUY AI
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Mobile Navigation */}
        {!loading && (
          <div className="flex lg:hidden gap-2 mb-8 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveView('home')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeView === 'home' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Thư viện
            </button>
            <button 
              onClick={() => setActiveView('builder')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeView === 'builder' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Tạo Prompt
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center animate-pulse">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-64 mx-auto mb-4" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-48 mx-auto" />
          </div>
        )}

        {/* Library View */}
        {!loading && activeView === 'home' && (
          <>
            {/* Welcome Section */}
            {!selectedCategoryId && !searchQuery && (
          <section className="mb-20">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl p-8 sm:p-16">
              {/* Abstract backgrounds */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
                <div>
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-100 dark:border-blue-900/50 backdrop-blur-sm">
                      <Sparkles className="w-3.5 h-3.5" /> Công Nghệ Số 2026
                    </div>
                    <h2 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white leading-[1] mb-8 tracking-tight">
                      Sức Mạnh <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">AI</span> Cho Công Việc Hành Chính
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                      Hệ thống thư viện Prompt (Câu lệnh) mẫu chuẩn hóa giúp cán bộ cấp cơ sở tối ưu hóa 300% hiệu năng soạn thảo văn bản và tuyên truyền.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                      <button 
                        onClick={() => setSelectedCategoryId(categories[0]?.id)}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-3 group"
                      >
                        BẮT ĐẦU NGAY <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => document.getElementById('huong-dan-chi-tiet')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-black hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm flex items-center gap-2"
                      >
                        Học Cách Dùng
                      </button>
                    </div>
                  </motion.div>
                </div>
                
                <div className="hidden lg:grid grid-cols-2 gap-4 relative">
                  <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
                  {categories.slice(0, 4).length > 0 ? (
                    categories.slice(0, 4).map((cat, idx) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="p-8 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/20 dark:border-gray-800/10 rounded-[2rem] shadow-xl hover:shadow-2xl dark:hover:shadow-blue-500/10 hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:rotate-6 transition-all duration-500">
                          <CategoryIcon name={cat.icon} className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-white mb-3 tracking-tight">{cat.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium">10+ Mẫu Prompt</p>
                      </motion.div>
                    ))
                  ) : (
                    // Featured skeleton if no categories
                    [1,2,3,4].map((i) => (
                      <div key={i} className="p-8 bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 h-48 rounded-[2rem]" />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
              {[
                { label: 'Prompt Chuẩn', val: '200+', icon: Sparkles, color: 'text-blue-600' },
                { label: 'Tiết Kiệm Giờ', val: '80%', icon: Clock, color: 'text-indigo-600' },
                { label: 'Bảo Mật', val: '100%', icon: Shield, color: 'text-emerald-600' },
                { label: 'Tốc Độ', val: 'x10', icon: Zap, color: 'text-amber-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">{stat.val}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search Section (Mobile & Main visibility) */}
        {!loading && (
          <div className="mb-8 md:hidden">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm mẫu prompt..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-4 pl-12 pr-12 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories Tabs */}
        {!loading && (
          <section className="mb-12 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            <div className="flex gap-3 min-w-max">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                  selectedCategoryId === null 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-95' 
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg'
                }`}
              >
                Tất cả mẫu
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2.5 ${
                    selectedCategoryId === cat.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-95' 
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg'
                  }`}
                >
                  <CategoryIcon name={cat.icon} className="w-4.5 h-4.5" />
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Prompt Grid Title */}
        {!loading && (
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              {selectedCategoryId 
                ? `Danh mục: ${categories.find(c => c.id === selectedCategoryId)?.name}` 
                : 'Thư viện Prompt nổi bật'
              }
            </h3>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{filteredPrompts.length} kết quả</span>
          </div>
        )}

        {/* Prompt Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPrompts.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-all group flex flex-col h-full border-b-[6px] border-b-gray-100 dark:border-b-gray-800 hover:border-b-blue-600 dark:hover:border-b-blue-500 hover:-translate-y-2"
              >
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50">
                      <Zap className="w-3 h-3 fill-blue-600 dark:fill-blue-400" />
                      {categories.find(c => c.id === p.categoryId)?.name || 'Prompt'}
                    </span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyToClipboard(p.prompt, p.id)}
                        className="p-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-gray-400 shadow-sm"
                        title="Sao chép nhanh"
                      >
                        {copiedId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed font-medium opacity-80">
                    {p.description}
                  </p>
                </div>
                <div className="px-8 py-5 bg-gray-50/50 dark:bg-gray-950/20 border-t border-gray-100 dark:border-gray-800 mt-auto">
                  <button 
                    onClick={() => setSelectedPrompt(p)}
                    className="w-full text-left text-sm font-black text-gray-900 dark:text-white flex items-center justify-between group/btn"
                  >
                    <span>XEM CHI TIẾT</span>
                    <div className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm group-hover/btn:bg-blue-600 group-hover/btn:border-blue-600 transition-all">
                      <ArrowRight className="w-4 h-4 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                    </div>
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

        {/* Bento Content Section */}
        {!loading && !selectedCategoryId && !searchQuery && (
          <section className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Tại sao nên dùng AI?</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Lợi ích vượt trội cho cán bộ thời đại mới.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-blue-500/20">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-10">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-3xl font-black mb-4">Tối ưu hóa thời gian</h4>
                  <p className="text-blue-100 text-lg leading-relaxed font-medium">Thay vì mất hàng giờ để soạn thảo văn bản từ đầu, AI giúp bạn có ngay khung nội dung chuẩn xác chỉ trong vài giây. Bạn chỉ cần điều chỉnh chi tiết cho phù hợp.</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-10">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Sáng tạo không giới hạn</h4>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Thiết kế slogan, bài viết tuyên truyền thu hút người dân một cách chuyên nghiệp nhất.</p>
                </div>
              </div>

              <div className="bg-emerald-600 p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-emerald-500/20">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-10">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-black mb-4">Độ chuẩn xác cao</h4>
                  <p className="text-emerald-50 text-lg leading-relaxed font-medium">Các Prompt được chuẩn hóa theo quy chuẩn hành chính nhà nước.</p>
                </div>
              </div>

              <div className="md:col-span-2 bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-10 items-center shadow-sm">
                <div className="flex-1">
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Dễ dàng chia sẻ</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed font-medium">Sao chép nhanh chóng và dán vào ChatGPT, Gemini hoặc các trợ lý AI khác chỉ bằng một lần chạm.</p>
                </div>
                <div className="w-full md:w-48 aspect-square bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                  <Copy className="w-16 h-16 text-blue-600" />
                </div>
              </div>
            </div>
          </section>
        )}
      </>
    )}

      {/* Builder Section */}
      {!loading && activeView === 'builder' && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <section id="huong-dan-chi-tiet" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest mb-8 border border-blue-500/20">
                 <Zap className="w-3 h-3 fill-current" /> Smart Builder Pro
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                Tự tạo <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">Prompt</span> chuyên nghiệp
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto mb-12">
                Kết hợp các thành phần thông minh để AI tạo ra câu lệnh hoàn hảo nhất cho công việc của bạn.
              </p>

              {/* Builder Field Selector */}
              <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                {BUILDER_FIELDS.map(field => (
                  <button
                    key={field.id}
                    onClick={() => setSelectedBuilderField(field.id)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      selectedBuilderField === field.id
                      ? `${field.color} text-white shadow-lg`
                      : 'text-gray-500 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {field.name.toUpperCase()}
                  </button>
                ))}
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />
                
                <button 
                  onClick={handleClearBuilder}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
                  XÓA TẤT CẢ
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] p-8 sm:p-16 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />
              
              <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 relative z-10">
                <div className="space-y-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3" /> THIẾT LẬP CÂU LỆNH
                    </div>
                    <button 
                      onClick={handleClearBuilder}
                      className="text-[10px] font-black text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg"
                    >
                      <X className="w-3 h-3" /> XÓA NỘI DUNG
                    </button>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-500/30">1</div>
                      <label className="block text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest px-1">Vai trò của AI (Role)</label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="VD: Cán bộ Tư pháp, Chuyên gia soạn thảo..."
                      className="w-full bg-blue-50/30 dark:bg-gray-800/50 border border-transparent focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 rounded-2xl p-6 text-sm outline-none transition-all dark:text-white mb-4 shadow-inner font-medium"
                      value={builderRole}
                      onChange={(e) => setBuilderRole(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {SCENARIO_SUGGESTIONS.roles
                        .filter(r => selectedBuilderField === 'all' || r.field === selectedBuilderField)
                        .map(r => (
                          <button 
                            key={r.text} 
                            onClick={() => {
                              setBuilderRole(prev => prev ? prev + '\n' + r.text : r.text);
                              if (selectedBuilderField === 'all') setSelectedBuilderField(r.field);
                            }} 
                            className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all font-bold shadow-sm ${
                              r.field === 'culture' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' :
                              r.field === 'legal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' :
                              r.field === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                              r.field === 'land' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                              'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100'
                            }`}
                          >
                            +{r.text}
                          </button>
                        ))
                      }
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-purple-500/30">2</div>
                      <label className="block text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest px-1">Bối cảnh (Context)</label>
                    </div>
                    <textarea 
                      rows={2}
                      placeholder="VD: Đang chuẩn bị báo cáo quý I, giải quyết khiếu nại dân cư..."
                      className="w-full bg-purple-50/30 dark:bg-gray-800/50 border border-transparent focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 rounded-2xl p-6 text-sm outline-none transition-all dark:text-white resize-none mb-4 shadow-inner font-medium"
                      value={builderContext}
                      onChange={(e) => setBuilderContext(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {SCENARIO_SUGGESTIONS.contexts
                        .filter(c => selectedBuilderField === 'all' || c.field === selectedBuilderField)
                        .map(c => (
                          <button 
                            key={c.text} 
                            onClick={() => {
                              setBuilderContext(prev => prev ? prev + '\n' + c.text : c.text);
                              if (selectedBuilderField === 'all') setSelectedBuilderField(c.field);
                            }} 
                            className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all font-bold shadow-sm ${
                              c.field === 'culture' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' :
                              c.field === 'legal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' :
                              c.field === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                              c.field === 'land' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                              'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100'
                            }`}
                          >
                            +{c.text}
                          </button>
                        ))
                      }
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-orange-500/30">3</div>
                      <label className="block text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest px-1">Yêu cầu (Task)</label>
                    </div>
                    <textarea 
                      rows={3}
                      placeholder="VD: Soạn thảo thư ngỏ, biên soạn bài phát biểu..."
                      className="w-full bg-orange-50/30 dark:bg-gray-800/50 border border-transparent focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/5 rounded-2xl p-6 text-sm outline-none transition-all dark:text-white resize-none mb-4 shadow-inner font-medium"
                      value={builderTask}
                      onChange={(e) => setBuilderTask(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                       {SCENARIO_SUGGESTIONS.tasks
                        .filter(t => selectedBuilderField === 'all' || t.field === selectedBuilderField)
                        .map(t => (
                          <button 
                            key={t.text} 
                            onClick={() => {
                              setBuilderTask(prev => prev ? prev + '\n' + t.text : t.text);
                              if (selectedBuilderField === 'all') setSelectedBuilderField(t.field);
                            }} 
                            className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all font-bold shadow-sm ${
                              t.field === 'culture' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' :
                              t.field === 'legal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' :
                              t.field === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                              t.field === 'land' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                              'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100'
                            }`}
                          >
                            +{t.text}
                          </button>
                        ))
                      }
                    </div>
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-emerald-500/30">4</div>
                      <label className="block text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-1">Đầu ra mong muốn (Output)</label>
                    </div>
                    <input 
                      type="text" 
                      placeholder="VD: Danh sách ý chính, Email trang trọng, Slide..."
                      className="w-full bg-emerald-50/30 dark:bg-gray-800/50 border border-transparent focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 rounded-2xl p-6 text-sm outline-none transition-all dark:text-white mb-4 shadow-inner font-medium"
                      value={builderFormat}
                      onChange={(e) => setBuilderFormat(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                       {SCENARIO_SUGGESTIONS.formats
                        .filter(f => selectedBuilderField === 'all' || f.field === selectedBuilderField)
                        .map(f => (
                          <button 
                            key={f.text} 
                            onClick={() => {
                              setBuilderFormat(prev => prev ? prev + '\n' + f.text : f.text);
                              if (selectedBuilderField === 'all') setSelectedBuilderField(f.field);
                            }} 
                            className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all font-bold shadow-sm ${
                              f.field === 'culture' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' :
                              f.field === 'legal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' :
                              f.field === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                              f.field === 'land' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                              'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100'
                            }`}
                          >
                            +{f.text}
                          </button>
                        ))
                      }
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleGeneratePrompt}
                      disabled={!builderRole || !builderTask}
                      className="flex-[3] py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3 text-lg"
                    >
                      <Zap className="w-6 h-6 fill-white" /> XÁC NHẬN TẠO PROMPT
                    </button>
                    <button 
                      onClick={handleClearBuilder}
                      className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-3xl font-black hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 border border-transparent hover:border-red-200"
                    >
                      XÓA
                    </button>
                  </div>
                </div>

                <div className="flex flex-col h-full min-h-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Kết quả Prompt tối ưu</label>
                    {generatedResult && (
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md animate-pulse">CẤU TRÚC ĐÃ SẴN SÀNG</span>
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-950/80 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] p-8 relative flex flex-col group/result shadow-inner">
                    {generatedResult && (
                      <button 
                        onClick={() => copyToClipboard(generatedResult, 'builder-top')}
                        className="absolute top-6 right-6 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl hover:scale-110 active:scale-95 transition-all z-20 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 group/copy-top"
                        title="Sao chép nhanh"
                      >
                        {copiedId === 'builder-top' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 group-hover/copy-top:scale-110 transition-transform" />}
                      </button>
                    )}
                    {!generatedResult ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 select-none">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                           <Cpu className="w-10 h-10 animate-bounce" />
                        </div>
                        <p className="text-base font-bold text-gray-600 dark:text-gray-400">Đang chờ <span className="text-blue-500">nguyên liệu</span> từ bạn...<br/><span className="text-xs font-medium opacity-60">Nhập thông tin bên trái để bắt đầu</span></p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 font-mono text-sm sm:text-base dark:text-gray-300 leading-relaxed overflow-y-auto whitespace-pre-wrap pr-3 custom-scrollbar scroll-smooth">
                          {generatedResult}
                        </div>
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                           <button 
                            onClick={() => copyToClipboard(generatedResult, 'builder')}
                            className="w-full py-5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-[2rem] font-black hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-blue-500/10 active:scale-95 group/btn"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                              {copiedId === 'builder' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-blue-500" />}
                            </div>
                            <span className="text-lg">{copiedId === 'builder' ? 'ĐÃ SAO CHÉP THÀNH CÔNG' : 'SAO CHÉP ĐỂ SỬ DỤNG'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-32 text-center mb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6">
                Học Viện AI
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                Làm chủ kỹ năng điều khiển AI
              </h2>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
                Sử dụng mô hình <span className="text-blue-600 dark:text-blue-400 font-black">R-T-F</span> để có kết quả tốt nhất.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-20">
              {[
                { 
                  title: 'R - ROLE (Vai trò)', 
                  desc: 'Xác định AI là ai? VD: Bạn là chuyên gia pháp chế UBND có 10 năm kinh nghiệm.',
                  icon: Cpu,
                  color: 'bg-blue-600'
                },
                { 
                  title: 'T - TASK (Nhiệm vụ)', 
                  desc: 'Cần làm gì cụ thể? VD: Soạn thảo thư ngỏ mời tham gia hội nghị Chuyển đổi số.',
                  icon: Sparkles,
                  color: 'bg-indigo-600'
                },
                { 
                  title: 'F - FORMAT (Định dạng)', 
                  desc: 'Trình bày thế nào? VD: Viết dưới dạng Email, bảng biểu, hoặc liệt kê ý chính.',
                  icon: LayoutGrid,
                  color: 'bg-emerald-600'
                }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm hover:shadow-xl transition-all">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-gray-200 dark:shadow-none`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 dark:text-white mb-4 tracking-tight">{step.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}


        {/* AI Ecosystem Section */}
        {!loading && activeView === 'home' && !selectedCategoryId && !searchQuery && (
          <section className="mt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 px-2">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Hệ sinh thái AI phổ biến</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Tận dụng tối đa sức mạnh của các công cụ AI hàng đầu thế giới để kết hợp cùng thư viện Prompt của chúng tôi.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Cập nhật 2026
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {AI_TOOLS.map((tool, idx) => (
                <motion.a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex flex-col h-full relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.color} opacity-5 group-hover:opacity-10 transition-opacity -mr-16 -mt-16 rounded-full`} />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl font-black">{tool.name.charAt(0)}</span>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed flex-1">
                    {tool.desc}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest rounded-lg border border-gray-100 dark:border-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-20 text-center">
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
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border border-transparent dark:border-gray-800"
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
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Câu lệnh mẫu</h4>
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                          <button 
                            onClick={() => setModalFontSize(Math.max(12, modalFontSize - 2))}
                            className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all"
                            title="Giảm cỡ chữ"
                          >
                            A-
                          </button>
                          <div className="w-[1px] h-3 bg-gray-300 dark:bg-gray-600 mx-1" />
                          <button 
                            onClick={() => setModalFontSize(Math.min(32, modalFontSize + 2))}
                            className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all"
                            title="Tăng cỡ chữ"
                          >
                            A+
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedPrompt.prompt, 'modal')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedId === 'modal' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                    <div 
                      className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap transition-all duration-200"
                      style={{ fontSize: `${modalFontSize}px` }}
                    >
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
                      <div 
                        className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap italic opacity-80 transition-all duration-200"
                        style={{ fontSize: `${modalFontSize}px` }}
                      >
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

                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
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

