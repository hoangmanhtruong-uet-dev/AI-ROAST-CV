import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/fakedoor/route';
import { leadStore, getLeadsCount } from '@/lib/storage';

describe('POST /api/fakedoor Route Handler', () => {
  beforeEach(() => {
    // Clear lead store before each test to maintain isolation
    leadStore.length = 0;
  });

  it('successfully records a valid lead with all fields', async () => {
    const request = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sinhvien@hust.edu.vn',
        tier: 'pro_29k',
        featureInterest: 'deep_interview',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/cảm ơn bạn đã quan tâm/i);

    // Verify lead stored in in-memory collection
    expect(leadStore).toHaveLength(1);
    expect(leadStore[0].email).toBe('sinhvien@hust.edu.vn');
    expect(leadStore[0].tier).toBe('pro_29k');
    expect(leadStore[0].featureInterest).toBe('deep_interview');
    expect(getLeadsCount()).toBe(1);
  });

  it('accepts valid email with default featureInterest when omitted', async () => {
    const request = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'fresher.dev@gmail.com',
        tier: 'pro_29k',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(leadStore).toHaveLength(1);
    expect(leadStore[0].email).toBe('fresher.dev@gmail.com');
    expect(leadStore[0].featureInterest).toBe('general');
  });

  it('handles duplicate lead email without failing and without creating duplicates', async () => {
    const req1 = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        tier: 'pro_29k',
      }),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);

    const req2 = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        tier: 'pro_29k',
      }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);

    // Should remain 1 item
    expect(leadStore).toHaveLength(1);
  });

  it('rejects invalid email format with 400 Bad Request', async () => {
    const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain'];

    for (const email of invalidEmails) {
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tier: 'pro_29k',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/email không hợp lệ/i);
    }

    expect(leadStore).toHaveLength(0);
  });

  it('rejects missing or empty email field with 400 Bad Request', async () => {
    const request = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: 'pro_29k',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(leadStore).toHaveLength(0);
  });

  it('rejects invalid tier value with 400 Bad Request', async () => {
    const request = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        tier: 'invalid_tier',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('gracefully handles malformed non-JSON request body', async () => {
    const request = new Request('http://localhost:3000/api/fakedoor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json payload',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(leadStore).toHaveLength(0);
  });
});
