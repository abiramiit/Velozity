cd server
npm init -y
npm install express cors dotenv helmet zod bcrypt jsonwebtoken socket.io node-cron @prisma/client cookie-parser express-async-handler
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/cookie-parser @types/node-cron tsx
npx tsc --init
npx prisma init
