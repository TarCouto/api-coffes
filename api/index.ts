import express, { Request, Response } from 'express';
import { z } from 'zod';
import cors from 'cors';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://default:nzfsVMC7xr6b@ep-snowy-salad-a6gkoffw.us-west-2.aws.neon.tech:5432/verceldb?sslmode=require',
});

// Função para salvar um pedido no banco de dados
const saveOrderToDB = async (order: OrderInfo) => {
  const query = `
    INSERT INTO orders (cep, street, number, full_address, neighborhood, city, state, payment_method)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `;
  const values = [
    order.cep,
    order.street,
    order.number,
    order.fullAddress,
    order.neighborhood,
    order.city,
    order.state,
    order.paymentMethod,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id; // Retorna o ID da ordem inserida
  } catch (error) {
    throw new Error('Erro ao salvar a ordem no banco de dados');
  }
};

const allowedOrigins = ['https://web-coffee-delivery.vercel.app', 'http://localhost:3000'];


const app = express();
app.use(express.json()); // Necessário para interpretar o corpo JSON
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

interface Coffee {
  id: string;
  title: string;
  description: string;
  tags: string[];
  price: number;
  image: string;
}

// Dados dos cafés
const coffees: Coffee[] = [
  {
    id: "0",
    title: "Expresso Tradicional",
    description: "O tradicional café feito com água quente e grãos moídos",
    tags: ["tradicional"],
    price: 9.90,
    image: "/expresso.png"
  },
  {
    id: "1",
    title: "Expresso Americano",
    description: "Expresso diluído, menos intenso que o tradicional",
    tags: ["tradicional"],
    price: 9.90,
    image: "/americano.png"
  },
  {
    id: "2",
    title: "Expresso Cremoso",
    description: "Café expresso tradicional com espuma cremosa",
    tags: ["tradicional"],
    price: 9.90,
    image: "/expresso-cremoso.png"
  },
  {
    id: "3",
    title: "Expresso Gelado",
    description: "Bebida preparada com café expresso e cubos de gelo",
    tags: ["tradicional", "gelado"],
    price: 9.90,
    image: "/cafe-gelado.png"
  },
  {
    id: "4",
    title: "Café com Leite",
    description: "Meio a meio de expresso tradicional com leite vaporizado",
    tags: ["tradicional", "com leite"],
    price: 9.90,
    image: "/cafe-com-leite.png"
  },
  {
    id: "5",
    title: "Latte",
    description: "Uma dose de café expresso com o dobro de leite e espuma cremosa",
    tags: ["tradicional", "com leite"],
    price: 9.90,
    image: "/latte.png"
  },
  {
    id: "6",
    title: "Capuccino",
    description: "Bebida com canela feita de doses iguais de café, leite e espuma",
    tags: ["tradicional", "com leite"],
    price: 9.90,
    image: "/capuccino.png"
  },
  {
    id: "7",
    title: "Macchiato",
    description: "Café expresso misturado com um pouco de leite quente e espuma",
    tags: ["tradicional", "com leite"],
    price: 9.90,
    image: "/macchiato.png"
  },
  {
    id: "8",
    title: "Mocaccino",
    description: "Café expresso misturado com um pouco de leite quente e espuma",
    tags: ["tradicional", "com leite"],
    price: 9.90,
    image: "/mocaccino.png"
  },
  {
    id: "9",
    title: "Chocolate Quente",
    description: "Bebida feita com chocolate dissolvido no leite quente e café",
    tags: ["especial", "com leite"],
    price: 9.90,
    image: "/chocolate-quente.png"
  },
  {
    id: "10",
    title: "Cubano",
    description: "Drink gelado de café expresso com rum, creme de leite e hortelã",
    tags: ["especial", "alcoólico", "gelado"],
    price: 9.90,
    image: "/cubano.png"
  },
  {
    id: "11",
    title: "Havaiano",
    description: "Bebida adocicada preparada com café e leite de coco",
    tags: ["especial"],
    price: 9.90,
    image: "/havaiano.png"
  },
  {
    id: "12",
    title: "Árabe",
    description: "Bebida preparada com grãos de café árabe e especiarias",
    tags: ["especial"],
    price: 9.90,
    image: "/arabe.png"
  },
  {
    id: "13",
    title: "Irlandês",
    description: "Bebida a base de café, uísque irlandês, açúcar e chantilly",
    tags: ["especial", "alcoólico"],
    price: 9.90,
    image: "/irlandes.png"
  }
];

// Rota para retornar os cafés
app.get('/api/coffees', (req: Request, res: Response) => {
  console.log('Requisição para /api/coffees recebida');
  res.json({ coffees });
});

// Exporte o app para a Vercel

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


const newOrderSchema = z.object({
  cep: z.number({ invalid_type_error: 'Informe o CEP' }), // Adicione uma validação para o formato correto do CEP
  street: z.string().min(1, 'Informe a rua'),
  number: z.string().min(1, 'Informe o número'),
  fullAddress: z.string().optional(), // Campo opcional
  neighborhood: z.string().min(1, 'Informe o bairro'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().min(1, 'Informe a UF'),
  paymentMethod: z.enum(['credit', 'debit', 'cash'], {
    invalid_type_error: 'Informe um método de pagamento válido',
  }),
});

// Tipo da ordem (OrderInfo)

// Rota para receber os pedidos
// Armazenar ordens temporariamente em memória

const validateOrder = (req: Request, res: Response, next: Function): void => {
  try {
    // Valida o corpo da requisição e sobrescreve req.body com os dados validados
    req.body = newOrderSchema.parse(req.body);
    next(); // Chama o próximo middleware ou rota se a validação for bem-sucedida
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Retorna erro de validação e finaliza a resposta, sem retornar diretamente
      res.status(400).json({ errors: error.errors });
    } else {
      // Retorna erro genérico se ocorrer algum problema diferente
      res.status(500).json({ error: 'Erro ao validar o pedido' });
    }
  }
};

app.post('/api/orders', validateOrder, async (req: Request, res: Response) => {
  try {
    const newOrder = {
      ...req.body,
      createdAt: new Date().toISOString(),
    };

    // Salvar a nova ordem no banco de dados
    const orderId = await saveOrderToDB(newOrder);
    res.status(201).json({ message: 'Pedido criado com sucesso!', orderId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar a ordem' });
  }
});

// Função para buscar uma ordem pelo ID no banco de dados
const getOrderById = async (orderId: number) => {
  const query = `
    SELECT * FROM orders WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [orderId]);
    return result.rows[0]; // Retorna a ordem encontrada
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



export default app;
