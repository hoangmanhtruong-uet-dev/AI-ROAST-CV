import { z } from 'zod';

export const FakeDoorRequestSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập địa chỉ email của bạn' })
    .trim()
    .min(1, 'Vui lòng nhập địa chỉ email của bạn')
    .max(255, 'Email không được vượt quá 255 ký tự')
    .email('Định dạng email không hợp lệ (ví dụ: name@example.com)'),
  tier: z
    .literal('pro_29k', {
      required_error: 'Gói đăng ký phải là pro_29k',
      invalid_type_error: 'Gói đăng ký không hợp lệ',
    })
    .default('pro_29k'),
  featureInterest: z
    .enum(['deep_interview', 'ats_rewrite', 'general'], {
      invalid_type_error: 'Tính năng quan tâm không hợp lệ',
    })
    .optional()
    .default('general'),
});

export type FakeDoorRequest = z.infer<typeof FakeDoorRequestSchema>;

export const FakeDoorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});

export type FakeDoorResponse = z.infer<typeof FakeDoorResponseSchema>;
