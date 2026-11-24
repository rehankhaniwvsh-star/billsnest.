interface VercelApiRequest {
  method?: string;
  body?: Record<string, any> | string;
}

interface VercelApiResponse {
  status: (code: number) => VercelApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

interface RatingRecord {
  id: string;
  rating: number;
  message: string;
  authorName: string;
  createdAt: string;
}

const memoryRatings: RatingRecord[] = [];

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      ratings: memoryRatings.slice(0, 50),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method || 'UNKNOWN'} not allowed.`,
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const parsedBody: Record<string, any> =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const rating = Number(parsedBody.rating);
    const message = String(parsedBody.message || '').trim();
    const authorName = String(parsedBody.authorName || '').trim() || 'Invobill User';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer between 1 and 5.',
        code: 'INVALID_RATING',
      });
    }

    if (message.length < 2 || message.length > 400) {
      return res.status(400).json({
        success: false,
        error: 'Message must be between 2 and 400 characters.',
        code: 'INVALID_MESSAGE',
      });
    }

    const entry: RatingRecord = {
      id: `rat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      rating,
      message,
      authorName: authorName.slice(0, 80),
      createdAt: new Date().toISOString(),
    };

    memoryRatings.unshift(entry);
    if (memoryRatings.length > 100) {
      memoryRatings.length = 100;
    }

    return res.status(201).json({
      success: true,
      entry,
      ratings: memoryRatings.slice(0, 50),
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Invalid rating payload.',
      code: 'INVALID_PAYLOAD',
    });
  }
}
