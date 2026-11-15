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
  return res.status(200).json({
    status: 'ok',
    service: 'Invobill Serverless API',
    timestamp: new Date().toISOString(),
  });
}
