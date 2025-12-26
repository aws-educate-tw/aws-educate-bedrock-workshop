import { PlayResponse, SummaryState } from '../types';

let clickCount = 0;

export const mockPlayResponse: PlayResponse = {
  sessionId: 'mock-session-123',
  stage: 'childhood',
  imageUrl: 'https://via.placeholder.com/400x300/cccccc/666666?text=童年時期',
  statusText: '你是一個充滿好奇心的孩子，住在一個溫馨的小鎮上。',
  goalText: '目標：培養良好的品格和學習習慣，為未來打下基礎。',
  eventText: '今天是你第一天上學，你看到教室裡有很多新同學。有個同學看起來很害羞，獨自坐在角落。另一邊有一群同學在熱烈討論著什麼。你會怎麼做？',
  optionA: '主動去和害羞的同學聊天，試著成為朋友',
  optionB: '加入那群熱烈討論的同學，融入他們的話題',
  isEnd: false
};

export const mockSummaryState: SummaryState = {
  lifeScore: 78,
  radar: {
    wisdom: 85,
    wealth: 65,
    relationship: 90,
    career: 70,
    health: 80
  },
  finalSummaryText: '你度過了充實而有意義的一生。從小就展現出的善良和智慧，讓你在人生的各個階段都能做出正確的選擇。你重視人際關係，也不忘記持續學習和成長。雖然在財富積累上不是最突出的，但你擁有的友誼和家庭溫暖是無價的。你的人生證明了，真正的成功不只是金錢，更是內心的富足和對他人的正面影響。',
  achievements: [
    {
      title: '終身學習者',
      desc: '持續學習新知識，從不停止成長',
      iconUrl: 'https://via.placeholder.com/50x50/4CAF50/ffffff?text=📚'
    },
    {
      title: '好朋友',
      desc: '維持深厚的友誼關係，是朋友們的支柱',
      iconUrl: 'https://via.placeholder.com/50x50/2196F3/ffffff?text=👥'
    },
    {
      title: '家庭守護者',
      desc: '建立溫馨的家庭，是家人的依靠',
      iconUrl: 'https://via.placeholder.com/50x50/FF9800/ffffff?text=🏠'
    }
  ],
  keyChoices: [
    '童年時選擇幫助害羞的同學，培養了同理心',
    '學生時期專注學業，奠定了知識基礎',
    '成年後選擇穩定的工作，重視工作生活平衡',
    '中年時投資教育子女，傳承價值觀',
    '晚年選擇志願服務，回饋社會'
  ],
  finalImageUrl: 'https://via.placeholder.com/300x400/f0f0f0/333333?text=人生終章'
};

// 模擬不同階段的事件
export const getStageEvent = (stage: string) => {
  const events = {
    childhood: {
      imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1000&auto=format&fit=crop',
      statusText: '你是一個充滿好奇心的孩子，住在溫馨的小鎮上。',
      goalText: '目標：培養良好品格，為未來打下基礎。',
      eventText: '今天是你第一天上學，教室裡有很多新同學。有個同學看起來很害羞，獨自坐在角落。另一邊有一群同學在熱烈討論。你會怎麼做？',
      optionA: '主動去和害羞的同學聊天',
      optionB: '加入熱烈討論的同學群'
    },
    student: {
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
      statusText: '你已經是個高中生，面臨人生重要的選擇。',
      goalText: '目標：為未來的職業道路做準備。',
      eventText: '高三了，你需要選擇大學科系。父母希望你選擇穩定的商科，但你對藝術很有興趣。朋友們都在討論未來規劃。',
      optionA: '聽從父母建議選擇商科',
      optionB: '追隨內心選擇藝術系'
    },
    adult: {
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
      statusText: '你已經是個成年人，在職場上有了一定成就。',
      goalText: '目標：在事業與家庭間找到平衡。',
      eventText: '你在公司工作了幾年，現在有機會升職到管理層，但需要更多時間投入工作。同時，你也想多陪伴家人。',
      optionA: '接受升職，專注事業發展',
      optionB: '維持現狀，重視家庭時光'
    },
    elder: {
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
      statusText: '你已經退休，回顧這一生的點點滴滴。',
      goalText: '目標：為人生畫下完美句號。',
      eventText: '退休後的你有很多時間，可以做一直想做但沒時間做的事。你想要如何度過這段黃金歲月？',
      optionA: '投入志願服務，回饋社會',
      optionB: '專注個人興趣，享受生活'
    }
  };
  
  return events[stage as keyof typeof events] || events.childhood;
};