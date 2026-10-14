// Dados fictícios de protótipo.
// Nomes de Presidente e Ministros seguem o pedido original e podem não
// refletir a composição real e atual do governo. Secretários, prefeitos e
// vereadores são inteiramente fictícios (nomes e cidades inventados) para
// não atribuir dados de desempenho fictícios a pessoas reais específicas.
//
// A cadeia Presidente -> Ministros -> Secretários -> Prefeitos -> Vereadores
// é uma hierarquia CONCEITUAL para fins de visualização do protótipo, não a
// estrutura administrativa real da federação (prefeitos não respondem a
// secretários federais na prática).
//
// Este arquivo é a única fonte de dados da árvore. O formato foi desenhado
// para ser substituído por uma resposta de API no futuro sem alterar os
// componentes: cada nó tem { id, nome, cargo, partido?, foto, filhos, planos }.

export const STATUS = {
  CONCLUIDO: 'concluido',
  EM_ANDAMENTO: 'em_andamento',
  NAO_INICIADO: 'nao_iniciado',
  ABANDONADO: 'abandonado',
}

function plano(id, titulo, descricao, status, progresso, marcos) {
  return { id, titulo, descricao, status, progresso, marcos: marcos ?? null }
}

export const mandateTree = {
  id: 'lula',
  nome: 'Luiz Inácio Lula da Silva',
  cargo: 'Presidente da República',
  partido: 'PT',
  foto: null,
  planos: [
    plano(
      'lula-p1',
      'Erradicação da Fome e da Pobreza Extrema',
      'Fortalecimento de programas de transferência de renda e retirada do Brasil do Mapa da Fome da ONU.',
      STATUS.EM_ANDAMENTO,
      68,
      [
        { titulo: 'Relançamento do Bolsa Família', data: '2023-03', concluido: true },
        { titulo: 'Reativação do Conselho de Segurança Alimentar', data: '2023-05', concluido: true },
        { titulo: 'Saída do Mapa da Fome da ONU', data: '2026-12', concluido: false },
      ],
    ),
    plano(
      'lula-p2',
      'Reindustrialização e Neoindustrialização Verde',
      'Plano de retomada da indústria nacional com foco em transição energética e tecnologia.',
      STATUS.EM_ANDAMENTO,
      42,
      null,
    ),
    plano(
      'lula-p3',
      'Reconstrução do SUS e Ampliação do Acesso à Saúde',
      'Recomposição de recursos e infraestrutura do Sistema Único de Saúde após cortes anteriores.',
      STATUS.EM_ANDAMENTO,
      55,
      null,
    ),
    plano(
      'lula-p4',
      'Desmatamento Zero na Amazônia até 2030',
      'Meta de redução progressiva do desmatamento ilegal em todos os biomas brasileiros.',
      STATUS.EM_ANDAMENTO,
      61,
      [
        { titulo: 'Retomada da fiscalização ambiental', data: '2023-02', concluido: true },
        { titulo: 'Redução de 50% no desmatamento anual', data: '2025-12', concluido: true },
        { titulo: 'Desmatamento ilegal zero', data: '2030-12', concluido: false },
      ],
    ),
    plano(
      'lula-p5',
      'Reforma Tributária',
      'Simplificação de impostos sobre consumo e unificação de tributos federais, estaduais e municipais.',
      STATUS.CONCLUIDO,
      100,
      [
        { titulo: 'Aprovação da PEC da Reforma Tributária', data: '2023-12', concluido: true },
        { titulo: 'Regulamentação por lei complementar', data: '2024-12', concluido: true },
      ],
    ),
    plano(
      'lula-p6',
      'Novo Plano Nacional de Educação',
      'Ampliação de vagas em universidades e institutos federais e metas de alfabetização.',
      STATUS.NAO_INICIADO,
      0,
      null,
    ),
    plano(
      'lula-p7',
      'Gov.br 2.0 — Desburocratização Digital',
      'Unificação de serviços públicos digitais em uma plataforma única de atendimento ao cidadão.',
      STATUS.ABANDONADO,
      25,
      null,
    ),
  ],
  filhos: [
    {
      id: 'haddad',
      nome: 'Fernando Haddad',
      cargo: 'Ministro da Fazenda',
      partido: 'PT',
      foto: null,
      planos: [
        plano(
          'haddad-p1',
          'Novo Arcabouço Fiscal',
          'Nova regra de controle de gastos públicos para substituir o teto de gastos.',
          STATUS.CONCLUIDO,
          100,
          null,
        ),
        plano(
          'haddad-p2',
          'Regulamentação da Reforma Tributária',
          'Edição das leis complementares que detalham a cobrança do novo IVA dual (CBS/IBS).',
          STATUS.EM_ANDAMENTO,
          70,
          null,
        ),
        plano(
          'haddad-p3',
          'Redução Estrutural da Taxa de Juros',
          'Conjunto de medidas fiscais voltadas a reduzir a taxa de juros de equilíbrio da economia.',
          STATUS.EM_ANDAMENTO,
          30,
          null,
        ),
        plano(
          'haddad-p4',
          'Tributação de Fundos Exclusivos e Offshores',
          'Nova regra de tributação de altas rendas e grandes patrimônios financeiros.',
          STATUS.NAO_INICIADO,
          0,
          null,
        ),
      ],
      filhos: [
        {
          id: 'sec-haddad-1',
          nome: 'Roberto Carvalho Lima',
          cargo: 'Secretário de Política Econômica',
          partido: null,
          foto: null,
          planos: [
            plano('sec-haddad-1-p1', 'Monitoramento de Metas Fiscais', 'Acompanhamento trimestral do cumprimento do arcabouço fiscal.', STATUS.EM_ANDAMENTO, 72, null),
            plano('sec-haddad-1-p2', 'Revisão de Gastos Tributários', 'Mapeamento de renúncias fiscais com baixo retorno econômico.', STATUS.EM_ANDAMENTO, 38, null),
            plano('sec-haddad-1-p3', 'Simulador Público da Reforma Tributária', 'Ferramenta on-line para empresas simularem o novo sistema de impostos.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [
            {
              id: 'prefeito-campo-dourado',
              nome: 'Jorge Amaral Pinto',
              cargo: 'Prefeito de Campo Dourado',
              partido: 'MDB',
              foto: null,
              planos: [
                plano('prefeito-cd-p1', 'Reforma do Transporte Público Municipal', 'Renovação da frota de ônibus e criação de corredores exclusivos.', STATUS.EM_ANDAMENTO, 44, null),
                plano('prefeito-cd-p2', 'Programa Nota Fiscal Premiada Municipal', 'Incentivo à emissão de notas fiscais com sorteios para contribuintes.', STATUS.CONCLUIDO, 100, null),
                plano('prefeito-cd-p3', 'Requalificação do Centro Histórico', 'Restauração de fachadas e infraestrutura da área central da cidade.', STATUS.EM_ANDAMENTO, 57, null),
                plano('prefeito-cd-p4', 'Plano Municipal de Habitação Popular', 'Construção de unidades habitacionais para famílias de baixa renda.', STATUS.ABANDONADO, 20, null),
              ],
              filhos: [
                {
                  id: 'vereador-diego',
                  nome: 'Diego Nascimento Alves',
                  cargo: 'Vereador de Campo Dourado',
                  partido: 'PL',
                  foto: null,
                  planos: [
                    plano('vereador-diego-p1', 'Lei de Incentivo a Pequenos Comércios', 'Isenção temporária de taxas municipais para novos microempreendedores.', STATUS.CONCLUIDO, 100, null),
                    plano('vereador-diego-p2', 'Fiscalização de Obras Públicas', 'Comissão permanente de acompanhamento de contratos de obras municipais.', STATUS.EM_ANDAMENTO, 50, null),
                    plano('vereador-diego-p3', 'Projeto Cidade Mais Verde', 'Plantio de árvores nativas em praças e avenidas da cidade.', STATUS.NAO_INICIADO, 0, null),
                  ],
                  filhos: [],
                },
                {
                  id: 'vereadora-juliana',
                  nome: 'Juliana Moreira Castro',
                  cargo: 'Vereadora de Campo Dourado',
                  partido: 'PSOL',
                  foto: null,
                  planos: [
                    plano('vereadora-juliana-p1', 'Rede Municipal de Creches', 'Ampliação de vagas em creches públicas nos bairros periféricos.', STATUS.EM_ANDAMENTO, 65, null),
                    plano('vereadora-juliana-p2', 'Observatório Municipal de Preços', 'Monitoramento público de preços de alimentos em mercados da cidade.', STATUS.ABANDONADO, 15, null),
                    plano('vereadora-juliana-p3', 'Plano de Combate à Violência Doméstica', 'Rede municipal integrada de acolhimento a vítimas de violência doméstica.', STATUS.EM_ANDAMENTO, 48, null),
                  ],
                  filhos: [],
                },
              ],
            },
          ],
        },
        {
          id: 'sec-haddad-2',
          nome: 'Fernanda Antunes Reis',
          cargo: 'Secretária do Tesouro Nacional',
          partido: null,
          foto: null,
          planos: [
            plano('sec-haddad-2-p1', 'Modernização da Gestão da Dívida Pública', 'Plano de alongamento de prazos e redução do custo médio da dívida.', STATUS.EM_ANDAMENTO, 60, null),
            plano('sec-haddad-2-p2', 'Transparência de Gastos Federais em Tempo Real', 'Painel público com execução orçamentária atualizada diariamente.', STATUS.CONCLUIDO, 100, null),
            plano('sec-haddad-2-p3', 'Plano de Redução de Restos a Pagar', 'Diminuição do estoque de despesas empenhadas e não pagas.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
      ],
    },
    {
      id: 'nisia-trindade',
      nome: 'Nísia Trindade',
      cargo: 'Ministra da Saúde',
      partido: null,
      foto: null,
      planos: [
        plano(
          'nisia-p1',
          'Reconstrução do Programa Mais Médicos',
          'Retomada do programa de provimento de médicos em regiões vulneráveis e de difícil acesso.',
          STATUS.CONCLUIDO,
          100,
          null,
        ),
        plano(
          'nisia-p2',
          'Zerar a Fila de Cirurgias Eletivas no SUS',
          'Mutirões e financiamento extra para reduzir a espera por cirurgias não urgentes.',
          STATUS.EM_ANDAMENTO,
          54,
          null,
        ),
        plano(
          'nisia-p3',
          'Combate à Dengue e Arboviroses',
          'Plano nacional de vacinação, controle de vetores e resposta a surtos de dengue.',
          STATUS.EM_ANDAMENTO,
          77,
          [
            { titulo: 'Distribuição da vacina em capitais prioritárias', data: '2024-02', concluido: true },
            { titulo: 'Cobertura vacinal nacional', data: '2026-12', concluido: false },
          ],
        ),
        plano(
          'nisia-p4',
          'Prontuário Eletrônico Único do SUS',
          'Integração nacional dos registros de saúde entre unidades públicas.',
          STATUS.NAO_INICIADO,
          0,
          null,
        ),
      ],
      filhos: [
        {
          id: 'sec-saude-1',
          nome: 'Patrícia Lemos Azevedo',
          cargo: 'Secretária de Atenção Primária à Saúde',
          partido: null,
          foto: null,
          planos: [
            plano('sec-saude-1-p1', 'Mais Agentes de Saúde nas Periferias', 'Ampliação do número de agentes comunitários em áreas urbanas vulneráveis.', STATUS.EM_ANDAMENTO, 58, null),
            plano('sec-saude-1-p2', 'Requalificação de UBS', 'Reforma e modernização de Unidades Básicas de Saúde em todo o país.', STATUS.EM_ANDAMENTO, 33, null),
            plano('sec-saude-1-p3', 'Telemedicina para Áreas Remotas', 'Plataforma de consultas remotas para municípios sem especialistas.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [
            {
              id: 'prefeita-rio-manso',
              nome: 'Ana Beatriz Coutinho',
              cargo: 'Prefeita de Rio Manso',
              partido: 'PSD',
              foto: null,
              planos: [
                plano('prefeita-rm-p1', 'Saúde da Família 24h', 'Ampliação do horário de atendimento das Unidades Básicas de Saúde municipais.', STATUS.EM_ANDAMENTO, 62, null),
                plano('prefeita-rm-p2', 'Plano Municipal de Mobilidade Ciclável', 'Construção de ciclovias ligando bairros periféricos ao centro.', STATUS.EM_ANDAMENTO, 40, null),
                plano('prefeita-rm-p3', 'Reforma das Escolas Municipais', 'Recuperação da estrutura física de escolas de ensino fundamental.', STATUS.CONCLUIDO, 100, null),
                plano('prefeita-rm-p4', 'Parque Linear do Rio Manso', 'Urbanização das margens do rio com áreas de lazer e preservação.', STATUS.NAO_INICIADO, 0, null),
              ],
              filhos: [
                {
                  id: 'vereador-lucas',
                  nome: 'Lucas Tavares Mendes',
                  cargo: 'Vereador de Rio Manso',
                  partido: 'PSDB',
                  foto: null,
                  planos: [
                    plano('vereador-lucas-p1', 'Iluminação Pública em LED', 'Substituição de toda a iluminação pública por lâmpadas de LED.', STATUS.CONCLUIDO, 100, null),
                    plano('vereador-lucas-p2', 'Programa Jovem Aprendiz Municipal', 'Vagas de estágio remunerado para jovens do ensino médio público.', STATUS.EM_ANDAMENTO, 55, null),
                    plano('vereador-lucas-p3', 'Lei de Dados Abertos Municipais', 'Publicação obrigatória de contratos e gastos em portal de dados abertos.', STATUS.NAO_INICIADO, 0, null),
                  ],
                  filhos: [],
                },
                {
                  id: 'vereadora-camila',
                  nome: 'Camila Ferreira Dutra',
                  cargo: 'Vereadora de Rio Manso',
                  partido: 'PT',
                  foto: null,
                  planos: [
                    plano('vereadora-camila-p1', 'Centro de Referência da Mulher', 'Criação de unidade municipal de apoio psicológico e jurídico a mulheres.', STATUS.CONCLUIDO, 100, null),
                    plano('vereadora-camila-p2', 'Feiras Livres Sustentáveis', 'Incentivo a feiras de produtores locais com redução de uso de plástico.', STATUS.EM_ANDAMENTO, 47, null),
                    plano('vereadora-camila-p3', 'Plano de Combate à Evasão Escolar', 'Busca ativa de crianças e adolescentes fora da escola.', STATUS.ABANDONADO, 30, null),
                  ],
                  filhos: [],
                },
              ],
            },
          ],
        },
        {
          id: 'sec-saude-2',
          nome: 'Marcelo Figueiredo Nunes',
          cargo: 'Secretário de Vigilância em Saúde',
          partido: null,
          foto: null,
          planos: [
            plano('sec-saude-2-p1', 'Rede Nacional de Alerta de Surtos', 'Sistema integrado de monitoramento de doenças infecciosas em tempo real.', STATUS.EM_ANDAMENTO, 66, null),
            plano('sec-saude-2-p2', 'Ampliação do Calendário de Vacinação', 'Inclusão de novas vacinas no calendário nacional do SUS.', STATUS.CONCLUIDO, 100, null),
            plano('sec-saude-2-p3', 'Plano de Combate à Resistência Microbiana', 'Protocolo nacional de uso racional de antibióticos em hospitais públicos.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
      ],
    },
    {
      id: 'camilo-santana',
      nome: 'Camilo Santana',
      cargo: 'Ministro da Educação',
      partido: 'PT',
      foto: null,
      planos: [
        plano(
          'camilo-p1',
          'Reconstrução do Fundeb',
          'Recomposição e ampliação da complementação da União ao Fundo de Manutenção da Educação Básica.',
          STATUS.CONCLUIDO,
          100,
          null,
        ),
        plano(
          'camilo-p2',
          'Pé-de-Meia',
          'Poupança incentivada para estudantes de baixa renda concluírem o ensino médio.',
          STATUS.EM_ANDAMENTO,
          82,
          [
            { titulo: 'Lançamento do programa', data: '2024-03', concluido: true },
            { titulo: 'Primeiro ciclo de pagamentos concluído', data: '2024-12', concluido: true },
            { titulo: 'Cobertura de todas as redes estaduais', data: '2026-12', concluido: false },
          ],
        ),
        plano(
          'camilo-p3',
          'Novo Ensino Médio Reformulado',
          'Revisão da reforma do ensino médio após consulta a estados e escolas.',
          STATUS.EM_ANDAMENTO,
          45,
          null,
        ),
        plano(
          'camilo-p4',
          'Expansão de Institutos Federais',
          'Construção de novos campi de institutos federais em municípios do interior.',
          STATUS.ABANDONADO,
          18,
          null,
        ),
      ],
      filhos: [
        {
          id: 'sec-edu-1',
          nome: 'Renata Prado Siqueira',
          cargo: 'Secretária de Educação Básica',
          partido: null,
          foto: null,
          planos: [
            plano('sec-edu-1-p1', 'Escola em Tempo Integral', 'Expansão de matrículas em escolas de ensino fundamental em jornada integral.', STATUS.EM_ANDAMENTO, 51, null),
            plano('sec-edu-1-p2', 'Alfabetização na Idade Certa', 'Meta nacional de alfabetização até o 2º ano do ensino fundamental.', STATUS.EM_ANDAMENTO, 73, null),
            plano('sec-edu-1-p3', 'Merenda Escolar 100% Orgânica', 'Substituição progressiva de insumos por produtos orgânicos da agricultura familiar.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
        {
          id: 'sec-edu-2',
          nome: 'Thiago Barbosa Correia',
          cargo: 'Secretário de Educação Superior',
          partido: null,
          foto: null,
          planos: [
            plano('sec-edu-2-p1', 'Reserva de Vagas em Universidades Federais', 'Ampliação de cotas sociais e raciais em processos seletivos federais.', STATUS.CONCLUIDO, 100, null),
            plano('sec-edu-2-p2', 'Programa de Bolsas de Permanência', 'Bolsas para estudantes de baixa renda permanecerem na universidade.', STATUS.EM_ANDAMENTO, 59, null),
            plano('sec-edu-2-p3', 'Novos Campi do Interior', 'Expansão de unidades universitárias federais fora das capitais.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
      ],
    },
    {
      id: 'marina-silva',
      nome: 'Marina Silva',
      cargo: 'Ministra do Meio Ambiente e Mudança do Clima',
      partido: 'REDE',
      foto: null,
      planos: [
        plano(
          'marina-p1',
          'Redução do Desmatamento na Amazônia',
          'Combate ao desmatamento ilegal por meio de fiscalização e inteligência de satélite.',
          STATUS.EM_ANDAMENTO,
          58,
          null,
        ),
        plano(
          'marina-p2',
          'Recriação do Fundo Amazônia',
          'Retomada de doações internacionais para projetos de preservação na Amazônia.',
          STATUS.CONCLUIDO,
          100,
          null,
        ),
        plano(
          'marina-p3',
          'Transição Energética Justa',
          'Plano de substituição gradual de combustíveis fósseis com proteção de empregos.',
          STATUS.EM_ANDAMENTO,
          35,
          null,
        ),
        plano(
          'marina-p4',
          'Zoneamento Ecológico-Econômico Nacional',
          'Mapeamento nacional de áreas aptas a atividades econômicas e de preservação.',
          STATUS.NAO_INICIADO,
          0,
          null,
        ),
        plano(
          'marina-p5',
          'Taxação de Emissões de Carbono',
          'Criação de mercado regulado de carbono com precificação de emissões industriais.',
          STATUS.ABANDONADO,
          22,
          null,
        ),
      ],
      filhos: [
        {
          id: 'sec-ma-1',
          nome: 'Bruno Castelo Ramos',
          cargo: 'Secretário de Mudança do Clima',
          partido: null,
          foto: null,
          planos: [
            plano('sec-ma-1-p1', 'Plano Nacional de Adaptação Climática', 'Estratégias municipais de resposta a enchentes, secas e ondas de calor.', STATUS.EM_ANDAMENTO, 44, null),
            plano('sec-ma-1-p2', 'Inventário Nacional de Emissões', 'Atualização anual do inventário de gases de efeito estufa do país.', STATUS.CONCLUIDO, 100, null),
            plano('sec-ma-1-p3', 'Fundo Clima para Pequenos Municípios', 'Linha de financiamento climático para municípios de baixa capacidade técnica.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
        {
          id: 'sec-ma-2',
          nome: 'Letícia Gusmão Farias',
          cargo: 'Secretária de Biodiversidade',
          partido: null,
          foto: null,
          planos: [
            plano('sec-ma-2-p1', 'Ampliação de Unidades de Conservação', 'Criação de novas áreas protegidas em biomas pouco representados.', STATUS.EM_ANDAMENTO, 37, null),
            plano('sec-ma-2-p2', 'Combate à Biopirataria', 'Fiscalização do tráfico de espécies nativas e material genético.', STATUS.EM_ANDAMENTO, 52, null),
            plano('sec-ma-2-p3', 'Corredores Ecológicos entre Biomas', 'Conexão de fragmentos florestais para preservar rotas de fauna nativa.', STATUS.ABANDONADO, 12, null),
          ],
          filhos: [],
        },
        {
          id: 'sec-ma-3',
          nome: 'Eduardo Vilhena Costa',
          cargo: 'Secretário de Florestas',
          partido: null,
          foto: null,
          planos: [
            plano('sec-ma-3-p1', 'Concessões Florestais Sustentáveis', 'Expansão de concessões de manejo florestal sustentável em florestas públicas.', STATUS.EM_ANDAMENTO, 41, null),
            plano('sec-ma-3-p2', 'Restauração de Áreas Degradadas', 'Plantio de mudas nativas em áreas degradadas por mineração e pecuária.', STATUS.NAO_INICIADO, 0, null),
            plano('sec-ma-3-p3', 'Cadastro Nacional de Imóveis Rurais Sustentáveis', 'Selo público para propriedades rurais com manejo ambiental regular.', STATUS.CONCLUIDO, 100, null),
          ],
          filhos: [],
        },
      ],
    },
    {
      id: 'flavio-dino',
      nome: 'Flávio Dino',
      cargo: 'Ministro da Justiça e Segurança Pública',
      partido: null,
      foto: null,
      planos: [
        plano(
          'dino-p1',
          'Plano Nacional de Segurança Pública',
          'Estratégia federal de apoio a estados no combate ao crime organizado.',
          STATUS.EM_ANDAMENTO,
          63,
          null,
        ),
        plano(
          'dino-p2',
          'Reforma do Sistema Penitenciário Federal',
          'Ampliação de vagas e melhoria das condições em presídios federais.',
          STATUS.EM_ANDAMENTO,
          40,
          null,
        ),
        plano(
          'dino-p3',
          'Unificação de Dados de Segurança Pública',
          'Integração de bases de dados de segurança entre União e estados.',
          STATUS.CONCLUIDO,
          100,
          null,
        ),
        plano(
          'dino-p4',
          'Combate a Milícias e Facções',
          'Operações federais integradas contra milícias e facções armadas.',
          STATUS.EM_ANDAMENTO,
          48,
          null,
        ),
      ],
      filhos: [
        {
          id: 'sec-jus-1',
          nome: 'Vanessa Rocha Monteiro',
          cargo: 'Secretária Nacional de Segurança Pública',
          partido: null,
          foto: null,
          planos: [
            plano('sec-jus-1-p1', 'Força-Tarefa contra o Crime Organizado', 'Operações conjuntas entre polícias federal e estaduais.', STATUS.EM_ANDAMENTO, 56, null),
            plano('sec-jus-1-p2', 'Programa Nacional de Bodycams', 'Distribuição de câmeras corporais para policiais militares estaduais.', STATUS.EM_ANDAMENTO, 29, null),
            plano('sec-jus-1-p3', 'Central Única de Emergência 190/192/193', 'Integração dos números de emergência em uma central nacional.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
        {
          id: 'sec-jus-2',
          nome: 'Caio Resende Barros',
          cargo: 'Secretário Nacional do Consumidor',
          partido: null,
          foto: null,
          planos: [
            plano('sec-jus-2-p1', 'Cadastro Nacional de Reclamações Fundamentadas', 'Base pública unificada de reclamações contra empresas.', STATUS.CONCLUIDO, 100, null),
            plano('sec-jus-2-p2', 'Regulação de Golpes Digitais e Pix', 'Novas regras de segurança para transações digitais instantâneas.', STATUS.EM_ANDAMENTO, 67, null),
            plano('sec-jus-2-p3', 'Simplificação de Contratos de Adesão', 'Padronização de linguagem em contratos de serviços essenciais.', STATUS.NAO_INICIADO, 0, null),
          ],
          filhos: [],
        },
      ],
    },
  ],
}
