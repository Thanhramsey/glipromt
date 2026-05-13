import React, { useState, useEffect } from 'react';
import { 
  db, auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, 
  serverTimestamp, handleFirestoreError, OperationType, User, doc,
  browserPopupRedirectResolver
} from '../lib/firebase';
import { Plus, Edit2, Trash2, Save, X, LogIn, LogOut, Database, AlertCircle, Image as ImageIcon, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SEED_CATEGORIES = [
  {
    id: 'soan-thao',
    name: 'Soạn thảo văn bản',
    icon: 'FileText',
    description: 'Hỗ trợ soạn thảo Công văn, Tờ trình, Báo cáo công tác nhanh chóng.'
  },
  {
    id: 'truyen-thong',
    name: 'Truyền thông & Đồ họa',
    icon: 'Image',
    description: 'Tạo ý tưởng Banner, nội dung Infographic và bài đăng mạng xã hội.'
  },
  {
    id: 'bao-cao',
    name: 'Báo cáo & Thuyết trình',
    icon: 'Presentation',
    description: 'Xây dựng cấu trúc bài thuyết trình, tóm tắt kết luận hội nghị.'
  },
  {
    id: 'huong-dan',
    name: 'Kỹ năng Prompting',
    icon: 'BookOpen',
    description: 'Các nguyên tắc viết câu lệnh hiệu quả dành cho cán bộ.'
  }
];

const SEED_PROMPTS = [
  {
    category: 'soan-thao',
    title: 'Soạn thảo Công văn mời họp',
    description: 'Tự động tạo dự thảo công văn mời các phòng ban tham dự cuộc họp triển khai công tác.',
    prompt: `Bạn là một cán bộ văn phòng UBND xã. Hãy soạn thảo một Công văn mời các trưởng thôn và các tổ chức đoàn thể dự họp về "Triển khai chiến dịch chuyển đổi số cộng đồng năm 2024". 
Thông tin cần có: 
- Thời gian: 8h00 ngày 20/05/2024. 
- Địa điểm: Hội trường tầng 2 UBND xã. 
- Mục đích: Thống nhất phương án hướng dẫn người dân cài đặt ứng dụng Dịch vụ công.
- Yêu cầu: Văn phong trang trọng, đúng chuẩn hành chính Nhà nước Việt Nam.`,
    howToUse: 'Dán đoạn này vào ChatGPT hoặc Gemini, thay đổi mục đích họp và thời gian theo thực tế.',
    resultSample: 'DỰ THẢO CÔNG VĂN MỜI HỌP\n\nKính gửi: Các trưởng thôn, các tổ chức đoàn thể xã...\n\nThực hiện kế hoạch số... về việc..., UBND xã tổ chức cuộc họp... Nội dung chi tiết bao gồm: 1... 2... Rất mong sự có mặt đầy đủ của các đồng chí.\n\nChủ tịch UBND Xã (Đã ký)'
  },
  {
    category: 'soan-thao',
    title: 'Dự thảo Diễn văn khai mạc',
    description: 'Soạn bài phát biểu cho lãnh đạo tại các buổi lễ tại địa phương.',
    prompt: `Hãy viết một bài phát biểu khai mạc ngắn gọn (khoảng 500 chữ) cho Chủ tịch UBND xã tại "Lễ ra quân Ngày Chủ nhật xanh". 
Người nghe là người dân trong xã và đoàn viên thanh niên. 
Văn phong: Gần gũi, truyền cảm hứng, nêu bật được tầm quan trọng của việc bảo vệ môi trường và trách nhiệm của mỗi cá nhân.`,
    howToUse: 'Cung cấp tên sự kiện và mục tiêu bài phát biểu.',
    resultSample: '"Kính thưa bà con nhân dân, các bạn đoàn viên thanh niên thân mến! \nHôm nay, trong không khí rộn ràng của những ngày tháng 5, chúng ta cùng nhau tụ hội tại đây để bắt đầu một hành trình mới cho màu xanh của quê hương... Mỗi túi rác chúng ta thu gom, mỗi cây xanh chúng ta trồng chính là món quà cho con cháu mai sau..."'
  },
  {
    category: 'truyen-thong',
    title: 'Ý tưởng Banner tuyên truyền',
    description: 'Tạo mô tả hình ảnh cho các banner treo tại trụ sở hoặc ngoài đường.',
    prompt: `Hãy thiết kế nội dung và ý tưởng hình ảnh cho một Banner tuyên truyền về "Phòng chống lừa đảo trên không gian mạng". 
Yêu cầu: 
1. Khẩu hiệu (Slogan) ngắn gọn, vần điệu. 
2. Mô tả bố cục hình ảnh: Sử dụng màu sắc cảnh báo, hình ảnh minh họa cho người dân dễ hiểu. 
3. Các lưu ý chính cần in trên banner.`,
    howToUse: 'Sử dụng prompt này để lấy ý tưởng trước khi gửi cho bên in ấn hoặc thiết kế.',
    resultSample: '- Khẩu hiệu: "Cảnh giác cao độ - Không sập bẫy lừa - Tiền trong túi mình - Giữ gìn cho chắc".\n- Hình ảnh: Một chiếc khiên bảo vệ quanh chiếc điện thoại, nền đỏ vàng nổi bật.\n- Nội dung: Không click link lạ, không chuyển tiền cho người lạ qua mạng.'
  },
  {
    category: 'truyen-thong',
    title: 'Nội dung Infographic chính sách mới',
    description: 'Tóm tắt các văn bản pháp luật khó hiểu thành các bước đơn giản.',
    prompt: `Tôi có một văn bản về "Quy trình đăng ký khai sinh trực tuyến". Hãy tóm tắt văn bản này thành 5 bước ngắn gọn nhất để làm nội dung cho một Infographic. Mỗi bước không quá 20 chữ. Ngôn ngữ bình dân, dễ hiểu cho người cao tuổi cũng có thể nắm bắt.`,
    howToUse: 'Copy nội dung thông báo/văn bản kèm theo prompt này.',
    resultSample: 'Bước 1: Truy cập Cổng dịch vụ công.\nBước 2: Đăng nhập tài khoản cá nhân.\nBước 3: Chọn mục Đăng ký khai sinh.\nBước 4: Tải ảnh hồ sơ lên hệ thống.\nBước 5: Nhận kết quả tại nhà hoặc UBND.'
  },
  {
    category: 'bao-cao',
    title: 'Cấu trúc Slide báo cáo quý',
    description: 'Xây dựng khung nội dung cho bài thuyết trình báo cáo tình hình kinh tế - xã hội.',
    prompt: `Hãy xây dựng đề cương chi tiết cho 10 slide thuyết trình báo cáo "Kết quả công tác tháng 4 và phương hướng tháng 5 của UBND xã". 
Cần tập trung vào: Sản xuất nông nghiệp, Thu ngân sách và An ninh trật tự. 
Đề xuất các loại biểu đồ nên dùng cho mỗi slide để minh họa trực quan.`,
    howToUse: 'Nhập số liệu sơ bộ để AI bổ sung các nhận xét sắc bén hơn.',
    resultSample: 'Slide 1: Tiêu đề.\nSlide 2: Tổng quan kinh tế (Biểu đồ cột).\nSlide 3: Chi tiết Nông nghiệp.\n... Slide 10: Lời kết.'
  },
  {
    category: 'huong-dan',
    title: 'Công thức Prompt 3C',
    description: 'Bí kíp để AI hiểu ý bạn ngay lần đầu tiên.',
    prompt: 'Bối cảnh (Context) + Nội dung (Content) + Ràng buộc (Constraint)',
    howToUse: 'Áp dụng công thức 3C cho mọi câu lệnh.',
    resultSample: 'Ví dụ: "Tôi là cán bộ tư pháp (Bối cảnh), hãy soạn thông báo nhắc người dân làm CCCD (Nội dung), văn phong ngắn gọn dưới 100 chữ (Ràng buộc)."'
  }
];

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAdmin(!!u); 
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qCats = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const qPrompts = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'));
    const unsubPrompts = onSnapshot(qPrompts, (snapshot) => {
      setPrompts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'prompts'));

    return () => { unsubCats(); unsubPrompts(); };
  }, [user]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      // Explicitly pass resolver if standard one is failing in this environment
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('Vui lòng cho phép hiện cửa sổ con (popup) trên trình duyệt để đăng nhập.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError('Thao tác đăng nhập đã bị hủy. Vui lòng thử lại.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.');
      } else {
        setLoginError('Có lỗi xảy ra khi đăng nhập. Hãy tải lại trang và thử lại.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const performSeed = async () => {
    try {
      const catMap: Record<string, string> = {};
      for (const cat of SEED_CATEGORIES) {
        const docRef = await addDoc(collection(db, 'categories'), {
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          order: SEED_CATEGORIES.indexOf(cat)
        });
        catMap[cat.id] = docRef.id;
      }

      for (const p of SEED_PROMPTS) {
        await addDoc(collection(db, 'prompts'), {
          categoryId: catMap[p.category] || p.category,
          title: p.title,
          description: p.description,
          prompt: p.prompt,
          howToUse: p.howToUse,
          resultSample: p.resultSample,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
      alert('Đã nạp dữ liệu thành công!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seeding');
    }
  };

  const seedData = () => {
    setConfirmState({
      show: true,
      title: 'Nạp dữ liệu mẫu',
      message: 'Bạn có chắc chắn muốn nạp lại toàn bộ dữ liệu mẫu vào cơ sở dữ liệu? Việc này có thể tạo ra các bản ghi trùng lặp nếu đã nạp trước đó.',
      onConfirm: performSeed
    });
  };

  const savePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingPrompt,
      updatedAt: serverTimestamp(),
      createdAt: editingPrompt.id ? editingPrompt.createdAt : serverTimestamp()
    };
    
    try {
      if (editingPrompt.id) {
        const { id, ...saveData } = data;
        await updateDoc(doc(db, 'prompts', id), saveData);
      } else {
        await addDoc(collection(db, 'prompts'), data);
      }
      setEditingPrompt(null);
      setIsAddingPrompt(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'prompts');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert('Kích thước ảnh quá lớn (vui lòng chọn ảnh < 800KB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingPrompt({ ...editingPrompt, resultImageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const performDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'prompts', id));
      setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'prompts');
    }
  };

  const deletePrompt = (id: string) => {
    setConfirmState({
      show: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa mẫu prompt này? Thao tác này không thể hoàn tác.',
      onConfirm: () => performDelete(id)
    });
  };

  if (loading) return <div className="p-20 text-center dark:text-gray-400">Đang kiểm tra quyền...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-transparent dark:border-gray-800">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Trang Quản Trị</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Vui lòng đăng nhập bằng tài khoản Google để quản lý nội dung.</p>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{loginError}</p>
            </div>
          )}

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              isLoggingIn 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.hash = ''} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Về trang chủ">
               <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <h1 className="font-bold text-gray-900 dark:text-white cursor-pointer" onClick={() => window.location.hash = ''}>Quản trị nội dung</h1>
            <span className="mx-2 text-gray-300 dark:text-gray-700">|</span>
            <button 
              onClick={() => window.location.hash = ''}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Về trang chủ
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">{user.email}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold hover:underline">
              <LogOut className="w-4 h-4" /> Thoát
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {categories.length === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-8 rounded-3xl text-center mb-10">
            <h3 className="text-blue-900 dark:text-blue-100 font-bold mb-2">Chưa có dữ liệu trong Database</h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm mb-6">Bạn có thể nạp nhanh dữ liệu mẫu ban đầu để bắt đầu quản lý.</p>
            <button 
              onClick={seedData}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
            >
              <Database className="w-4 h-4" /> Nạp dữ liệu mẫu
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Danh sách Prompt</h2>
          <button 
            onClick={() => {
              setIsAddingPrompt(true);
              setEditingPrompt({ title: '', description: '', prompt: '', howToUse: '', resultSample: '', categoryId: categories[0]?.id || '' });
            }}
            className="bg-gray-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" /> Thêm mới
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tiêu đề</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden md:table-cell">Danh mục</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {prompts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 dark:text-white">{p.title}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                    {categories.find(c => c.id === p.categoryId)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-gray-400 font-bold">
                      <button 
                        onClick={() => setEditingPrompt(p)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deletePrompt(p.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Modal */}
      {(editingPrompt || isAddingPrompt) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setEditingPrompt(null); setIsAddingPrompt(false); }} />
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl p-8 border border-transparent dark:border-gray-800">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8">
              {editingPrompt?.id ? 'Chỉnh sửa Prompt' : 'Thêm Prompt mới'}
            </h3>
            
            <form onSubmit={savePrompt} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Tiêu đề</label>
                  <input 
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                    value={editingPrompt.title}
                    onChange={e => setEditingPrompt({...editingPrompt, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Danh mục</label>
                  <select 
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                    value={editingPrompt.categoryId}
                    onChange={e => setEditingPrompt({...editingPrompt, categoryId: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Mô tả ngắn</label>
                <input 
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                  value={editingPrompt.description}
                  onChange={e => setEditingPrompt({...editingPrompt, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Câu lệnh (Prompt)</label>
                <textarea 
                  required
                  rows={6}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                  value={editingPrompt.prompt}
                  onChange={e => setEditingPrompt({...editingPrompt, prompt: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Hướng dẫn sử dụng</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                    value={editingPrompt.howToUse}
                    onChange={e => setEditingPrompt({...editingPrompt, howToUse: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Kết quả mẫu</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                    value={editingPrompt.resultSample}
                    onChange={e => setEditingPrompt({...editingPrompt, resultSample: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Ảnh đầu ra mẫu (Minh họa)</label>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="relative group cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 transition-all">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-all">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Tải ảnh lên</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG (Tối đa 800KB)</p>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  
                  {editingPrompt.resultImageUrl && (
                    <div className="flex-1">
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-[164px]">
                        <img 
                          src={editingPrompt.resultImageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          type="button"
                          onClick={() => setEditingPrompt({...editingPrompt, resultImageUrl: ''})}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-5 h-5" /> Lưu lại
                </button>
                <button 
                  type="button"
                  onClick={() => { setEditingPrompt(null); setIsAddingPrompt(false); }}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmState.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmState({ ...confirmState, show: false })}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-8 text-center border border-transparent dark:border-gray-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{confirmState.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                {confirmState.message}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={confirmState.onConfirm}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  Xác nhận
                </button>
                <button 
                  onClick={() => setConfirmState({ ...confirmState, show: false })}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
