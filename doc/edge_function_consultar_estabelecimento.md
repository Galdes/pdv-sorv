# 🏪 Edge Function: Consultar Estabelecimento

## 📋 Descrição
Edge Function para consultar dados de estabelecimentos no Supabase. Permite buscar estabelecimentos por ID, nome ou listar todos os ativos.

## 🔗 Endpoint
```
POST https://[PROJECT_REF].supabase.co/functions/v1/consultar-estabelecimento
```

## 📤 Request Body

### Buscar por ID específico:
```json
{
  "bar_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Buscar por nome (busca parcial):
```json
{
  "nome": "Sorveteria"
}
```

### Listar todos os estabelecimentos ativos:
```json
{
  "listar_todos": true
}
```

## 📥 Response

### Sucesso (200):
```json
{
  "total": 1,
  "estabelecimentos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "Sorveteria Conteiner",
      "endereco": "Av. João Gibran, 365 - Jardim Santa Edwiges, Viradouro - SP",
      "telefone": "(17) 99263-5053",
      "email": "joao@bar.com",
      "descricao": "Sorveteria Conteiner - Os melhores sabores artesanais",
      "ativo": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "created_at_formatado": "01/01/2024 às 00:00",
      "updated_at_formatado": "01/01/2024 às 00:00"
    }
  ],
  "mensagem": "Dados do estabelecimento Sorveteria Conteiner recuperados com sucesso."
}
```

### Erro (400/404/500):
```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes técnicos do erro"
}
```

## 🔧 Configuração no N8N

### 1. Criar novo HTTP Request node:
- **Method**: POST
- **URL**: `https://[PROJECT_REF].supabase.co/functions/v1/consultar-estabelecimento`
- **Headers**:
  ```
  Authorization: Bearer [SUPABASE_ANON_KEY]
  Content-Type: application/json
  ```

### 2. Body (JSON):
```json
{
  "bar_id": "{{ $json.bar_id }}"
}
```

### 3. Exemplo de uso no N8N:
```javascript
// Buscar estabelecimento específico
{
  "bar_id": "550e8400-e29b-41d4-a716-446655440000"
}

// Buscar por nome
{
  "nome": "Sorveteria"
}

// Listar todos
{
  "listar_todos": true
}
```

## 🎯 Casos de Uso

### Para o Agente IA:
1. **Informações do estabelecimento**: Nome, endereço, telefone, email
2. **Horário de funcionamento**: Pode ser incluído na descrição
3. **Dados institucionais**: Para responder perguntas sobre a sorveteria

### Exemplo de resposta do Agente:
```
"Olá! Sou da Sorveteria Conteiner, localizada na Av. João Gibran, 365 - Jardim Santa Edwiges, Viradouro - SP. 
Nosso telefone é (17) 99263-5053 e email joao@bar.com. 
Somos especializados em sorvetes artesanais com os melhores sabores!"
```

## 🚀 Deploy

1. Acesse o painel do Supabase
2. Vá para "Edge Functions"
3. Clique em "New Function"
4. Nome: `consultar-estabelecimento`
5. Cole o código do arquivo `supabase/functions/consultar-estabelecimento/index.ts`
6. Clique em "Deploy"

## 🔒 Segurança

- ✅ Apenas estabelecimentos ativos são retornados
- ✅ Validação de entrada obrigatória
- ✅ Tratamento de erros robusto
- ✅ CORS configurado para N8N 