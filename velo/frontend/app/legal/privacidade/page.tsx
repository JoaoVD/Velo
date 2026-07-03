import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Velo",
  description: "Política de Privacidade da plataforma Velo.",
};

export default function PrivacidadePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-ink prose-p:font-mono prose-p:text-sm prose-p:leading-7 prose-li:font-mono prose-li:text-sm prose-li:leading-7 prose-td:font-mono prose-td:text-sm prose-th:font-mono prose-th:text-xs">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-signal">
        Última atualização: 3 de julho de 2026
      </p>
      <h1>Política de Privacidade</h1>

      <p>
        Esta Política de Privacidade explica como a Velo (&ldquo;nós&rdquo;) coleta, utiliza,
        armazena e protege os seus dados pessoais ao utilizar a plataforma Velo, em conformidade
        com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada de forma
          criptografada pelo nosso provedor de autenticação).
        </li>
        <li>
          <strong>Dados de uso do serviço:</strong> marca monitorada, keywords cadastradas,
          configurações da conta e histórico de análises e relatórios.
        </li>
        <li>
          <strong>Dados de pagamento:</strong> processados por provedores de pagamento
          terceiros; não armazenamos números de cartão.
        </li>
        <li>
          <strong>Dados técnicos e de navegação:</strong> endereço IP, tipo de dispositivo e
          navegador, páginas acessadas e eventos de uso, coletados por ferramentas de análise e
          monitoramento de erros.
        </li>
      </ul>

      <h2>2. Finalidades e bases legais</h2>
      <ul>
        <li>
          <strong>Prestar o serviço contratado</strong> (execução de contrato): autenticação,
          monitoramento das keywords, geração de relatórios e envio de notificações
          transacionais.
        </li>
        <li>
          <strong>Melhorar a plataforma</strong> (legítimo interesse): métricas de uso agregadas
          e diagnóstico de erros.
        </li>
        <li>
          <strong>Comunicações comerciais</strong> (consentimento): envio de novidades e
          conteúdo, com opção de descadastro em todos os e-mails.
        </li>
        <li>
          <strong>Cumprimento de obrigações legais</strong>: guarda de registros exigidos por
          lei, como logs de acesso (Marco Civil da Internet).
        </li>
      </ul>

      <h2>3. Compartilhamento com terceiros</h2>
      <p>
        Não vendemos dados pessoais. Compartilhamos dados apenas com operadores necessários à
        prestação do serviço:
      </p>
      <ul>
        <li>Infraestrutura e banco de dados (hospedagem em nuvem);</li>
        <li>Provedores de modelos de IA, que recebem apenas as consultas de monitoramento — nunca seus dados de cadastro;</li>
        <li>Serviços de envio de e-mail transacional;</li>
        <li>Ferramentas de análise de produto e monitoramento de erros.</li>
      </ul>
      <p>
        Alguns desses provedores estão localizados fora do Brasil. Nesses casos, a transferência
        internacional ocorre com base nas salvaguardas previstas nos arts. 33 e seguintes da
        LGPD, incluindo cláusulas contratuais de proteção de dados.
      </p>

      <h2>4. Cookies</h2>
      <p>
        Utilizamos cookies essenciais para autenticação e sessão, e cookies analíticos para
        entender o uso da plataforma. Você pode gerenciar cookies não essenciais nas
        configurações do seu navegador.
      </p>

      <h2>5. Armazenamento e segurança</h2>
      <p>
        Os dados são armazenados em provedores de nuvem com criptografia em trânsito e em
        repouso, controle de acesso por perfil e políticas de segurança em nível de linha no
        banco de dados. Mantemos os dados pelo tempo necessário às finalidades desta Política ou
        por obrigação legal; após o encerramento da conta, dados pessoais são excluídos ou
        anonimizados em até 90 dias, salvo retenção legal obrigatória.
      </p>

      <h2>6. Seus direitos</h2>
      <p>
        Nos termos do art. 18 da LGPD, você pode solicitar: confirmação de tratamento, acesso,
        correção, anonimização, portabilidade, exclusão, informação sobre compartilhamentos e
        revogação de consentimento. Para exercer seus direitos, consulte a página{" "}
        <a href="/legal/lgpd">LGPD</a> ou escreva para{" "}
        <a href="mailto:contato@velo.com.br">contato@velo.com.br</a>.
      </p>

      <h2>7. Alterações desta Política</h2>
      <p>
        Esta Política pode ser atualizada para refletir mudanças no serviço ou na legislação.
        Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma.
      </p>

      <h2>Contato</h2>
      <p>
        Encarregado de proteção de dados (DPO):{" "}
        <a href="mailto:contato@velo.com.br">contato@velo.com.br</a>.
      </p>
    </article>
  );
}
