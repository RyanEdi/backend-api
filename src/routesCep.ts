import { Router } from 'express';
import { consultaCep } from './services/cepService';

const router = Router();

router.get('/:cep', async (req, res) => {
  const { cep } = req.params;
  try {
    const data = await consultaCep(cep);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao consultar CEP' });
  }
});

export default router;
