export interface ScrubRequest {
  id: string;
  rawText: string;
  candidateNameHint?: string;
}

export interface ScrubResponse {
  id: string;
  sanitizedText: string;
  piiMap: Record<string, string>; // Token -> Giá trị gốc (Chỉ lưu trên RAM Client)
  stats: {
    totalMasked: number;
    byType: Record<string, number>;
  };
}

const PII_PATTERNS: { type: string; regex: RegExp }[] = [
  // 1. Email
  {
    type: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g,
  },
  // 2. Số điện thoại (Hỗ trợ chuẩn VN +84, 09x, 03x... và quốc tế)
  {
    type: 'PHONE',
    regex: /(?:\+84|0084|0)[\s.-]?(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[\s.-]?\d{3}[\s.-]?\d{4}\b|\b\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g,
  },
  // 3. Links (LinkedIn, GitHub, GitLab, Portfolio cá nhân)
  {
    type: 'LINK',
    regex: /\b(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/|github\.com\/|gitlab\.com\/|behance\.net\/|dribbble\.com\/)[A-Za-z0-9_-]+\/?\b/gi,
  },
  // 4. Số CCCD / CMND / Passport (9 hoặc 12 chữ số)
  {
    type: 'ID_NUM',
    regex: /\b(?:\d{9}|\d{12})\b/g,
  },
  // 5. Địa chỉ chi tiết (Số nhà, Ngõ/Ngách, Đường, Phường/Xã...)
  {
    type: 'ADDRESS',
    regex: /\b(?:Số\s+\d+[A-Za-z\/]*|Ngõ\s+\d+|Hẻm\s+\d+|Đường\s+[A-ZÀ-Ỹ][a-zà-ỹ]+\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)[^,\n]*(?:,\s*(?:Phường|Xã|Quận|Huyện|TP\.|Thành phố)[^,\n]*){1,3}/gi,
  },
];

self.onmessage = (event: MessageEvent<ScrubRequest>) => {
  const { id, rawText, candidateNameHint } = event.data;
  let sanitizedText = rawText;
  const piiMap: Record<string, string> = {};
  const reverseLookup = new Map<string, string>();
  const byType: Record<string, number> = {};
  let totalMasked = 0;

  const maskValue = (rawVal: string, type: string): string => {
    const trimmed = rawVal.trim();
    if (!trimmed) return rawVal;

    if (reverseLookup.has(trimmed)) {
      return reverseLookup.get(trimmed)!;
    }

    byType[type] = (byType[type] || 0) + 1;
    totalMasked++;
    const token = `[PII_${type}_${byType[type]}]`;
    piiMap[token] = trimmed;
    reverseLookup.set(trimmed, token);
    return token;
  };

  // Bước 1: Quét tên ứng viên
  if (candidateNameHint && candidateNameHint.trim().length > 2) {
    const escapedName = candidateNameHint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`\\b${escapedName}\\b`, 'gi');
    sanitizedText = sanitizedText.replace(nameRegex, (match) => maskValue(match, 'NAME'));
  } else {
    const lines = sanitizedText.split('\n');
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const vnFullNameRegex = /^([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+){1,4})$/gm;
      const upperNameRegex = /^([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]{2,}(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]{2,}){1,4})$/gm;

      lines[i] = lines[i]
        .replace(vnFullNameRegex, (m) => maskValue(m, 'NAME'))
        .replace(upperNameRegex, (m) => maskValue(m, 'NAME'));
    }
    sanitizedText = lines.join('\n');
  }

  // Bước 2: Quét toàn bộ các mẫu PII chuẩn
  for (const { type, regex } of PII_PATTERNS) {
    sanitizedText = sanitizedText.replace(regex, (match) => maskValue(match, type));
  }

  const response: ScrubResponse = {
    id,
    sanitizedText,
    piiMap,
    stats: {
      totalMasked,
      byType,
    },
  };

  self.postMessage(response);
};
