# 🏢 Central de Notas - Gestão Integrada de Obras & Financeiro

Uma plataforma corporativa premium para gerenciamento de faturas de contas fixas de canteiros de obras, conciliação inteligente via Caixa de Entrada DDA, sincronização de Notas Fiscais eletrônicas (NF-e) diretamente com a Sefaz e varredura automática de regularidade fiscal (protestos de CNPJ).

---

## 🚀 Principais Funcionalidades

### 1. ⚡ Painel de Controle Operacional (Dashboard)
- Indicadores em tempo real sobre a saúde fiscal (CNPJ) das obras, quantidade de faturas pendentes e comprometimento financeiro.
- Central de Atividades e log de alertas recentes.
- Links rápidos reativos para navegação facilitada.

### 2. 🧾 Notas Fiscais (NF-e)
- Painel de métricas consolidado da obra (total de notas, valor acumulado, notas pendentes de manifesto).
- Busca em tempo real de fornecedores e número de nota.
- Copiador de chave de acesso de 44 dígitos com feedback visual rápido.
- Manifestação do destinatário (Confirmar, Desconhecer, Operação Não Realizada).
- Lançamento financeiro com classificação de custo no ERP.

### 3. ⏱️ Contas Fixas (Faturas do Canteiro)
- Painel de métricas integrado de previsões e faturas pagas ou atrasadas.
- Quadro Kanban para acompanhamento de faturas (*Não Chegou / Atrasadas*, *Recebida / A Lançar*, *Liquidada / Lançada*).
- Upload de fatura integrado com leitura inteligente OCR simulada para extração automática de dados de código de barras, vencimento e valores.
- Identificação de anomalia de consumo (valores acima de 20% do orçamento padrão).
- Aba de **Regras & Histórico de Consumo** com gráficos de consumo real, projeções futuras e alertas automatizados por e-mail e WhatsApp.

### 4. 🏦 Caixa de Entrada DDA (Débito Direto Autorizado)
- Integração simulada com BaaS/CIP (Câmara Interbancária de Pagamentos) para listar boletos emitidos contra o CNPJ da obra.
- Sistema inteligente de sugestão de vínculos com base em CNPJ emissor, valor e mês de vencimento.
- Vínculo em um clique com faturas fixas ou NF-es para liquidação e conciliação.

### 5. 🛡️ Regularidade Fiscal (Protestos CNPJ)
- Varredura de CNPJ em tempo real na API nacional de cartórios de protestos.
- Upload de cartas de anuência e comprovantes para saneamento de pendências diretamente no sistema.

### 6. 👑 Painel Master & Multi-Tenant
- **Isolamento de Obras:** Engenheiros, administradores de obra (ADM) e financeiro são vinculados estritamente aos seus respectivos empreendimentos. O seletor de obra global no cabeçalho é desabilitado e travado para perfis operacionais.
- **Painel Master Geral:** Perfis `master` gerenciam o cadastro de obras, usuários do sistema, vinculam equipes a obras e aprovam ou recusam novas solicitações de acesso originadas no formulário de login.

---

## 🛠️ Stack Tecnológica

- **Front-end:** HTML5, Vanilla JavaScript, CSS3 Premium (Modern HSL colors, Glassmorphism, Micro-animações).
- **Tooling/Bundler:** Vite.
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL) com RLS (Row Level Security) integrado.
- **Hospedagem:** Vercel (Frontend) & Supabase (Backend/Database).

---

## ⚙️ Configuração Local

### Pré-requisitos
Certifique-se de ter o **Node.js** instalado em sua máquina.

### Passo 1: Instalação das Dependências
Clone o repositório e execute:
```bash
npm install
```

### Passo 2: Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`:
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-anon-key-do-supabase
VITE_DATA_PROVIDER=real
```

### Passo 3: Executar o Servidor de Desenvolvimento
```bash
npm run dev
```

### Passo 4: Build de Produção
Para gerar a pasta compactada e otimizada de produção (`dist`):
```bash
npm run build
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Para inicializar a estrutura do PostgreSQL no Supabase, acesse a aba **SQL Editor** do painel do Supabase e execute os scripts na seguinte ordem:

1. **`supabase_schema.sql`**: Cria as tabelas de `obras`, `contas_fixas`, `faturas`, `notas_fiscais`, `boletos_dda`, `usuarios` e `solicitacoes_acesso`, configurando as chaves estrangeiras e a segurança no nível de linhas (RLS).
2. **`supabase_seed.sql`**: Alimenta o banco de dados com registros iniciais de obras, notas fiscais, faturas de exemplo e os usuários de demonstração.

---

## 🔐 Configurando Acesso Git / GitHub via SSH

Se você estiver recebendo o erro `Permission denied (publickey)` ao tentar realizar o `git push`, siga o procedimento abaixo para vincular sua chave SSH ao GitHub:

### Passo 1: Copiar a Chave Pública
Abra o arquivo `.pub` gerado no seu terminal ou editor. No Windows, a chave gerada se encontra em:
`C:\Users\Colaborador\.ssh\id_ed25519.pub`

Copie todo o conteúdo de texto da chave pública que se inicia com `ssh-ed25519`.

### Passo 2: Adicionar a Chave ao GitHub
1. Acesse o [GitHub](https://github.com/) e faça login.
2. No canto superior direito, clique na sua foto de perfil e vá em **Settings** (Configurações).
3. Na barra lateral esquerda, clique em **SSH and GPG keys**.
4. Clique no botão **New SSH key** (Nova chave SSH).
5. No campo **Title**, dê um nome descritivo para identificar seu computador (ex: "Computador de Trabalho").
6. No campo **Key**, cole a chave pública que você copiou do arquivo `.pub`.
7. Clique em **Add SSH key**.

### Passo 3: Testar a Conexão
Para validar se a chave foi reconhecida pelo GitHub, execute o seguinte comando no terminal:
```bash
ssh -T git@github.com
```
Se a chave estiver configurada corretamente, o GitHub retornará uma mensagem como:
> *Hi username! You've successfully authenticated, but GitHub does not provide shell access.*

### Passo 4: Enviar Commits Locais
Com o acesso SSH validado, envie as alterações locais para o repositório remoto:
```bash
git push
```
