
import * as http from "http";
import { app } from './config/server';
import "dotenv/config";
const server = http.createServer(app);
const port = parseInt(process.env.PROJECT_PORT as string, 10) || 3003;


server.listen(port, '0.0.0.0', () => {
   console.log('Express server listening on port ' + port);
});
