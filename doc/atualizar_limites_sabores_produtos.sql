-- Atualizar limites de sabores para produtos existentes
-- Este script define quantos sabores o cliente pode escolher para cada produto

UPDATE produtos 
SET max_sabores = CASE 
    -- Produtos que permitem múltiplos sabores
    WHEN nome LIKE '%2 BOLAS%' THEN 2
    WHEN nome LIKE '%3 BOLAS%' THEN 3
    WHEN nome LIKE '%4 BOLAS%' THEN 4
    WHEN nome LIKE '%5 BOLAS%' THEN 5
    WHEN nome LIKE '%6 BOLAS%' THEN 6
    WHEN nome LIKE '%7 BOLAS%' THEN 7
    WHEN nome LIKE '%8 BOLAS%' THEN 8
    WHEN nome LIKE '%9 BOLAS%' THEN 9
    WHEN nome LIKE '%10 BOLAS%' THEN 10
    WHEN nome LIKE '%12 BOLAS%' THEN 12
    WHEN nome LIKE '%16 BOLAS%' THEN 16
    WHEN nome LIKE '%18 BOLAS%' THEN 18
    WHEN nome LIKE '%20 BOLAS%' THEN 20
    -- Produtos que permitem escolha livre
    WHEN nome LIKE '%Self-Service%' THEN 10
    WHEN nome LIKE '%Para viagem%' THEN 5
    -- Produtos específicos com múltiplos sabores
    WHEN nome LIKE '%SUNDAE%' THEN 3
    WHEN nome LIKE '%HULA-HULA%' THEN 3
    WHEN nome LIKE '%HULA-HULA TURBO%' THEN 5
    WHEN nome LIKE '%MORANGO SPLIT%' THEN 3
    WHEN nome LIKE '%BANANA SPLIT%' THEN 3
    WHEN nome LIKE '%MILK SHAKE GOURMET%' THEN 2
    WHEN nome LIKE '%TAÇA OVOMALTINE%' THEN 2
    WHEN nome LIKE '%TAÇA SONHO DE VALSA%' THEN 2
    WHEN nome LIKE '%TAÇA FRAGOLA%' THEN 2
    WHEN nome LIKE '%TAÇA DESEJO%' THEN 2
    WHEN nome LIKE '%Taça com creme de ninho%' THEN 2
    WHEN nome LIKE '%Taça com ouro branco%' THEN 2
    WHEN nome LIKE '%Taça com morangos%' THEN 2
    WHEN nome LIKE '%Taça com paçoca%' THEN 2
    WHEN nome LIKE '%Taça com pistache%' THEN 2
    WHEN nome LIKE '%Taça com creme de ninho e leite%' THEN 2
    WHEN nome LIKE '%Taça com granulé%' THEN 2
    WHEN nome LIKE '%Taça Doce de Leite com Banana%' THEN 2
    WHEN nome LIKE '%Taça Goma Fini%' THEN 3
    WHEN nome LIKE '%Taça com Brownie%' THEN 1
    WHEN nome LIKE '%Taça com Bolo Petit%' THEN 1
    WHEN nome LIKE '%Taça Salada de Frutas%' THEN 1
    WHEN nome LIKE '%Taça Festa%' THEN 2
    -- Produtos que permitem 2 sabores
    WHEN nome LIKE '%Copo M (02 sabores)%' THEN 2
    WHEN nome LIKE '%COPO 2 BOLAS%' THEN 2
    WHEN nome LIKE '%2 BOLAS%' THEN 2
    WHEN nome LIKE '%Cascão 2 bolas%' THEN 2
    WHEN nome LIKE '%Casquinha 2 bolas%' THEN 2
    WHEN nome LIKE '%VACA PRETA%' THEN 2
    -- Produtos que permitem 3 sabores
    WHEN nome LIKE '%Copo G (03 sabores)%' THEN 3
    WHEN nome LIKE '%COPO 3 BOLAS%' THEN 3
    WHEN nome LIKE '%3 BOLAS%' THEN 3
    -- Produtos que permitem 4 sabores
    WHEN nome LIKE '%4 BOLAS%' THEN 4
    -- Produtos que permitem 5 sabores
    WHEN nome LIKE '%5 BOLAS%' THEN 5
    -- Produtos que permitem 6 sabores
    WHEN nome LIKE '%6 BOLAS%' THEN 6
    -- Produtos que permitem 7 sabores
    WHEN nome LIKE '%7 BOLAS%' THEN 7
    -- Produtos que permitem 8 sabores
    WHEN nome LIKE '%8 BOLAS%' THEN 8
    -- Produtos que permitem 9 sabores
    WHEN nome LIKE '%9 BOLAS%' THEN 9
    -- Produtos que permitem 10 sabores
    WHEN nome LIKE '%10 BOLAS%' THEN 10
    -- Produtos que permitem 12 sabores
    WHEN nome LIKE '%12 BOLAS%' THEN 12
    -- Produtos que permitem 16 sabores
    WHEN nome LIKE '%16 BOLAS%' THEN 16
    -- Produtos que permitem 18 sabores
    WHEN nome LIKE '%18 BOLAS%' THEN 18
    -- Produtos que permitem 20 sabores
    WHEN nome LIKE '%20 BOLAS%' THEN 20
    -- Produtos que permitem 1 sabor (padrão)
    WHEN nome LIKE '%1 BOLA%' THEN 1
    WHEN nome LIKE '%Copo P (01 sabor)%' THEN 1
    WHEN nome LIKE '%COPO 1 BOLA%' THEN 1
    WHEN nome LIKE '%Cascão 1 bola%' THEN 1
    WHEN nome LIKE '%Casquinha 1 bola%' THEN 1
    WHEN nome LIKE '%COLEGIAL%' THEN 1
    WHEN nome LIKE '%Milkshake%' THEN 1
    WHEN nome LIKE '%Açaí%' THEN 1
    WHEN nome LIKE '%Adicional%' THEN 1
    ELSE 1 -- Padrão para produtos não especificados
END
WHERE max_sabores IS NULL OR max_sabores = 1;

-- Verificar os resultados
SELECT 
    nome,
    max_sabores,
    CASE 
        WHEN max_sabores = 1 THEN '1 sabor'
        WHEN max_sabores > 1 THEN max_sabores || ' sabores'
        ELSE 'Sem limite'
    END as limite_sabores
FROM produtos 
WHERE max_sabores > 1
ORDER BY max_sabores DESC, nome; 