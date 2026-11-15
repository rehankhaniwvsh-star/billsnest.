import crypto from 'crypto';

interface VercelApiRequest {
  method?: string;
  body?: Record<string, any> | string;
}

interface VercelApiResponse {
  status: (code: number) => VercelApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method || 'UNKNOWN'} not allowed. Use POST.`,
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(401).json({
      success: false,
      error: 'Razorpay secret key is not configured on the server.',
      code: 'RAZORPAY_AUTH_MISSING',
    });
  }

  try {
    const parsedBody: Record<string, any> =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      billingCycle,
      currency,
      amount,
      invoiceId,
    } = parsedBody;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Razorpay payment verification fields.',
        code: 'MISSING_PAYMENT_FIELDS',
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(String(razorpay_signature), 'utf8');
    const isValid =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Payment signature verification failed. Payment not confirmed.',
        code: 'SIGNATURE_MISMATCH',
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      planId: planId || null,
      billingCycle: billingCycle || null,
      currency: currency || 'INR',
      amount: amount ?? null,
      invoiceId: invoiceId || null,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Unable to verify Razorpay payment signature.',
      code: 'PAYMENT_VERIFY_FAILED',
    });
  }
}
