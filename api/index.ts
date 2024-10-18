import express, { Request, Response } from 'express';
import { z } from 'zod';
import cors from 'cors';
import { sql } from '@vercel/postgres';

// Função para salvar um pedido no banco de dados
const saveOrderToDB = async (order: OrderInfo) => {
  const query = `
    INSERT INTO orders (cep, street, number, full_address, neighborhood, city, state, payment_method, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id;
  `;

  try {
    const { rows } = await sql.query(query, [
      order.cep,
      order.street,
      order.number,
      order.fullAddress || null,
      order.neighborhood,
      order.city,
      order.state,
      order.paymentMethod
    ]);

    if (rows.length > 0) {
      return rows[0].id; // Retorna o ID da ordem inserida
    } else {
      throw new Error('Nenhum ID retornado');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro ao salvar a ordem no banco de dados:', error.message);
    } else {
      console.error('Erro desconhecido ao salvar a ordem no banco de dados:', error);
    }
    throw new Error('Erro ao salvar a ordem no banco de dados');
  }
};


// Configurações de CORS
const allowedOrigins = ['https://web-coffee-delivery.vercel.app', 'http://localhost:3000'];

const app = express();
app.use(express.json()); 
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Definição de interface para os pedidos
interface OrderInfo {
  cep: number;
  street: string;
  number: string;
  fullAddress?: string;
  neighborhood: string;
  city: string;
  state: string;
  paymentMethod: 'credit' | 'debit' | 'cash';
}

// Validação com Zod
const newOrderSchema = z.object({
  cep: z.number({ invalid_type_error: 'Informe o CEP' }),
  street: z.string().min(1, 'Informe a rua'),
  number: z.string().min(1, 'Informe o número'),
  fullAddress: z.string().optional(),
  neighborhood: z.string().min(1, 'Informe o bairro'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().min(1, 'Informe a UF'),
  paymentMethod: z.enum(['credit', 'debit', 'cash'], { invalid_type_error: 'Informe um método de pagamento válido' }),
});

// Middleware para validar a ordem
const validateOrder = (req: Request, res: Response, next: Function): void => {
  try {
    req.body = newOrderSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.issues }); // Alterei para `error.issues`
    } else {
      res.status(500).json({ error: 'Erro ao validar o pedido' });
    }
  }
};

// Rota para criar um pedido
app.post('/api/orders', validateOrder, async (req: Request, res: Response) => {
  try {
    const newOrder = { ...req.body, createdAt: new Date().toISOString() };
    const orderId = await saveOrderToDB(newOrder);
    res.status(201).json({ message: 'Pedido criado com sucesso!', orderId });
  } catch (error) {
    console.error('Erro ao salvar a ordem:', error);
    res.status(500).json({ error: 'Erro ao salvar a ordem' });
  }
});

// Função para buscar uma ordem pelo ID
const getOrderById = async (orderId: number) => {
  try {
    const { rows } = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    if (rows.length === 0) {
      throw new Error('Ordem não encontrada');
    }
    return rows[0];
  } catch (error) {
    throw new Error('Erro ao buscar a ordem no banco de dados');
  }
};


// Rota para buscar uma ordem pelo ID
app.get('/api/orders/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await getOrderById(Number(id));

    if (!order) {
      res.status(404).json({ message: 'Ordem não encontrada' });
    } else {
      res.status(200).json({ order });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar a ordem' });
  }
});

// Exporta o app para a Vercel
export default app;
