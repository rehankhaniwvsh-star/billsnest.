interface VercelApiRequest {
  method?: string;
}

interface VercelApiResponse {
  status: (code: number) => VercelApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default function handler(_req: VercelApiRequest, res: VercelApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET);

  return res.status(200).json({
    status: 'ok',
    service: 'Invobill Serverless API',
    timestamp: new Date().toISOString(),
    razorpay: {
      configured: Boolean(keyId && hasSecret),
      mode: keyId.startsWith('rzp_live_')
        ? 'live'
        : keyId.startsWith('rzp_test_')
        ? 'test'
        : 'none',
      keyPrefix: keyId ? `${keyId.slice(0, 12)}...` : null,
    },
  });
}
