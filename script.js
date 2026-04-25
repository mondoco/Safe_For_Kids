document.addEventListener('DOMContentLoaded', function() {
    // عند الضغط على أيقونة البحث
const searchIcon = document.getElementById('searchIcon');
const searchPage = document.getElementById('searchPage'); // تأكد من الـ ID

if (searchIcon) {
    searchIcon.onclick = function() {
        if (searchPage) {
            searchPage.classList.toggle('active');
            
            if (searchPage.classList.contains('active')) {
                // إيقاف الفيديو مؤقتاً
                const iframe = document.getElementById('main-iframe');
                if (iframe && iframe.src.includes("autoplay=1")) {
                    iframe.src = iframe.src.replace("autoplay=1", "autoplay=0");
                }

                // التركيز على حقل البحث
                const searchInput = document.getElementById('searchInputFull');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 300);
                }
            }
        }
    };
}

document.getElementById('searchInputFull').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results-container');

    console.log("جاري البحث عن:", query); // للتأكد أن الدالة تعمل
    console.log("عدد الفيديوهات المتاحة للبحث:", allVideos.length); // للتأكد أن المصفوفة ليست فارغة

    if (!resultsContainer) {
        console.error("لم يتم العثور على حاوية النتائج!");
        return;
    }

    // الفلترة
    const filtered = allVideos.filter(video => {
        const title = video.title || ""; // حماية في حال كان العنوان غير موجود
        return title.toLowerCase().includes(query);
    });

    console.log("عدد النتائج المطابقة:", filtered.length);

    // مسح الحاوية
    resultsContainer.innerHTML = '';

    if (filtered.length === 0 && query !== "") {
        resultsContainer.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد نتائج مطابقة</p>';
    }

    filtered.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.display = 'block'; // للتأكد أنها ليست مخفية بالـ CSS
        card.onclick = () => {   
            searchPage.classList.remove('active');
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.querySelector(`[data-tab="home"]`).classList.add('active');
            document.querySelector('.nav-item.s').classList.remove('active');
            document.querySelector('.nav-item.y').classList.remove('active');
            document.querySelector('.nav-item.c').classList.remove('active');

            document.querySelector('.nav-item.h').classList.add('active');
            playVideo(video.id, video.title, false);
        };
        card.innerHTML = `
            <img src="${video.thumb}" style="width:100%; border-radius:8px;">
            <div class="info" style="padding:10px;">
                <div class="title" style="color:white;">${video.title}</div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
});
    

  // Back button
  document.getElementById('backBtn').addEventListener('click', function() {
    searchPage.classList.remove('active');
  });

  // Categories chips
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      chips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      console.log('فئة مختارة:', this.textContent);
    });
  });

  // Bottom nav tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Map nav indices: 0=home, 1=shorts, 3=subs, 4=you (skip create=2)
  const tabMap = ['home', 'shorts', 'subscriptions', 'you'];
  
  const navTabs = document.querySelectorAll('.bottom-nav .nav-item:not(.nav-create)');
  navTabs.forEach((item, index) => {
    item.addEventListener('click', function() {
        document.getElementById('player-shorts-section').style.display = 'none';
        const shortsIframe = document.getElementById('shorts-iframe');
        if (shortsIframe) shortsIframe.src = "";

        document.getElementById('player-section').style.display = 'none';
        const iframe = document.getElementById('main-iframe');
        if (iframe) iframe.src = "";

        navItems.forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        if (index >= 1){
            document.querySelector('.categories').style.display = 'none';
        }else{
            document.querySelector('.categories').style.display = 'flex';
        }
        if (index === 1) {
            renderShortsTab();}

        if (index === 0) {
            renderList(allVideos);
        }
        if (index === 2) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const tabNames = ['home', 'shorts', 'subscriptions', 'you'];
        document.querySelector(`[data-tab="${tabNames[index]}"]`).classList.add('active');
    });
  });

  // Create button alert
  document.querySelector('.nav-create').addEventListener('click', function() {
    alert('إنشاء فيديو جديد 🚀');
  });

  // Close search on escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      searchPage.classList.remove('active');
    }
  });
});


// دالة الفلترة
function filterVideos(category, element) {
    // 1. تحديث شكل الأزرار (إزالة active من الجميع وإضافتها للمضغطوط عليه)
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');

    // 2. منطق الفلترة
    if (category === 'all') {
        renderList(allVideos); // عرض كل شيء
    } else {
        const filtered = allVideos.filter(video => video.category === category);
        renderList(filtered);
    }

    // 3. إخفاء المشغل إذا كان مفتوحاً (اختياري، ليعود للرئيسية عند تغيير القسم)
    document.getElementById('player-section').style.display = 'none';
    const iframe = document.getElementById('main-iframe');
    if (iframe) iframe.src = "";
}


let allVideos = [];
let channelsData = {}; // سنخزن فيها صور القنوات

// دالة لخلط المصفوفة (يمكن استخدامها لاحقاً إذا أردت عرض الفيديوهات بشكل عشوائي)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // توليد رقم عشوائي بين 0 و i
        const j = Math.floor(Math.random() * (i + 1));
        // تبديل العناصر
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function loadData() {
    // جلب الملفين معاً
    const [vRes, cRes] = await Promise.all([
        fetch('./videos.json'),
        fetch('./channels.json')
    ]);
    allVideos = await vRes.json();
    channelsData = await cRes.json();
    

    if (!vRes.ok) {
            throw new Error("فشل في الوصول لملف videos.json: " + vRes.status);
        }
    
    renderList(allVideos);
    renderChannels(); // عرض القنوات في تبويب الاشتراكات// عرض الفيديوهات القصيرة في تبويب الشورتس
}
// تشغيل الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadData);

function renderList(videos, id = null) {
    shuffleArray(videos); // خلط الفيديوهات لعرضها بشكل عشوائي
    if (id) {
        // Remove the currently playing video from the list to avoid showing it in suggestions
        videos = videos.filter(v => v.id !== id);
    }

    const container = document.getElementById('video-list-container');
    container.innerHTML = '';
    document.getElementById('shorts-container').innerHTML = '';
    videos.forEach(video => {
        // التاكد من ان الفيديو اكبر من 3 دقائق
        if (isShortVideo(video.duration, 180)) return;

        const channelThumb = channelsData[video.channelId] || 'default-avatar.png';
        
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => playVideo(video.id, video.title);
        
        card.innerHTML = `
            <div class="thumbnail-container" style="position: relative;">
                <img src="${video.thumb}" style="width:100%; border-radius: 8px;">
                <span class="duration" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 2px 5px; border-radius: 4px; font-size: 12px;">
                    ${video.duration}
                </span>
            </div>
            <div class="video-info-row" style="display: flex; padding: 12px; gap: 12px;">
                <img src="${channelThumb}" style="width: 36px; height: 36px; border-radius: 50%;">
                <div class="text-info">
                    <div class="title" style="color: white; font-size: 14px; font-weight: bold;">${video.title}</div>
                    <div class="meta" style="color: #aaa; font-size: 12px; margin-top: 4px;">
                        ${video.channel} • ${video.category}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}


let currentPlayingVideo = null;
// 3. دالة تشغيل الفيديو
function playVideo(id, title, isShort = false) {
    currentPlayingVideo = allVideos.find(v => v.id === id);
    updatePlayerInfo(currentPlayingVideo);
    if (!isShort) {
        const playerSection = document.getElementById('player-section');
        const iframe = document.getElementById('main-iframe');
        const titleElement = document.getElementById('video-title');
        const nnc = document.getElementById('nnc');
        //فتح القناة عند الضغط علي اسمها او الصورة
        document.getElementById('player-channel-img').onclick = () => openChannelPage(currentPlayingVideo.channelId);
        document.getElementById('player-channel-name').onclick = () => openChannelPage(currentPlayingVideo.channelId);


        // إظهار القسم وتحديث البيانات
        playerSection.style.display = 'block';
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        titleElement.innerText = title;
        nnc.style.display = 'none';


        // إعادة بناء القائمة بالأسفل (لتكون كاقتراحات)
        renderList(allVideos.slice(0, 50),id);

        // الصعود للأعلى لرؤية الفيديو
        window.scrollTo({ top: 0, behavior: 'smooth' });}

    if (isShort) {
        const playerSection = document.getElementById('player-shorts-section');
        const iframe = document.getElementById('shorts-iframe');
        const titleElement = document.getElementById('short-title');
        const nnc = document.getElementById('nnc');


        // إظهار القسم وتحديث البيانات
        playerSection.style.display = 'block';
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        titleElement.innerText = title;
        nnc.style.display = 'none';


        // إعادة بناء القائمة بالأسفل (لتكون كاقتراحات)
        renderShortsTab(allVideos.slice(0, 50),id);

        // الصعود للأعلى لرؤية الفيديو
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


}
// دالة مساعدة لتحديث معلومات القناة تحت المشغل
function updatePlayerInfo(video) {
    const channelImg = document.getElementById('player-channel-img');
    const channelName = document.getElementById('player-channel-name');
    
    if (channelImg) channelImg.src = channelsData[video.channelId] || '';
    if (channelName) channelName.innerText = video.channel;

}// دالة فلترة الاقتراحات (التي ستستدعيها الأزرار الجديدة)
function filterSuggestions(type,id) {
    // تحديث شكل الأزرار (Chips)
    document.querySelectorAll('.s-chip').forEach(btn => btn.classList.remove('active'));
    // إضافة active للزر المختار (يتم تمريره من الـ HTML)
    if (type === 'all') {
        document.querySelector('.s-chip:nth-child(1)').classList.add('active');
    } else if (type === 'same-channel') {
        document.querySelector('.s-chip:nth-child(2)').classList.add('active');
    } else if (type === 'same-category') {
        document.querySelector('.s-chip:nth-child(3)').classList.add('active');
    }
    
    let filtered = [];
    if (type === 'all') {
        filtered = [...allVideos];
        shuffleArray(filtered);
    } else if (type === 'same-channel') {
        filtered = allVideos.filter(v => v.channelId === currentPlayingVideo.channelId);
    } else if (type === 'same-category') {
        filtered = allVideos.filter(v => v.category === currentPlayingVideo.category);
        shuffleArray(filtered);
    }

    // إزالة الفيديو الحالي من الاقتراحات

    
    renderList(filtered.slice(0, 50),id);
}

// 1. دالة فتح صفحة القناة
function openChannelPage(channelId) {
    const channelPage = document.getElementById('channel-page');
    const channelThumb = channelsData[channelId];
    
    // جلب اسم القناة من أول فيديو متاح لها
    const channelName = allVideos.find(v => v.channelId === channelId).channel;

    // تحديث بيانات الهيدر
    document.getElementById('page-channel-img').src = channelThumb;
    document.getElementById('page-channel-name').innerText = channelName;

    // فلترة وعرض فيديوهات هذه القناة فقط
    const filteredVideos = allVideos.filter(v => v.channelId === channelId);
    renderChannelVideos(filteredVideos);

    // إظهار صفحة القناة وإخفاء باقي التبويبات
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));
    document.querySelector(`[data-tab="channel-page"]`).classList.add('active');

    // إخفاء الـ Bottom Nav ليعطي إحساساً بأنها صفحة كاملة (اختياري)
    document.querySelector('.bottom-nav').style.display = 'none';
    document.querySelector('.categories').style.display = 'none';

    
    window.scrollTo(0, 0);
}

// 2. دالة بناء الفيديوهات داخل صفحة القناة
function renderChannelVideos(videos) {
    const container = document.getElementById('channel-videos-container');
    container.innerHTML = ''; // تفريغ القائمة

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => {
            playVideo(video.id, video.title);
            // عند تشغيل فيديو، قد نفضل البقاء في نفس الصفحة أو العودة للرئيسية
                const tabPanes = document.querySelectorAll('.tab-pane');
                tabPanes.forEach(pane => pane.classList.remove('active'));
                document.querySelector(`[data-tab="home"]`).classList.add('active');
                document.querySelector('.bottom-nav').style.display = 'block';
        };
        card.innerHTML = `
            <div class="thumbnail-container" style="position: relative;">
                <img src="${video.thumb}" style="width: 100%;">
                <span class="duration" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 2px 5px; border-radius: 4px; font-size: 11px;">${video.duration}</span>
            </div>
            <div style="padding: 12px; color: white;">
                <div style="font-size: 14px; font-weight: bold;">${video.title}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. دالة الخروج من صفحة القناة
function closeChannelPage() {
    document.querySelector('.bottom-nav').style.display = 'flex';
    // document.querySelector('.categories').style.display = 'flex';
    // العودة لتبويب الاشتراكات (أو الرئيسية حسب رغبتك)
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));
    document.querySelector(`[data-tab="home"]`).classList.add('active');
    document.getElementById('.nav-item.h').classList.add('active');
    document.getElementById('.nav-item.s').classList.remove('active');
    document.getElementById('.nav-item.y').classList.remove('active');
    document.getElementById('.nav-item.c').classList.remove('active');
}

// دالة لعرض القنوات في النافذة الخاصة بها
function renderChannels() {
    const container = document.getElementById('channels-list-container');
    if (!container) return;

    container.innerHTML = '';

    // تحويل الكائن (Object) إلى مصفوفة للمرور عليها
    // channelsData هو المتغير الذي جلبنا فيه بيانات channels.json سابقاً
    Object.entries(channelsData).forEach(([channelId, channelThumb]) => {
        
        // البحث عن اسم القناة من مصفوفة الفيديوهات (لأن اسم القناة مخزن هناك)
        const videoInfo = allVideos.find(v => v.channelId === channelId);
        const channelName = videoInfo ? videoInfo.channel : "قناة غير معروفة";

        const channelCard = document.createElement('div');
        channelCard.className = 'channel-item';
        channelCard.style.cssText = `
            display: flex;
            align-items: center;
            padding: 15px;
            gap: 15px;
            border-bottom: 1px solid #222;
            cursor: pointer;
        `;

        channelCard.innerHTML = `
            <img src="${channelThumb}" style="width: 50px; height: 50px; border-radius: 50%;">
            <div style="flex: 1;">
                <div style="color: white; font-weight: bold;">${channelName}</div>
                <div style="color: #aaa; font-size: 12px;">قناة تعليمية آمنة</div>
            </div>
            <button style="background: white; color: black; border: none; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                متابعة
            </button>
        `;

        // عند الضغط على القناة، يمكننا إظهار فيديوهات هذه القناة فقط
        channelCard.onclick = () => {
            openChannelPage(channelId);
        };

        container.appendChild(channelCard);
    });
}

function isShortVideo(durationStr,i=300) {
    const parts = durationStr.split(':').map(Number);
    let totalSeconds = 0;
    
    if (parts.length === 2) { // صيغة MM:SS
        totalSeconds = (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) { // صيغة HH:MM:SS
        totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    
    return totalSeconds > 0 && totalSeconds < i; 
}


function renderShortsTab(videos=allVideos,id) {
    const container = document.getElementById('shorts-container'); // تأكد من الـ ID في الـ HTML
    if (!container) return;
    document.getElementById('video-list-container').innerHTML = '';

    if (id) {
        // Remove the currently playing video from the list to avoid showing it in suggestions
        videos = videos.filter(v => v.id !== id);
    }

    // فلترة المصفوفة الأصلية للفيديوهات الأقل من 5 دقائق
    const shortsVideos = videos.filter(video => isShortVideo(video.duration));

    container.innerHTML = '';

    if (shortsVideos.length === 0) {
        container.innerHTML = '<div style="color:white; text-align:center; padding:50px;">لا توجد فيديوهات قصيرة حالياً</div>';
        return;
    }

    shortsVideos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'short-video-card'; // يمكنك عمل CSS مختلف لتبدو بشكل طولي
        card.onclick = () => playVideo(video.id, video.title, true); // تمرير true لتشغيل الفيديو في وضع الشورتس
        
        card.innerHTML = `
            <div style="position: relative; border-radius: 12px; overflow: hidden;">
                <img src="${video.thumb}" style="width: 100%; object-fit: cover;">
                <div style="position: absolute; bottom: 10px; left: 10px; color: white; text-shadow: 1px 1px 2px black;">
                    <div style="font-weight: bold; font-size: 14px;">${video.title}</div>
                    <div style="font-size: 11px; opacity: 0.8;">${video.duration}</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}


