import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LGPD — Velo",
  description: "Como a Velo atende à Lei Geral de Proteção de Dados (LGPD).",
};

export default function LgpdPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-ink prose-p:font-mono prose-p:text-sm prose-p:leading-7 prose-li:font-mono prose-li:text-sm prose-li:leading-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-signal">
        Última atualização: 3 de julho de 2026
      </p>
      <h1>LGPD — Proteção de Dados na Velo</h1>

      <p>
        A Velo trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados
        Pessoais (Lei nº 13.709/2018 — LGPD). Esta página resume, de forma direta, como a lei se
        aplica ao nosso serviço e como você exerce seus direitos como titular.
      </p>

      <h2>Papéis no tratamento</h2>
      <ul>
        <li>
          <strong>Velo como controladora:</strong> para os dados de cadastro e uso da plataforma
          pelos nossos usuários (nome, e-mail, dados de conta e de navegação).
        </li>
        <li>
          <strong>Operadores:</strong> provedores de infraestrutura, autenticação, e-mail,
          análise de produto e modelos de IA atuam como operadores, tratando dados apenas
          conforme nossas instruções.
        </li>
      </ul>

      <h2>Princípios que seguimos</h2>
      <ul>
        <li><strong>Finalidade e necessidade:</strong> coletamos apenas o mínimo necessário para prestar o serviço.</li>
        <li><strong>Transparência:</strong> as finalidades e compartilhamentos estão descritos na <a href="/legal/privacidade">Política de Privacidade</a>.</li>
        <li><strong>Segurança:</strong> criptografia em trânsito e em repouso, controle de acesso e isolamento de dados por conta (row-level security).</li>
        <li><strong>Prevenção:</strong> avaliamos impacto à privacidade antes de lançar novas funcionalidades que envolvam dados pessoais.</li>
      </ul>

      <h2>Seus direitos como titular (art. 18)</h2>
      <ul>
        <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
        <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
        <li>Portabilidade dos dados a outro fornecedor;</li>
        <li>Eliminação dos dados tratados com base no consentimento;</li>
        <li>Informação sobre entidades com as quais compartilhamos dados;</li>
        <li>Revogação do consentimento a qualquer momento;</li>
        <li>Oposição a tratamentos realizados com base em legítimo interesse.</li>
      </ul>

      <h2>Como exercer seus direitos</h2>
      <p>
        Envie sua solicitação para{" "}
        <a href="mailto:contato@velo.com.br">contato@velo.com.br</a> com o assunto
        &ldquo;LGPD&rdquo;. Responderemos em até 15 dias. Para segurança, poderemos solicitar
        confirmação de identidade antes de atender pedidos de acesso ou exclusão.
      </p>

      <h2>Incidentes de segurança</h2>
      <p>
        Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos
        titulares, comunicaremos a Autoridade Nacional de Proteção de Dados (ANPD) e os
        usuários afetados, nos termos do art. 48 da LGPD.
      </p>

      <h2>Encarregado (DPO)</h2>
      <p>
        O canal do encarregado de proteção de dados da Velo é{" "}
        <a href="mailto:contato@velo.com.br">contato@velo.com.br</a>.
      </p>
    </article>
  );
}
