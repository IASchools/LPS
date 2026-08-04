# IA Schools — Ordem de Produção dos Funis 2026

**Status:** estratégia aprovada; implementação, integrações e publicação ainda não executadas.  
**Objetivo deste documento:** permitir que Growth, CRM, Vendas, Operações, Tecnologia e Suporte executem os funis sem inventar etapas durante a produção.

## 1. Os dois funis, em uma linha

| Produto | Caminho principal | Conversão final |
|---|---|---|
| Workshop presencial | Anúncio → LP → diagnóstico → qualificação → pagamento → evento → reunião com a escola | Reunião comercial pós-evento |
| Universidade IA Schools | Anúncio → LP → checkout Asaas → acesso → ativação → conclusão | Matrícula individual; rota secundária para equipe |

**Não misturar os funis.** Workshop vende uma experiência presencial para gestores e abre uma conversa institucional. Universidade vende matrícula individual diretamente; “matricular minha equipe” abre atendimento comercial separado.

## 2. Regras que valem para tudo

1. **Pagamento é a fonte da verdade.** Clique no botão não significa venda. A mudança para `pago` só ocorre após confirmação do Asaas.
2. **Cada pessoa e cada cobrança têm um identificador único.** Reenvio do mesmo webhook não pode duplicar matrícula, mensagem, acesso ou conversão.
3. **Toda automação tem exclusões.** Pago sai das cobranças; reembolsado sai da jornada ativa; descadastrado sai do canal correspondente; reunião agendada sai da prospecção.
4. **WhatsApp exige consentimento registrável.** Fora da janela de 24 horas após mensagem do usuário, usar modelo previamente aprovado pela Meta. Todo fluxo oferece saída e atendimento humano.
5. **E-mail e WhatsApp não repetem tudo.** E-mail guarda detalhes; WhatsApp é usado para ação urgente, confirmação e ajuda.
6. **Escassez só pode refletir o estoque real.** “Últimas vagas” e contadores param automaticamente quando a capacidade acabar.
7. **UTMs atravessam o funil.** Origem, campanha, conjunto, anúncio e conteúdo permanecem ligados ao contato e à compra.
8. **Nada de anúncio com prova não comprovada.** Depoimentos, números, parceiros e certificações só entram depois de validação documental.

---

# FUNIL A — WORKSHOP PRESENCIAL

## 3. Oferta aprovada

- **Evento:** 17 de agosto de 2026, Ways Bilingual School, São Paulo.
- **Público:** mantenedores, diretores, coordenadores e gestores escolares. Não direcionar para professor buscando formação de sala de aula.
- **Preço individual:** R$ 290.
- **Dupla da mesma escola:** R$ 400.
- **Capacidade de campanha:** últimas 18 vagas, ligada ao estoque real.
- **Regra central:** preencher o diagnóstico não reserva vaga; somente pagamento confirmado reserva.
- **Próximo passo após o evento:** agendar diagnóstico/reunião comercial da escola.

## 4. Páginas e formulários — Workshop (5)

| ID | Entrega | Função | CTA/saída | Situação |
|---|---|---|---|---|
| W-LP-01 | Landing page do Workshop | Explicar para quem é, resultado, agenda, local, preços e vagas | `Quero participar` | Existe em `public/workshop`; revisar conteúdo e rastreamento |
| W-FM-01 | Diagnóstico YayForms | Qualificar gestor e escola sem prometer reserva | `Enviar diagnóstico` | Existe; revisar campos, consentimentos e retorno |
| W-PG-01 | Checkout/pagamento | Cobrar individual ou dupla e identificar participantes | `Pagar e reservar` | Necessário confirmar/criar destino canônico |
| W-TY-01 | Confirmação pós-pagamento | Confirmar reserva e próximos passos | `Adicionar à agenda` / enviar dados da dupla | Necessário |
| W-BK-01 | Agenda da reunião escolar | Marcar diagnóstico comercial pós-evento | `Escolher horário` | Reutilizar agenda existente, se houver |

### Conteúdo obrigatório da W-LP-01

- Data, horário, endereço completo e política de participação.
- “Para quem é” e “para quem não é”.
- O que o gestor leva pronto ao final.
- Agenda objetiva do encontro.
- Individual R$ 290 e dupla da mesma escola R$ 400.
- Vagas restantes vindas da mesma fonte de estoque do checkout.
- Aviso visível: diagnóstico não reserva; pagamento reserva.
- Consentimentos separados para e-mail e WhatsApp, com link de privacidade.
- FAQ: dupla, substituição de participante, cancelamento, nota/recibo, estacionamento e acessibilidade.

## 5. Anúncios — Workshop (9)

| ID | Etapa/público | Ideia central | CTA | Parar/excluir quando |
|---|---|---|---|---|
| W-AD-01 | Público frio: gestores escolares | “Sua escola já tem uma política prática para IA?” | Conhecer o Workshop | Diagnóstico enviado ou visita recente entra no retargeting |
| W-AD-02 | Público frio | Mostrar o plano/entregável que o gestor leva do encontro | Ver agenda | Diagnóstico enviado |
| W-AD-03 | Público frio | “Feito para quem decide a estratégia da escola — não é curso de ferramenta para professor” | Ver se é para mim | Diagnóstico enviado |
| W-AD-04 | Público frio/morno | Autoridade, anfitrião e evidência real do encontro | Conhecer o Workshop | Usar apenas provas aprovadas |
| W-AD-05 | Escolas com mais de um decisor | “Venham em dupla: R$ 400 pela mesma escola” | Inscrever a escola | Pagamento confirmado |
| W-AD-06 | Retarget: visitou LP, não abriu formulário | Reforçar resultado e data | Fazer diagnóstico | Formulário iniciado/enviado |
| W-AD-07 | Retarget: iniciou, não enviou | “Faltou concluir seu diagnóstico” | Continuar | Envio concluído ou opt-out |
| W-AD-08 | Retarget: qualificado, não pagou | Pagamento é o que garante a vaga | Reservar vaga | Pago, expirado sem estoque ou opt-out |
| W-AD-09 | Retarget final | Últimas vagas reais + prazo operacional | Garantir vaga | Pago ou estoque zero |

### Pacote criativo por conceito

Para cada ID: 1 vídeo vertical de 20–35s, 1 imagem 4:5 e 1 variação de abertura. Produzir uma segunda variação somente após dados suficientes; não fabricar dezenas de peças antes do primeiro aprendizado.

## 6. E-mails — Workshop (18)

| ID | Quando dispara | Assunto/objetivo | CTA | Não enviar se |
|---|---|---|---|---|
| W-E01 | Formulário iniciado e não enviado por 2h | “Faltou concluir seu diagnóstico” | Retomar formulário | Enviado, opt-out ou sem consentimento |
| W-E02 | Diagnóstico enviado | Confirmar recebimento e dizer que vaga ainda não está reservada | Aguardar análise | Opt-out |
| W-E03 | Perfil não elegível | Responder com respeito e indicar alternativa pertinente, se existir | Conhecer alternativa | Qualificado ou opt-out |
| W-E04 | Perfil qualificado | Aprovação + preço + link de pagamento + prazo | Pagar e reservar | Pago, sem estoque ou opt-out |
| W-E05 | 24h após W-E04 sem pagamento | Lembrar que diagnóstico não reserva | Finalizar pagamento | Pago, sem estoque ou opt-out |
| W-E06 | Cobrança falhou/expirou | Explicar como tentar novamente e oferecer ajuda | Tentar novamente | Pago, cancelado ou opt-out |
| W-E07 | Pagamento confirmado | Confirmação, recibo, ingresso/reserva e próximos passos | Adicionar à agenda | Reembolsado |
| W-E08 | Compra em dupla com segundo participante ausente | Pedir nome, e-mail, telefone e cargo da segunda pessoa | Completar dupla | Dados completos, reembolso ou opt-out |
| W-E09 | D-7 para pagos | Logística completa, preparação e o que levar | Confirmar presença | Reembolsado ou substituído |
| W-E10 | D-1 para pagos | Lembrete curto com horário, endereço e contato | Ver rota/agenda | Reembolsado ou substituído |
| W-E11 | Reembolso/cancelamento confirmado | Confirmar cancelamento, valor e prazo aplicável | Falar com suporte | — |
| W-E12 | Presente, até 3h após evento | Agradecimento + materiais prometidos | Acessar materiais | Marcado como ausente |
| W-E13 | Ausente, até 3h após evento | Reconhecer ausência e indicar próximo caminho real | Falar com equipe | Presente ou opt-out |
| W-E14 | Presente, D+1 | Convidar para diagnóstico/reunião da escola | Agendar reunião | Reunião marcada, não elegível ou opt-out |
| W-E15 | Reunião marcada, 24h antes | Confirmar agenda, participantes e preparação | Confirmar/remarcar | Cancelada ou concluída |
| W-E16 | Qualificado, mas estoque zerou antes do pagamento | Informar esgotamento sem criar falsa reserva | Entrar na lista de interesse | Vaga voltou, pago ou opt-out |
| W-E17 | Pedido de cancelamento/reembolso recebido | Confirmar protocolo, regra e prazo de resposta | Acompanhar solicitação | — |
| W-E18 | Evento alterado/cancelado pela organização | Informar mudança, opções e suporte | Confirmar opção | Somente pessoas afetadas |

## 7. WhatsApps — Workshop (14)

| ID | Quando dispara | Mensagem/função | CTA | Não enviar se |
|---|---|---|---|---|
| W-W01 | Diagnóstico enviado | Confirmar recebimento; esclarecer que ainda não há reserva | Aguardar análise | Sem opt-in WA ou opt-out |
| W-W02 | Perfil qualificado | Avisar aprovação e levar ao pagamento | Reservar vaga | Pago, sem estoque, sem opt-in ou opt-out |
| W-W03 | 24h sem pagamento | Lembrete único de vaga não reservada | Finalizar pagamento | Pago, sem estoque ou opt-out |
| W-W04 | Pagamento falhou/expirou | Oferecer nova tentativa ou atendimento humano | Tentar novamente | Pago, cancelado ou opt-out |
| W-W05 | Pagamento confirmado | Confirmar reserva e data | Adicionar à agenda | Reembolsado |
| W-W06 | Compra dupla incompleta | Coletar dados da segunda pessoa | Completar dupla | Completa, reembolsada ou opt-out |
| W-W07 | D-1 | Horário, endereço, chegada e suporte | Confirmar presença | Reembolsado/substituído/opt-out |
| W-W08 | Manhã do evento | Lembrete operacional curto | Abrir rota | Reembolsado/substituído/opt-out |
| W-W09 | Ausente após encerramento | Perguntar se precisa de ajuda e indicar caminho real | Falar com equipe | Presente ou opt-out |
| W-W10 | Presente, D+1 | Convidar para reunião da escola | Agendar | Já agendou, não elegível ou opt-out |
| W-W11 | Reunião, 2h antes | Lembrete e link/local | Participar/remarcar | Cancelada ou concluída |
| W-W12 | Reembolso confirmado | Confirmação curta + suporte | Falar com suporte | Sem opt-in; nesse caso manter e-mail transacional |
| W-W13 | Estoque zerou antes do pagamento | Avisar esgotamento e impedir nova cobrança | Lista de interesse | Sem opt-in, pago ou opt-out |
| W-W14 | Evento alterado/cancelado | Alerta operacional urgente, após o e-mail detalhado | Ver opções/suporte | Sem opt-in ou pessoa não afetada |

**Cadência máxima recomendada:** não enviar W-E e W-W equivalentes no mesmo minuto. E-mail primeiro para detalhes; WhatsApp 15–60 minutos depois quando a ação for urgente.

## 8. Estados e donos — Workshop

| Estado no CRM | Entrada | Próxima ação | Dono | Saída |
|---|---|---|---|---|
| `visitante` | LP carregada com consentimento de medição | Retarget | Growth | formulário iniciado |
| `formulario_abandonado` | início sem envio | W-E01/W-AD-07 | CRM/Growth | enviado ou opt-out |
| `diagnostico_recebido` | envio completo | W-E02/W-W01 + análise | CRM/Vendas | qualificado/não elegível |
| `nao_elegivel` | regra ou avaliação | W-E03 | Vendas | encerrado ou rota alternativa |
| `qualificado_nao_pago` | aprovado | W-E04/W-W02 + cobrança | Vendas/CRM | pago, expirado ou sem estoque |
| `pagamento_falhou` | retorno do Asaas | W-E06/W-W04 | Financeiro/CRM | pago ou cancelado |
| `pago` | confirmação Asaas | W-E07/W-W05 | Financeiro/Ops | cancelado ou participante confirmado |
| `dupla_incompleta` | pagamento dupla sem cadastro 2 | W-E08/W-W06 | Operações | dupla completa |
| `confirmado_evento` | dados completos | logística | Operações | presente/ausente |
| `presente` | check-in | W-E12; convite D+1 | Operações/Vendas | reunião marcada/encerrado |
| `ausente` | sem check-in | W-E13/W-W09 | Operações | atendimento/encerrado |
| `reuniao_marcada` | agenda confirmada | W-E15/W-W11 | Vendas | realizada/cancelada |
| `reembolsado` | confirmação financeira | W-E11/W-W12 e exclusão geral | Financeiro | encerrado |

---

# FUNIL B — UNIVERSIDADE IA SCHOOLS

## 9. Oferta aprovada

- **Preço oficial:** 12x de R$ 149.
- **Venda principal:** matrícula direta pelo checkout Asaas, sem diagnóstico prévio.
- **Rota secundária:** `Quero matricular minha equipe` → atendimento comercial.
- **Informações hoje presentes na página e que exigem revisão final de prova/consistência:** 64 horas, 100% online, 3 módulos, mentoria ao vivo, acesso vitalício ao conteúdo, garantia de 7 dias e certificação divulgada como reconhecida pelo MEC.

## 10. Páginas e destinos — Universidade (5)

| ID | Entrega | Função | CTA/saída | Situação |
|---|---|---|---|---|
| U-LP-01 | Landing page Universidade | Explicar transformação, currículo, suporte, preço e garantia | `Matricule-se agora` | Existe em `apps/universidade`; corrigir consistência de preço |
| U-CK-01 | Checkout Asaas | Receber pagamento | `Finalizar matrícula` | Link existente; configurar retornos e webhooks |
| U-TY-01 | Página de sucesso | Confirmar pagamento recebido/processando e explicar acesso | `Acessar meus próximos passos` | Necessário |
| U-AC-01 | Destino de acesso | Login/criação de senha e início do curso | `Começar agora` | Plataforma/destino precisam ser confirmados |
| U-TM-01 | Formulário/agenda para equipes | Coletar escola, quantidade, decisor e prazo | `Falar sobre minha equipe` | Necessário |

### Conteúdo obrigatório da U-LP-01

- Resultado profissional e pedagógico concreto, sem promessa genérica de “dominar IA”.
- Grade, carga horária, formato e funcionamento da mentoria.
- Para quem é e pré-requisitos.
- Preço oficial 12x R$ 149 em todos os pontos, sem flash de valor antigo.
- Garantia e condições em linguagem clara.
- Prova documental antes de usar a alegação de reconhecimento pelo MEC em anúncio.
- CTA individual principal e CTA de equipe secundário, visualmente distintos.
- FAQ: acesso, duração, certificado, mentoria, suporte, pagamento, garantia e equipe.
- Consentimentos separados para e-mail e WhatsApp.

## 11. Anúncios — Universidade (8)

| ID | Etapa/público | Ideia central | CTA | Parar/excluir quando |
|---|---|---|---|---|
| U-AD-01 | Público frio | Transformar IA em prática educacional aplicável | Conhecer a formação | Comprou ou iniciou checkout |
| U-AD-02 | Público frio | Mostrar currículo e o que será capaz de fazer | Ver formação | Comprou ou iniciou checkout |
| U-AD-03 | Público frio/morno | Certificação e credenciais | Ver detalhes | Só publicar após prova jurídica/documental |
| U-AD-04 | Público frio/morno | Mentoria e suporte humano como redução de risco | Conhecer suporte | Comprou |
| U-AD-05 | Objeção de tempo | 100% online, jornada estruturada e aplicável | Ver como funciona | Comprou |
| U-AD-06 | Retarget: LP sem checkout | Reforçar transformação, grade e garantia | Matricular-se | Checkout iniciado, comprou ou opt-out |
| U-AD-07 | Retarget: checkout sem compra | Retomar matrícula e resolver falha/dúvida | Continuar checkout | Pago, reembolsado ou opt-out |
| U-AD-08 | Gestores/escolas | Formação para equipe com atendimento comercial | Matricular minha equipe | Lead de equipe enviado ou opt-out |

## 12. E-mails — Universidade (20)

| ID | Quando dispara | Assunto/objetivo | CTA | Não enviar se |
|---|---|---|---|---|
| U-E01 | Checkout iniciado sem pagamento por 2h | Retomar matrícula | Continuar checkout | Pago, cancelado ou opt-out |
| U-E02 | Cobrança pendente | Explicar status e prazo | Ver pagamento | Pago, expirado ou opt-out |
| U-E03 | Pagamento falhou/expirou | Nova tentativa + suporte | Tentar novamente | Pago, cancelado ou opt-out |
| U-E04 | Pagamento confirmado | Recibo e confirmação da matrícula | Ver próximos passos | Reembolsado |
| U-E05 | Acesso provisionado | Login, senha e primeiro passo | Acessar curso | Acesso revogado |
| U-E06 | Pago, mas acesso não criado em 15 min | Reconhecer problema e abrir atendimento prioritário | Falar com suporte | Acesso entregue ou reembolsado |
| U-E07 | Sem primeiro login em 24h | Ajuda para entrar | Acessar curso | Já entrou, reembolsado ou opt-out |
| U-E08 | Sem primeiro login em 72h | Segunda e última ajuda de ativação | Resolver acesso | Já entrou, reembolsado ou opt-out |
| U-E09 | Primeiro login concluído | Orientar primeira semana e marco inicial | Começar módulo 1 | Reembolsado ou opt-out |
| U-E10 | 7 dias sem atividade | Retomar do ponto correto | Continuar aula | Voltou, concluiu, reembolsado ou opt-out |
| U-E11 | 14 dias sem atividade | Oferecer plano de retomada e ajuda humana | Retomar com ajuda | Voltou, concluiu, reembolsado ou opt-out |
| U-E12 | 24h antes de mentoria inscrita | Data, horário, link e preparação | Adicionar à agenda | Cancelou inscrição ou reembolsou |
| U-E13 | Pedido de garantia/reembolso recebido | Confirmar protocolo e próximos passos | Acompanhar solicitação | — |
| U-E14 | Reembolso concluído | Confirmar valor/prazo e encerramento de acesso | Falar com suporte | — |
| U-E15 | Curso concluído | Orientar emissão/consulta do certificado | Acessar certificado | Pendência acadêmica/financeira |
| U-E16 | Após conclusão/certificado | Coletar feedback e, só depois, convite de indicação | Avaliar experiência | Opt-out ou problema aberto |
| U-E17 | Formulário de equipe enviado | Confirmar recebimento e prazo de contato | Agendar conversa | Reunião já marcada ou opt-out |
| U-E18 | Pedido de reembolso negado após análise | Informar decisão, fundamento e canal de contestação | Falar com suporte | Reembolso aprovado |
| U-E19 | Mentoria alterada/cancelada | Informar nova data/opções e atualizar agenda | Ver nova agenda | Somente inscritos afetados |
| U-E20 | Conclusão solicitada com pendência | Explicar exatamente o requisito que falta para o certificado | Resolver pendência | Certificado liberado |

## 13. WhatsApps — Universidade (13)

| ID | Quando dispara | Mensagem/função | CTA | Não enviar se |
|---|---|---|---|---|
| U-W01 | Checkout abandonado por 2h | Retomar ou tirar dúvida | Continuar matrícula | Sem opt-in, pago ou opt-out |
| U-W02 | Cobrança pendente | Lembrete do status/prazo | Ver pagamento | Sem opt-in, pago, expirado ou opt-out |
| U-W03 | Pagamento falhou | Nova tentativa ou humano | Tentar novamente | Sem opt-in, pago ou opt-out |
| U-W04 | Pagamento confirmado | Confirmação curta; avisar que acesso chega por e-mail | Ver próximos passos | Sem opt-in ou reembolsado |
| U-W05 | Pago sem acesso em 15 min | Atendimento prioritário | Resolver agora | Sem opt-in, acesso entregue ou reembolsado |
| U-W06 | Sem primeiro login em 72h | Ajuda de ativação | Acessar/obter ajuda | Sem opt-in, já entrou ou opt-out |
| U-W07 | 2h antes de mentoria inscrita | Link e lembrete | Entrar na mentoria | Sem opt-in, cancelou ou reembolsou |
| U-W08 | 14 dias sem atividade | Retomada com ajuda humana | Montar retomada | Sem opt-in, voltou, concluiu ou opt-out |
| U-W09 | Reembolso concluído | Confirmação curta | Falar com suporte | Sem opt-in |
| U-W10 | Curso concluído | Parabéns + certificado | Acessar certificado | Sem opt-in ou pendência |
| U-W11 | Interesse em equipe | Confirmar contato comercial | Agendar conversa | Sem opt-in, reunião marcada ou opt-out |
| U-W12 | Mentoria alterada/cancelada | Alerta operacional após e-mail detalhado | Ver nova agenda | Sem opt-in ou pessoa não afetada |
| U-W13 | Decisão de reembolso disponível | Avisar aprovação/negativa sem expor dados sensíveis | Ver decisão no e-mail/suporte | Sem opt-in |

## 14. Estados e donos — Universidade

| Estado no CRM | Entrada | Próxima ação | Dono | Saída |
|---|---|---|---|---|
| `visitante` | LP carregada com medição | Retarget U-AD-06 | Growth | checkout iniciado |
| `checkout_abandonado` | início sem pagamento | U-E01/U-W01/U-AD-07 | CRM/Growth | pendente, pago ou cancelado |
| `pagamento_pendente` | retorno Asaas | U-E02/U-W02 | Financeiro/CRM | pago, falhou ou expirou |
| `pagamento_falhou` | retorno Asaas | U-E03/U-W03 | Financeiro/CRM | pago ou cancelado |
| `pago_sem_acesso` | pagamento confirmado | provisionar; alerta em 15 min | Tecnologia/Suporte | acesso entregue/reembolso |
| `acesso_entregue` | conta criada | U-E05 | Suporte/CS | primeiro login |
| `nao_ativado_24h` | sem login | U-E07 | CRM/CS | login/reembolso |
| `nao_ativado_72h` | sem login | U-E08/U-W06 | CS | login/reembolso |
| `aluno_ativo` | primeiro login/atividade | jornada de progresso | CS | inativo/concluído/reembolso |
| `inativo_7d` | sem atividade | U-E10 | CS | ativo/inativo 14d |
| `inativo_14d` | sem atividade | U-E11/U-W08 + humano | CS | ativo/encerrado |
| `concluido` | requisitos acadêmicos cumpridos | U-E15/U-W10 | Acadêmico/CS | certificado emitido |
| `reembolso_solicitado` | pedido formal | U-E13 + análise | Financeiro/Suporte | aprovado/negado |
| `reembolsado` | confirmação financeira | U-E14/U-W09 + revogar acesso | Financeiro/Tecnologia | encerrado |
| `lead_equipe` | U-TM-01 enviado | U-E17/U-W11 + contato | Vendas B2B | reunião/encerrado |

---

# FUNDAÇÃO COMPARTILHADA

## 15. Campos mínimos no CRM

| Grupo | Campos obrigatórios |
|---|---|
| Identidade | `contact_id`, nome, e-mail, telefone, cargo, escola/organização |
| Produto | `product`, oferta, modalidade individual/dupla/equipe |
| Aquisição | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, anúncio e landing page |
| Consentimento | canal, data/hora, fonte, texto/versão aceito e data de opt-out por canal |
| Jornada | estágio atual, data de entrada, responsável, próxima ação e último contato |
| Pagamento | `checkout_id`, `order_id`, status, valor, parcelas, data, reembolso e motivo |
| Workshop | qualificação, participante 2, presença, reunião e oportunidade comercial |
| Universidade | acesso criado, primeiro login, última atividade, progresso, mentoria e conclusão |

## 16. Eventos de medição

| Evento | Quando ocorre | Origem verdadeira |
|---|---|---|
| `ViewContent` | LP relevante visualizada | página |
| `Lead` | formulário realmente enviado | backend/formulário |
| `QualifiedLead` | regra/avaliação aprova Workshop | CRM |
| `InitiateCheckout` | checkout realmente iniciado | página/checkout |
| `Purchase` | pagamento confirmado | webhook Asaas, enviado ao analytics/Meta com deduplicação |
| `Refund` | reembolso confirmado | webhook/financeiro |
| `AccessProvisioned` | conta do curso criada | plataforma de ensino |
| `FirstLogin` | primeiro acesso real | plataforma de ensino |
| `WorkshopAttended` | check-in confirmado | operação do evento |
| `MeetingBooked` | reunião escolar agendada | agenda/CRM |
| `CourseCompleted` | requisitos cumpridos | plataforma acadêmica |

## 17. Regras de parada obrigatórias

- `pago`: para anúncio e mensagens de cobrança daquela oferta.
- `reembolsado/cancelado`: para onboarding, logística, ativação e upsell daquela compra.
- `opt_out_email`: para marketing por e-mail; mensagens estritamente transacionais passam por revisão jurídica/política.
- `opt_out_whatsapp`: bloqueia toda nova automação no WhatsApp.
- `sem_estoque`: pausa anúncios e remove CTAs do Workshop; não aceitar diagnóstico como promessa de vaga.
- `reuniao_marcada`: para convites automáticos para a mesma reunião.
- `presente`: nunca recebe fluxo de ausência.
- `acesso_entregue`: encerra alerta de “pago sem acesso”.
- `primeiro_login`: encerra lembretes de ativação.
- `concluido`: encerra recuperação de inatividade.

## 18. Bloqueios P0 antes de ligar tráfego

### Workshop

1. Confirmar checkout canônico, produtos individual/dupla e webhook de pagamento.
2. Definir capacidade real e uma única fonte para “18 vagas”, vendido e esgotado.
3. Implementar/confirmar CRM com os estados da seção 8.
4. Medir `Purchase` pela confirmação do Asaas — não pelo clique.
5. Criar confirmação e logística pós-pagamento.
6. Definir política aprovada de cancelamento, substituição e reembolso.

### Universidade

1. Corrigir divergência de preço no código: há conteúdo-base de R$ 99 e alteração posterior para R$ 149, com risco de flash/valor inconsistente. A fonte única deve ser 12x R$ 149.
2. Configurar webhook Asaas e reconciliar pagamento confirmado, falha, expiração e reembolso.
3. Confirmar plataforma de ensino e automatizar acesso; alerta humano se pago continuar sem acesso por 15 minutos.
4. Criar página de sucesso e rota comercial de equipes.
5. Validar documental/juridicamente a alegação “reconhecido pelo MEC” antes de usá-la em anúncios.
6. Implementar `Purchase` e deduplicação entre navegador e servidor.

## 19. Roteiro de QA — precisa passar antes do lançamento

Executar cada cenário com contato de teste separado e guardar prints/IDs do CRM, Asaas, mensagens e analytics.

- [ ] Workshop: visitante → abandona formulário → recebe somente recuperação permitida.
- [ ] Workshop: diagnóstico enviado → não elegível → não recebe cobrança.
- [ ] Workshop: qualificado → pagamento pendente → pago → cobranças param.
- [ ] Workshop: pagamento falha → nova tentativa → pago sem mensagens duplicadas.
- [ ] Workshop: compra dupla → cadastro do segundo participante → logística para ambos.
- [ ] Workshop: reembolso → confirmação + exclusão de logística e pós-evento.
- [ ] Workshop: presença e ausência geram fluxos mutuamente exclusivos.
- [ ] Workshop: reunião marcada interrompe convites e recebe lembrete correto.
- [ ] Universidade: checkout abandonado → recuperação → pago → retarget/cobrança param.
- [ ] Universidade: webhook repetido não duplica compra, acesso nem mensagens.
- [ ] Universidade: pago → acesso em até 15 min; atraso gera alerta real para suporte.
- [ ] Universidade: sem login 24h/72h → mensagens param após primeiro login.
- [ ] Universidade: inatividade 7d/14d → mensagens param após retorno.
- [ ] Universidade: reembolso revoga acesso e encerra jornada ativa.
- [ ] Universidade: conclusão libera orientação do certificado e encerra reativação.
- [ ] Equipe: formulário cai em Vendas B2B, não no checkout individual.
- [ ] Opt-out de e-mail e WhatsApp funciona separadamente em todos os estados.
- [ ] UTMs permanecem no contato, pagamento e relatório de receita.
- [ ] Estoque zero pausa Workshop e remove promessa de vaga.

## 20. Ordem de execução do time

1. **Tecnologia + Financeiro:** fontes da verdade — preço, estoque, produtos Asaas, webhooks, IDs e deduplicação.
2. **CRM + Vendas + CS:** criar estados, donos, prazos, exclusões e alertas humanos.
3. **Produto/Conteúdo:** ajustar/criar as 10 páginas/destinos listados.
4. **CRM/Copy:** redigir, aprovar e configurar 38 e-mails e 27 WhatsApps a partir dos IDs deste documento.
5. **Growth/Criação:** produzir 17 conceitos de anúncio; começar com um pacote por conceito e iterar com dados.
6. **Dados:** validar eventos do navegador, servidor, CRM, Asaas e plataforma acadêmica.
7. **QA:** executar os 19 cenários da seção 19 e registrar evidências.
8. **Growth:** ligar tráfego somente depois de todos os P0 e cenários críticos passarem.

## 21. Inventário final para produção

| Entrega | Workshop | Universidade | Total |
|---|---:|---:|---:|
| Páginas/destinos | 5 | 5 | 10 |
| Conceitos de anúncio | 9 | 8 | 17 |
| E-mails | 18 | 20 | 38 |
| WhatsApps | 14 | 13 | 27 |
| Estados de CRM | 13 | 15 | 28 |
| Cenários de QA | 8 específicos | 7 específicos + 4 compartilhados | 19 |

## 22. Critério de pronto

O funil só pode ser chamado de pronto quando:

- todos os IDs deste documento tiverem responsável e status;
- os P0 estiverem resolvidos;
- os 19 cenários de QA tiverem evidência;
- uma compra real controlada de cada oferta fechar o ciclo pagamento → CRM → comunicação → entrega;
- opt-out, reembolso e webhook duplicado tiverem sido testados;
- dashboards diferenciarem clique, lead, qualificado, checkout, pago, ativado e receita.

Até lá, a expressão correta é: **funil especificado para execução**, não “funil implementado”.

### Limite do inventário

Os 38 e-mails e 27 WhatsApps cobrem integralmente as automações e contingências previstas desta jornada comercial. Respostas individuais de suporte, solicitação de dados pessoais, disputa jurídica, fraude e incidente extraordinário pertencem aos respectivos procedimentos de Suporte, Privacidade, Financeiro e Segurança; não devem ser improvisados como campanha de funil.

## 23. Referências operacionais atuais

- Meta — Conversions API: https://www.facebook.com/business/help/AboutConversionsAPI
- Asaas — eventos de webhook: https://docs.asaas.com/docs/webhooks-events
- Asaas — eventos de checkout: https://docs.asaas.com/docs/checkout-events
- Asaas — eventos de pagamento: https://docs.asaas.com/docs/payment-events
- WhatsApp Business Messaging Policy: https://whatsappbusiness.com/policy/
- ANPD — guia de legítimo interesse: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-lanca-guia-orientativo-sobre-legitimo-interesse
