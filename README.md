MEU DINHEIRO

Painel financeiro pessoal, feito para acompanhar salário, despesas mensais e
compras realizadas no cartão.

## Modo local

O site funciona sem login, salvando os dados somente no navegador e dispositivo
atuais. Use **Entrar na conta** na página inicial para abrir o cadastro/login e
sincronizar os dados entre dispositivos com Supabase:

1. Crie um projeto em [supabase.com](https://supabase.com/) e guarde a URL base
   do projeto (por exemplo, `https://seu-projeto.supabase.co`) e a chave pública
   `anon`/publishable. Não use a URL de API com `/rest/v1`.
2. No painel do Supabase, abra **SQL Editor**, cole o conteúdo de
   `supabase-schema.sql` e execute. A tabela usa Row Level Security para cada
   conta acessar somente os próprios dados.
3. Preencha `url` e `anonKey` em `supabase-config.js`. Use somente a chave
   pública do projeto; nunca coloque a chave `service_role` neste site.
4. Publique todos os arquivos em um endereço HTTPS. No Supabase, configure o
   endereço publicado em **Authentication → URL Configuration** e configure o
   envio de e-mails para confirmação de cadastro.
5. Abra o site, crie sua conta e confirme o e-mail. Ao primeiro acesso, o site
   pergunta se deseja importar os dados que já estão salvos naquele navegador.
   Depois, entre com a mesma conta nos demais dispositivos.

As alterações são guardadas localmente e enviadas automaticamente à nuvem. O
indicador na barra lateral informa o estado da sincronização. Se houver erro, a
mensagem será exibida ali; os dados locais não são apagados por uma falha de
sincronização. Faça backups periódicos no próprio projeto Supabase. Nenhum
serviço pode garantir perda zero em qualquer circunstância.