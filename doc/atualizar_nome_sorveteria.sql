-- Atualizar o nome do estabelecimento para Sorveteria Conteiner
UPDATE bares 
SET nome = 'Sorveteria Conteiner',
    descricao = 'Sorveteria Conteiner - Os melhores sabores artesanais'
WHERE id = (SELECT id FROM bares LIMIT 1);

-- Atualizar usuários para refletir que é uma sorveteria
UPDATE usuarios 
SET nome = 'Dono da Sorveteria Conteiner'
WHERE email = 'dono@bar.com';

UPDATE usuarios 
SET nome = 'Atendente da Sorveteria Conteiner'
WHERE email = 'garcon@bar.com'; 