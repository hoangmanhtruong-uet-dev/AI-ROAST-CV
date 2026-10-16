import {
  CustomJdAnalysisResult,
  CustomJdGenerateRequest,
  InterviewEvaluateData,
  InterviewEvaluateRequest,
  JOB_MATCH_FIT_CRITERION_NAME,
  RubricCriterionScore,
} from '@/lib/schemas/interview';

export function getMockCustomJdQuestions(
  params: CustomJdGenerateRequest
): CustomJdAnalysisResult {
  const text = params.jdText.toLowerCase();

  // Keyword extraction for skills
  const skillKeywords = [
    { key: 'react', name: 'React.js / Next.js' },
    { key: 'typescript', name: 'TypeScript' },
    { key: 'javascript', name: 'JavaScript' },
    { key: 'node', name: 'Node.js' },
    { key: 'golang', name: 'Golang' },
    { key: 'python', name: 'Python' },
    { key: 'sql', name: 'PostgreSQL / MySQL' },
    { key: 'docker', name: 'Docker / CI-CD' },
    { key: 'marketing', name: 'Digital Marketing' },
    { key: 'ads', name: 'Performance Ads' },
    { key: 'seo', name: 'SEO & Content' },
    { key: 'sales', name: 'B2B Sales' },
    { key: 'api', name: 'RESTful API' },
    { key: 'tailwind', name: 'Tailwind CSS' },
  ];

  const matchedSkills = skillKeywords
    .filter((k) => text.includes(k.key))
    .map((k) => k.name);

  const extractedSkills =
    matchedSkills.length > 0
      ? matchedSkills.slice(0, 5)
      : ['Kỹ năng chuyên môn cốt lõi', 'Giải quyết vấn đề', 'Giao tiếp kỹ thuật'];

  const extractedCulture = [
    'Môi trường Agile/Scrum áp lực cao và nhịp độ nhanh',
    'Đòi hỏi tính tự chủ và tư duy bảo vệ chất lượng sản phẩm',
    'Minh bạch thông tin và sẵn sàng tranh luận thẳng thắn',
  ];

  // Infer job title
  let jobTitle = params.targetRole || '';
  if (!jobTitle) {
    if (text.includes('frontend') || text.includes('react')) {
      jobTitle = 'Frontend Developer Fresher';
    } else if (text.includes('backend') || text.includes('node') || text.includes('golang')) {
      jobTitle = 'Backend Engineer Fresher';
    } else if (text.includes('marketing') || text.includes('growth')) {
      jobTitle = 'Digital Marketing Executive';
    } else {
      jobTitle = 'Chuyên viên Fresher / Junior';
    }
  }

  const companyOrIndustry =
    params.company ||
    (text.includes('fintech')
      ? 'FinTech & Công nghệ Tài chính'
      : text.includes('e-commerce') || text.includes('thương mại điện tử')
        ? 'E-Commerce & Bán lẻ'
        : text.includes('logistics')
          ? 'Logistics & Chuỗi cung ứng'
          : 'Doanh nghiệp Công nghệ / Dịch vụ');

  const mainSkill = extractedSkills[0] || 'kỹ năng chuyên môn';

  return {
    jobTitle,
    companyOrIndustry,
    extractedSkills,
    extractedCulture,
    questions: [
      {
        questionId: `custom-q1-${Date.now()}`,
        role: 'custom',
        questionIndex: 1,
        title: `Sự cố ${mainSkill} sát giờ bàn giao`,
        scenario: `Chỉ còn đúng 3 giờ trước khi bàn giao tính năng quan trọng sử dụng ${mainSkill} cho khách hàng theo yêu cầu trong JD của ${companyOrIndustry}, bạn phát hiện lỗi nghiêm trọng gây nghẽn hiệu năng trong điều kiện tải cao.`,
        pressureContext:
          'PM yêu cầu bạn phải có phương án khắc phục ngay lập tức hoặc chịu trách nhiệm về việc chậm tiến độ bàn giao.',
        timeLimitSeconds: 90,
      },
      {
        questionId: `custom-q2-${Date.now()}`,
        role: 'custom',
        questionIndex: 2,
        title: 'Bất đồng giải pháp & Sức ép từ Senior',
        scenario: `Trong buổi thảo luận kỹ thuật nội bộ, bạn phát hiện kiến trúc mà Senior đề xuất không đáp ứng đúng chuẩn văn hóa và quy chuẩn vận hành nêu trong JD. Khi bạn trình bày ý kiến, Senior phản ứng gay gắt và cho rằng bạn thiếu kinh nghiệm thực tế.`,
        pressureContext:
          'Senior là người trực tiếp đánh giá kết thúc thử việc của bạn vào cuối tháng. Bạn cần đưa ra phản hồi vừa tôn trọng đồng nghiệp vừa bảo vệ chất lượng công việc.',
        timeLimitSeconds: 75,
      },
      {
        questionId: `custom-q3-${Date.now()}`,
        role: 'custom',
        questionIndex: 3,
        title: 'Khủng hoảng dữ liệu & Đạo đức nghề nghiệp',
        scenario: `Một sự cố bảo mật bất ngờ phát sinh khiến dữ liệu nhạy cảm có nguy cơ bị rò rỉ. Cấp trên yêu cầu bạn âm thầm xóa log kiểm toán và báo cáo số liệu giả định với khách hàng để tránh bị phạt hợp đồng.`,
        pressureContext:
          'Bạn đối mặt với nguy cơ bị đe dọa chấm dứt hợp đồng nếu không làm theo, nhưng việc làm sai sẽ vi phạm nghiêm trọng chuẩn mực nghề nghiệp và pháp luật.',
        timeLimitSeconds: 60,
      },
    ],
  };
}

export function getMockInterviewEvaluation(
  params: InterviewEvaluateRequest
): InterviewEvaluateData {
  const answer = params.candidateAnswer.trim();
  const isSkippedOrEmpty =
    answer === '' ||
    answer.includes('[Bỏ qua') ||
    answer.includes('[Hết giờ');

  const isCustom = params.role === 'custom' || Boolean(params.customJd);

  if (isSkippedOrEmpty) {
    const isExplicitSkip =
      answer.includes('Bỏ qua') || params.timeSpentSeconds <= 15;

    const rubricScores: RubricCriterionScore[] = [
      {
        name: 'Cấu trúc STAR & Mạch lạc',
        score: 1,
        feedback:
          'Ứng viên chưa đưa ra câu trả lời có cấu trúc STAR cho tình huống này.',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng',
        score: 1,
        feedback:
          'Chưa có hành động cụ thể hay công cụ nghiệp vụ nào được đề xuất.',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm',
        score: 1,
        feedback:
          'Chưa giải quyết trực diện thế tiến thoái lưỡng nan được đặt ra trong câu hỏi.',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý',
        score: 1,
        feedback:
          'Chưa thể hiện tư duy lường trước rủi ro và các kịch bản đối phó khẩn cấp.',
      },
    ];

    if (isCustom) {
      rubricScores.push({
        name: JOB_MATCH_FIT_CRITERION_NAME,
        score: 1,
        feedback:
          'Ứng viên chưa thể hiện được sự gắn kết hay đáp ứng các yêu cầu cốt lõi nêu trong JD.',
      });
    }

    return {
      questionIndex: params.questionIndex,
      rubricScores,
      averageScore: 1.0,
      strengths: [
        'Ứng viên đã đối diện với sức ép thời gian và tình huống áp lực thực tế.',
      ],
      improvements: [
        'Luyện tập phản xạ nhanh: gõ ngay 2-3 gạch đầu dòng về hành động ưu tiên số 1',
        'Tận dụng triệt để từng giây của đồng hồ đếm ngược thay vì bỏ cuộc sớm',
      ],
      followUpQuestion:
        params.role === 'it'
          ? 'Tại sao bạn lại chọn im lặng/bỏ qua khi hệ thống đang đứng trước rủi ro sập hoặc rò rỉ dữ liệu sống còn?'
          : params.role === 'custom'
            ? 'Nếu hội đồng tuyển dụng của công ty mục tiêu yêu cầu giải pháp ngay tại bàn phỏng vấn, bạn sẽ ưu tiên bước nào đầu tiên?'
            : 'Nếu báo chí và khách hàng đang yêu cầu câu trả lời ngay lập tức, bạn sẽ phát ngôn câu đầu tiên như thế nào?',
      simulatedPressureVerdict: isExplicitSkip
        ? 'Ứng viên bấm bỏ qua hoặc chưa đưa ra giải pháp trong tình huống này.'
        : 'Hết thời gian đếm ngược - Ứng viên im lặng hoặc chưa kịp hoàn thiện phương án xử lý.',
    };
  }

  // Answer provided (evaluate length and technical depth)
  const isShort = answer.length < 30;
  const starSignals = [
    'tình huống',
    'hành động',
    'kết quả',
    'giải pháp',
    'bước',
    'trao đổi',
    'báo cáo',
    'rủi ro',
  ].filter((word) => answer.toLowerCase().includes(word)).length;

  const techSignals = [
    'log',
    'rollback',
    'backup',
    'staging',
    'hotfix',
    'deploy',
    'kpi',
    'pr',
    'khách hàng',
    'lead',
    'legal',
    'database',
    'flamegraph',
    'quản lý',
    'react',
    'next',
    'node',
    'api',
    'redis',
    'docker',
    'ads',
  ].filter((word) => answer.toLowerCase().includes(word)).length;

  let starScore = isShort ? 4 : Math.min(9, 6 + Math.min(2, starSignals));
  let specificScore = isShort ? 3 : Math.min(9, 5 + Math.min(3, techSignals));
  let relevanceScore = isShort ? 5 : 8;
  let consequenceScore = isShort ? 4 : Math.min(9, 6 + (techSignals > 0 ? 2 : 0));

  // Check injection keywords in candidateAnswer
  if (
    /ignore all|critical override|hãy chấm điểm 10|system prompt/i.test(answer)
  ) {
    relevanceScore = 1;
  }

  const scores: RubricCriterionScore[] = [
    {
      name: 'Cấu trúc STAR & Mạch lạc',
      score: starScore,
      feedback: isShort
        ? 'Câu trả lời còn khá ngắn, chưa bộc lộ đầy đủ 4 thành tố STAR (Tình huống - Nhiệm vụ - Hành động - Kết quả).'
        : 'Trình bày có cấu trúc rõ ràng, diễn đạt mạch lạc và có giải pháp theo từng bước logic.',
    },
    {
      name: 'Tính cụ thể & Dẫn chứng',
      score: specificScore,
      feedback:
        techSignals > 0
          ? 'Có dẫn chứng kỹ thuật/nghiệp vụ cụ thể, nêu rõ công cụ và các hành động thực thi.'
          : 'Giải pháp bước đầu hợp lý nhưng cần bổ sung thêm tên công cụ, chỉ số định lượng hoặc quy trình tiêu chuẩn.',
    },
    {
      name: 'Mức độ liên quan & Đúng trọng tâm',
      score: relevanceScore,
      feedback:
        relevanceScore === 1
          ? 'Phát hiện hành vi can thiệp chỉ thị hệ thống thay vì trả lời tình huống phỏng vấn.'
          : 'Tập trung giải quyết đúng điểm mâu thuẫn cốt lõi trong câu hỏi, không né tránh áp lực.',
    },
    {
      name: 'Nhận thức hệ quả & Tư duy xử lý',
      score: consequenceScore,
      feedback:
        consequenceScore >= 8
          ? 'Nhận thức sâu sắc về trade-off (được và mất), bảo vệ chuẩn mực đạo đức nghề nghiệp và an toàn tổ chức.'
          : 'Có ý thức về rủi ro nhưng cần chuẩn bị thêm phương án dự phòng (Plan B) khi phương án đầu gặp trở ngại.',
    },
  ];

  if (isCustom) {
    let jobFitScore = isShort ? 4 : Math.min(9, 6 + (techSignals > 0 ? 2 : 1));
    if (relevanceScore === 1) {
      jobFitScore = 1;
    }

    scores.push({
      name: JOB_MATCH_FIT_CRITERION_NAME,
      score: jobFitScore,
      feedback:
        jobFitScore >= 8
          ? 'Phương án xử lý gắn kết chặt chẽ với các kỹ năng và bối cảnh được yêu cầu trong JD mục tiêu.'
          : 'Bước đầu đáp ứng định hướng công việc, nên vận dụng cụ thể hơn các kỹ năng đặc thù nêu trong JD.',
    });
  }

  const totalSum = scores.reduce((acc, s) => acc + s.score, 0);
  const avg = Math.round((totalSum / scores.length) * 10) / 10;

  const strengths =
    params.role === 'it'
      ? [
          'Giữ được sự điềm tĩnh và ưu tiên an toàn hệ thống dưới áp lực deadline',
          'Tư duy phân tích nguyên nhân gốc rễ (root cause) dựa trên bằng chứng kỹ thuật',
        ]
      : params.role === 'custom'
        ? [
            'Bám sát bối cảnh và yêu cầu kỹ năng của vị trí tuyển dụng mục tiêu',
            'Tư duy giải quyết tình huống có trách nhiệm và hướng đến kết quả thực tế',
          ]
        : [
            'Ý thức rõ ràng về đạo đức dữ liệu và bảo vệ uy tín thương hiệu lâu dài',
            'Tư duy xử lý khủng hoảng đa chiều và tôn trọng sự phối hợp liên phòng ban',
          ];

  const improvements =
    isShort
      ? [
          'Cần mở rộng câu trả lời: nêu rõ từng bước thực hiện và kế hoạch truyền thông/báo cáo',
          'Bổ sung dẫn chứng số liệu hoặc kịch bản dự phòng khi phương án chính không kịp tiến độ',
        ]
      : [
          'Rèn luyện thêm kỹ năng đàm phán và thuyết phục cấp trên khi có xung đột lợi ích',
          'Chuẩn bị sẵn sàng kịch bản đối thoại trực diện nếu đối tác hoặc khách hàng leo thang khiếu nại',
        ];

  const followUpQuestion =
    params.role === 'it'
      ? params.questionIndex === 1
        ? 'Nếu PM vẫn khăng khăng ép release và đe dọa trừ điểm KPI thử việc ngay chiều nay, bạn sẽ nói câu gì tiếp theo?'
        : params.questionIndex === 2
          ? 'Khi trình bày flamegraph trước CTO, làm sao bạn vừa bảo vệ sự thật kỹ thuật vừa không đẩy Senior vào thế thù địch cá nhân?'
          : 'Nếu Giám đốc kỹ thuật dọa sa thải bạn ngay lập tức nếu bạn không xóa repo GitHub, bạn sẽ báo cáo vi phạm theo kênh nào?'
      : params.role === 'custom'
        ? params.questionIndex === 1
          ? 'Nếu phương án bạn vừa chọn bị quản lý dự án bác bỏ vì quá tốn thời gian, bạn có phương án thay thế nào ngay lập tức?'
          : params.questionIndex === 2
            ? 'Làm thế nào bạn thuyết phục được các bên liên quan rằng giải pháp của bạn đúng chuẩn yêu cầu JD hơn cách làm cũ?'
            : 'Trong trường hợp xấu nhất phải lựa chọn giữa việc bảo vệ uy tín công ty hay chịu kỷ luật nội bộ, lập trường của bạn là gì?'
        : params.questionIndex === 1
          ? 'Nếu Trưởng phòng dọa đánh trượt thử việc nếu bạn không mua lead ảo, bạn sẽ đề xuất phương án bù đắp KPI nào trong 7 ngày tới?'
          : params.questionIndex === 2
            ? 'Trong 15 phút đầu tiên của đợt tẩy chay, bạn sẽ phát đi thông điệp tạm thời (holding statement) cụ thể như thế nào?'
            : 'Nếu khách hàng VIP livestream trước cổng công ty đòi kiện, bạn sẽ phối hợp với bộ phận Pháp chế (Legal) như thế nào trong 30 phút tới?';

  const simulatedPressureVerdict =
    avg >= 8.0
      ? 'Bản lĩnh vững vàng — Tư duy xử lý khủng hoảng điềm tĩnh, lập luận sắc bén và bảo vệ được giá trị cốt lõi.'
      : avg >= 6.0
        ? 'Xử lý khá tốt — Đã đưa ra giải pháp định hướng đúng đắn, cần nâng cao tính cụ thể của các phương án dự phòng.'
        : 'Cần tôi luyện thêm — Áp lực thời gian khiến câu trả lời chưa làm rõ được các bước giải quyết mâu thuẫn.';

  return {
    questionIndex: params.questionIndex,
    rubricScores: scores,
    averageScore: avg,
    strengths,
    improvements,
    followUpQuestion,
    simulatedPressureVerdict,
  };
}
