TOP CELL

## Executar com proteção do servidor

1. Instale Node.js 18 ou superior.
2. Crie as variáveis de ambiente usando `.env.example` como referência.
3. Execute `npm start`.
4. Acesse `http://localhost:3000`.

Nunca envie `.env` para o GitHub e use uma senha forte no ambiente de produção. Gere o hash com:

```text
node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');const h=c.scryptSync('SUA_SENHA_FORTE',s,64).toString('hex');console.log(s+':'+h)"
```