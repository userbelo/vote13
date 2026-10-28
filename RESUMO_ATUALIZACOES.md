# 📋 Resumo das Atualizações e Funcionamento do Sistema

Este documento reúne de forma simples e direta todas as melhorias e novas funcionalidades implementadas no portal, focando no funcionamento prático do negócio e na gestão dos leads e pagamentos.

---

## 🎯 1. O Que Mudou para o Cidadão (Fluxo do Lead)

1. **Leitura da Matéria / Notícia**:
   * O cidadão acessa o portal e lê a reportagem institucional (com padrão visual oficial e alta credibilidade).
   * No final da matéria, encontra o canal de consulta oficial: *"Verifique se você tem direito aos benefícios informados"*.

2. **Preenchimento dos Dados em 3 Etapas**:
   * **Etapa 1:** Nome completo e CPF.
   * **Etapa 2:** Data de nascimento e Estado (UF).
   * **Etapa 3:** Telefone com DDD e autorização LGPD.
   * Ao avançar, os dados são salvos instantaneamente no banco de dados com a indicação exata de qual matéria ele estava lendo.

3. **Checkout com Valor Específico do Artigo**:
   * O sistema exibe o resumo da emissão do cartão com o nome da matéria que ele estava acessando.
   * O valor da taxa cobrada é **único para aquele artigo** (ex: R$ 15,00, R$ 19,90, etc.).
   * O botão oficial de compra exibe o valor da taxa claramente: **`COMPRAR • R$ [VALOR]`**.

4. **Pagamento Pix com Bloqueio Real Antifraude**:
   * O código Pix Copia e Cola e o QR Code são gerados na hora com o valor exato configurado para aquela notícia.
   * **Não existe mais botão para pular etapa sem pagar**: o sistema possui um radar automático que consulta o gateway a cada 4 segundos.
   * A tela de aprovação e o comprovante com protocolo oficial **só aparecem quando o Pix for realmente pago e compensado no Banco Central**.

---

## 💼 2. O Que Mudou para Você (Gestão no Painel Secreto)

O Painel Administrativo (`#admin`) agora centraliza toda a inteligência comercial e financeira do projeto:

### A. Preço Personalizado por Artigo
* Cada artigo pode ter uma taxa diferente. Você pode testar quais valores convertem melhor dependendo do assunto da notícia.
* **Ao criar ou editar um artigo**: há um campo específico chamado **Preço / Taxa Pix (R$)** onde você digita o valor desejado (ex: `15,00`, `19,90`, `27,50`).
* **Na lista de matérias**: você visualiza uma coluna com a etiqueta verde informando quanto cada artigo está cobrando.

### B. Rastreamento da Origem do Lead
* Toda vez que um cidadão preenche o formulário, o sistema registra exatamente:
  1. **Qual artigo ele estava lendo** quando decidiu se cadastrar.
  2. **Qual foi o valor cobrado** naquele artigo específico.
  3. **Os dados de contato** (Nome, CPF, WhatsApp, Estado).
  4. **O status financeiro** (`PAGO PIX` ou `AGUARDANDO PAGAMENTO`).

### C. Métricas Financeiras e Filtros em Tempo Real
Na aba **"Solicitações / Leads"**, você tem acesso a:
* **Cadastros Coletados**: total de pessoas que preencheram o formulário.
* **Pagamentos Pix Aprovados**: quantas pessoas pagaram de verdade.
* **Faturamento Total Recebido**: soma em reais (R$) de todo o dinheiro que já caiu via FreePay.
* **Taxa de Conversão**: porcentagem de cadastros que viraram pagamentos confirmados.
* **Filtro por Artigo de Origem**: selecione uma matéria específica no menu para ver apenas as pessoas que vieram dela.
* **Filtro por Status**: veja apenas quem pagou ou quem ainda está pendente.
* **Campo de Busca**: localize rapidamente qualquer pessoa pelo Nome, CPF, WhatsApp ou Protocolo.

---

## 🧭 3. Guia Rápido de Uso do Painel Secreto

### Como acessar o Painel de Controle:
1. Abra o navegador no endereço do seu site e adicione `#admin` no final da URL:
   * Local: `http://localhost:5173/#admin`
   * Online: `https://seusite.com/#admin`
2. Digite seu **UID de Administrador** (configurado no seu arquivo `.env.local`).
3. Clique em **Entrar no Painel**.

### Como alterar o preço de um artigo existente:
1. No painel, vá para a aba **"Artigos & Notícias"**.
2. Localize a matéria que deseja alterar e clique em **Editar**.
3. No campo **Preço / Taxa Pix (R$)**, altere para o novo valor (ex: `15,00`).
4. Clique em **Salvar Alterações no Artigo**.
5. Pronto! A partir desse momento, qualquer pessoa que clicar no formulário daquela matéria pagará o novo valor.

### Como acompanhar as vendas e leads:
1. No painel, clique na aba **"Solicitações / Leads"**.
2. Veja o faturamento total acumulado e a lista completa de pessoas com a matéria de origem de cada uma.
3. Se quiser ver só quem pagou, selecione no filtro de status a opção **"Somente Pagos Pix"**.

---

## 🛡️ 4. Segurança e Integridade

* **CORS e Comunicação**: A comunicação com o gateway FreePay e com o banco de dados Firebase está 100% blindada e rodando sem erros.
* **Validação de Pagamentos**: Somente confirmações autenticadas pelo gateway oficial liberam o status de `PAGO`.
* **Privacidade**: A rota administrativa não tem links públicos expostos para o visitante comum, ficando oculta e protegida por UID.
