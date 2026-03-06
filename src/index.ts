import http from 'http';
import authenticatroutes from "./modules/auth/auth.routes";
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
//auth routes:
app.use('/api/auth', authenticatroutes);

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});

