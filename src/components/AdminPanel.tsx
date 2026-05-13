import React, { useState, useEffect } from 'react';
import { 
  db, auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, 
  serverTimestamp, handleFirestoreError, OperationType, User, doc,
  browserPopupRedirectResolver, writeBatch
} from '../lib/firebase';
import { Plus, Edit2, Trash2, Save, X, LogIn, LogOut, Database, AlertCircle, Image as ImageIcon, Upload, Sun, Moon, FileSpreadsheet, FolderTree, ChevronRight, Download, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

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

export default function AdminPanel({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState<'prompts' | 'categories'>('prompts');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
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
      // Check if user is truly admin based on email in firestore rules
      const adminEmail = "thanhwilshere96@gmail.com";
      setIsAdmin(u?.email === adminEmail); 
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
      console.log('Bắt đầu đăng nhập...');
      // Explicitly pass resolver if standard one is failing in this environment
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      console.log('Đăng nhập thành công');
    } catch (error: any) {
      console.error('Lỗi đăng nhập chi tiết:', error);
      const errorCode = error.code || 'unknown';
      const errorMessage = error.message || '';
      
      if (errorCode === 'auth/popup-blocked') {
        setLoginError('Vui lòng cho phép hiện cửa sổ con (popup) trên trình duyệt để đăng nhập.');
      } else if (errorCode === 'auth/cancelled-popup-request') {
        setLoginError('Thao tác đăng nhập đã bị hủy. Vui lòng thử lại.');
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setLoginError('Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        setLoginError(`Tên miền này chưa được cấp phép trong Firebase Console. (Lỗi: ${errorCode})`);
      } else {
        setLoginError(`Lỗi đăng nhập (${errorCode}): ${errorMessage || 'Hãy tải lại trang và thử lại.'}`);
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

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory.id) {
        const { id, ...saveData } = editingCategory;
        await updateDoc(doc(db, 'categories', id), saveData);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...editingCategory,
          order: categories.length
        });
      }
      setEditingCategory(null);
      setIsAddingCategory(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    }
  };

  const deleteCategory = (id: string) => {
    const hasPrompts = prompts.some(p => p.categoryId === id);
    if (hasPrompts) {
      alert('Không thể xóa danh mục này vì vẫn còn các prompt thuộc về nó. Hãy xóa hoặc chuyển các prompt đó trước.');
      return;
    }

    setConfirmState({
      show: true,
      title: 'Xác nhận xóa danh mục',
      message: 'Bạn có chắc chắn muốn xóa danh mục này? Thao tác này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'categories', id));
          setConfirmState({ ...confirmState, show: false });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'categories');
        }
      }
    });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('File Excel trống hoặc không đúng định dạng.');
          return;
        }

        setConfirmState({
          show: true,
          title: 'Xác nhận Import',
          message: `Tìm thấy ${data.length} mẫu prompt trong file. Bạn có chắc chắn muốn nạp toàn bộ vào cơ sở dữ liệu không?`,
          onConfirm: async () => {
            let count = 0;
            for (const row of data as any[]) {
              // Map columns (adjust if needed)
              const mappedPrompt = {
                title: row['Tiêu đề'] || row['title'] || 'Không có tiêu đề',
                description: row['Mô tả'] || row['description'] || '',
                prompt: row['Câu lệnh'] || row['prompt'] || '',
                howToUse: row['Hướng dẫn'] || row['howToUse'] || '',
                resultSample: row['Kết quả mẫu'] || row['resultSample'] || '',
                categoryId: categories.find(c => c.name === (row['Danh mục'] || row['category']))?.id || categories[0]?.id || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              if (mappedPrompt.prompt) {
                await addDoc(collection(db, 'prompts'), mappedPrompt);
                count++;
              }
            }
            alert(`Nạp thành công ${count} mẫu prompt!`);
            setConfirmState({ ...confirmState, show: false });
          }
        });
      } catch (error) {
        console.error('Lỗi khi đọc file Excel:', error);
        alert('Có lỗi xảy ra khi xử lý file Excel.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
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

  const downloadSampleExcel = () => {
    const data = [
      {
        'Tiêu đề': 'Ví dụ: Viết báo cáo tuần',
        'Mô tả': 'Hỗ trợ viết báo cáo công việc hàng tuần',
        'Câu lệnh': 'Hãy viết báo cáo tuần dựa trên các thông tin sau: [Thông tin công việc]',
        'Hướng dẫn': 'Bấm vào sao chép, dán vào ChatGPT và cung cấp nội dung công việc.',
        'Kết quả mẫu': '[Mẫu báo cáo hoàn thiện]',
        'Danh mục': categories[0]?.name || 'Hành chính'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Prompts");
    XLSX.writeFile(wb, "mau_import_prompt.xlsx");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 500 * 1024; // 500KB
        let quality = 0.8;
        
        // If file is very large, reduce dimensions first to avoid huge memory usage
        if (file.size > MAX_SIZE) {
          const scale = Math.sqrt(MAX_SIZE / file.size) * 1.5; // Heuristic scale
          if (scale < 1) {
            width *= scale;
            height *= scale;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Binary search or iterative reduction for precision if still over limit
        while (base64.length * 0.75 > MAX_SIZE && quality > 0.1) {
          quality -= 0.15;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        setEditingPrompt({ ...editingPrompt, resultImageUrl: base64 });
      };
      img.src = event.target?.result as string;
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

  const toggleSelectAll = () => {
    if (selectedPromptIds.length === prompts.length) {
      setSelectedPromptIds([]);
    } else {
      setSelectedPromptIds(prompts.map(p => p.id));
    }
  };

  const toggleSelectPrompt = (id: string) => {
    setSelectedPromptIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelectedPrompts = () => {
    setConfirmState({
      show: true,
      title: 'Xác nhận xóa hàng loạt',
      message: `Bạn có chắc chắn muốn xóa ${selectedPromptIds.length} mục đã chọn? Thao tác này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          selectedPromptIds.forEach(id => {
            batch.delete(doc(db, 'prompts', id));
          });
          await batch.commit();
          setSelectedPromptIds([]);
          setConfirmState({ ...confirmState, show: false });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'prompts_bulk');
        }
      }
    });
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map(c => c.id));
    }
  };

  const toggleSelectCategory = (id: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteSelectedCategories = () => {
    setConfirmState({
      show: true,
      title: 'Xác nhận xóa hàng loạt danh mục',
      message: `Bạn có chắc chắn muốn xóa ${selectedCategoryIds.length} danh mục đã chọn? Các prompts thuộc danh mục này sẽ không bị xóa nhưng sẽ mất danh mục.`,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          selectedCategoryIds.forEach(id => {
            batch.delete(doc(db, 'categories', id));
          });
          await batch.commit();
          setSelectedCategoryIds([]);
          setConfirmState({ ...confirmState, show: false });
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'categories_bulk');
        }
      }
    });
  };

  if (loading) return <div className="p-20 text-center dark:text-gray-400">Đang kiểm tra quyền...</div>;

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-transparent dark:border-gray-800">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Từ chối truy cập</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            Tài khoản <span className="font-bold text-gray-900 dark:text-white">{user.email}</span> không có quyền quản trị. 
            Vui lòng đăng nhập bằng đúng tài khoản Admin.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-900 dark:bg-gray-800 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg"
          >
            Đăng xuất và thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 relative">
        <div className="absolute top-8 right-8">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 shadow-sm"
            title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
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
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400"
              title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <button 
              onClick={() => setActiveTab('prompts')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'prompts' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Database className="w-4 h-4" /> Prompts
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'categories' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <FolderTree className="w-4 h-4" /> Danh mục
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'prompts' && (
              <>
                <button 
                  onClick={downloadSampleExcel}
                  className="flex-1 md:flex-none border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all bg-white dark:bg-gray-900"
                >
                  <Download className="w-5 h-5" /> Tải mẫu
                </button>
                <label className="flex-1 md:flex-none">
                  <div className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-500/20">
                    <FileSpreadsheet className="w-5 h-5" /> Import Excel
                  </div>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    onChange={handleImportExcel}
                  />
                </label>
                <button 
                  onClick={() => {
                    setIsAddingPrompt(true);
                    setEditingPrompt({ title: '', description: '', prompt: '', howToUse: '', resultSample: '', categoryId: categories[0]?.id || '' });
                  }}
                  className="flex-1 md:flex-none bg-gray-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-blue-700 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Thêm mới
                </button>
              </>
            )}
            {activeTab === 'categories' && (
              <button 
                onClick={() => {
                  setIsAddingCategory(true);
                  setEditingCategory({ name: '', icon: 'Box', description: '' });
                }}
                className="w-full md:w-auto bg-gray-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-blue-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" /> Thêm danh mục
              </button>
            )}
          </div>
        </div>

        {activeTab === 'prompts' ? (
          <div className="space-y-4">
            <AnimatePresence>
              {selectedPromptIds.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-500/20"
                >
                  <div className="flex items-center gap-4 px-2">
                    <span className="font-black text-sm">ĐÃ CHỌN {selectedPromptIds.length} MỤC</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedPromptIds([])}
                      className="px-4 py-2 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                    >
                      Hủy chọn
                    </button>
                    <button 
                      onClick={deleteSelectedPrompts}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa các mục này
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="pl-6 pr-2 py-4 w-12">
                    <button 
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {selectedPromptIds.length === prompts.length && prompts.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tiêu đề</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden md:table-cell">Danh mục</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {prompts.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${selectedPromptIds.includes(p.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                    <td className="pl-6 pr-2 py-4">
                      <button 
                        onClick={() => toggleSelectPrompt(p.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {selectedPromptIds.includes(p.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
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
      </div>
      ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {selectedCategoryIds.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-500/20"
                >
                  <div className="flex items-center gap-4 px-2">
                    <span className="font-black text-sm text-white">ĐÃ CHỌN {selectedCategoryIds.length} DANH MỤC</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedCategoryIds([])}
                      className="px-4 py-2 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                    >
                      Hủy chọn
                    </button>
                    <button 
                      onClick={deleteSelectedCategories}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa danh mục
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="pl-6 pr-2 py-4 w-12">
                      <button 
                        onClick={toggleSelectAllCategories}
                        className="text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {selectedCategoryIds.length === categories.length && categories.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tên Danh Mục</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden md:table-cell">Mô tả</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {categories.map((cat) => (
                    <tr key={cat.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${selectedCategoryIds.includes(cat.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                      <td className="pl-6 pr-2 py-4">
                        <button 
                          onClick={() => toggleSelectCategory(cat.id)}
                          className="text-gray-400 hover:text-blue-600 transition-colors flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {selectedCategoryIds.includes(cat.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">{cat.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                      {cat.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-gray-400 font-bold">
                        <button 
                          onClick={() => setEditingCategory(cat)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteCategory(cat.id)}
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
        </div>
        )}
      </main>

      {/* Category Edit Modal */}
      {(editingCategory || isAddingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setEditingCategory(null); setIsAddingCategory(false); }} />
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl p-8 border border-transparent dark:border-gray-800">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8">
              {editingCategory?.id ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
            </h3>
            
            <form onSubmit={saveCategory} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Tên danh mục</label>
                <input 
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Icon (Lucide name)</label>
                <input 
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                  value={editingCategory.icon}
                  onChange={e => setEditingCategory({...editingCategory, icon: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Mô tả</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-gray-100"
                  value={editingCategory.description}
                  onChange={e => setEditingCategory({...editingCategory, description: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-5 h-5" /> Lưu danh mục
                </button>
                <button 
                  type="button"
                  onClick={() => { setEditingCategory(null); setIsAddingCategory(false); }}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
