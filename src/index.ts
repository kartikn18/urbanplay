import http from 'http';
import authenticatroutes from "./modules/auth/auth.routes";
import { AdminRoutes } from './modules/auth/admin/admin.routes';
import { authenticateToken } from './middlewares/authentication';
import { Userroutes} from "./modules/auth/user/user.routes"
import paymentroutes from "./payments/payments.routes";
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

const corsOptions = {
    origin: 'http://localhost:5000',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
//auth routes:
app.use('/api/auth', authenticatroutes);
//admin routes:
app.use('/api/admin',authenticateToken, AdminRoutes);
//user routes:
app.use('/api/user', Userroutes);
//payment routes:
app.use('/api', paymentroutes);
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});