import Razorpay from 'razorpay';

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

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(401).json({
      success: false,
      error: 'Razorpay credentials are not configured on the server.',
      code: 'RAZORPAY_AUTH_MISSING',
    });
  }

  try {
    const parsedBody: Record<string, any> =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const { amount, currency, receipt, planId, billingCycle, invoiceId, notes } = parsedBody;

    if (!Number.isInteger(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Order amount must be at least 100 paise/cents.',
        code: 'INVALID_ORDER_AMOUNT',
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        ...(notes || {}),
        ...(planId ? { planId } : {}),
        ...(billingCycle ? { billingCycle } : {}),
        ...(invoiceId ? { invoiceId } : {}),
      },
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    if (error?.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        code: 'RAZORPAY_AUTH_FAILED',
      });
    }
    return res.status(500).json({
      success: false,
      error: error?.error?.description || error?.message || 'Unable to create Razorpay order.',
      code: 'RAZORPAY_ORDER_FAILED',
    });
  }
}
