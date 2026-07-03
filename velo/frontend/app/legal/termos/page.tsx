import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Velo",
  description: "Termos de Uso da plataforma Velo.",
};

export default function TermosPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-ink prose-p:font-mono prose-p:text-sm prose-p:leading-7 prose-li:font-mono prose-li:text-sm prose-li:leading-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-signal">
        Última atualização: 3 de julho de 2026
      </p>
      <h1>Termos de Uso</h1>

      <p>
        Bem-vindo à Velo. Estes Termos de Uso (&ldquo;Termos&rdquo;) regulam o acesso e a
        utilização da plataforma Velo (&ldquo;Plataforma&rdquo;), um serviço de monitoramento
        de presença de marcas em inteligências artificiais generativas. Ao criar uma conta ou
        utilizar a Plataforma, você declara ter lido, compreendido e aceito estes Termos.
      </p>

      <h2>1. O serviço</h2>
      <p>
        A Velo monitora, de forma automatizada, como modelos de inteligência artificial
        generativa (como ChatGPT e Gemini) descrevem, citam e recomendam marcas em respostas a
        consultas definidas pelo usuário, gerando análises, relatórios e planos de ação
        (&ldquo;Serviço&rdquo;).
      </p>
      <p>
        As respostas das IAs monitoradas são geradas por terceiros e variam ao longo do tempo.
        A Velo não controla, não garante e não se responsabiliza pelo conteúdo produzido por
        esses modelos, nem por resultados comerciais decorrentes das recomendações apresentadas
        nos planos de ação.
      </p>

      <h2>2. Cadastro e conta</h2>
      <ul>
        <li>Para usar a Plataforma é necessário criar uma conta com informações verdadeiras, completas e atualizadas.</li>
        <li>Você é responsável pela confidencialidade das suas credenciais e por todas as atividades realizadas na sua conta.</li>
        <li>A Plataforma destina-se a uso profissional (B2B) por maiores de 18 anos.</li>
      </ul>

      <h2>3. Planos, pagamento e cancelamento</h2>
      <ul>
        <li>O Serviço é oferecido por assinatura, conforme os planos e preços divulgados na Plataforma.</li>
        <li>Os valores são cobrados de forma recorrente até o cancelamento, que pode ser feito a qualquer momento e produz efeito ao fim do ciclo vigente.</li>
        <li>A Velo pode alterar preços mediante aviso prévio de, no mínimo, 30 dias.</li>
      </ul>

      <h2>4. Uso aceitável</h2>
      <p>Ao utilizar a Plataforma, você concorda em não:</p>
      <ul>
        <li>Utilizar o Serviço para fins ilícitos ou que violem direitos de terceiros;</li>
        <li>Tentar acessar áreas restritas, realizar engenharia reversa ou sobrecarregar a infraestrutura da Plataforma;</li>
        <li>Revender ou sublicenciar o Serviço sem autorização, exceto quando previsto no plano contratado (ex.: plano Agency com relatórios white-label);</li>
        <li>Monitorar marcas de terceiros com finalidade difamatória ou anticoncorrencial ilícita.</li>
      </ul>

      <h2>5. Propriedade intelectual</h2>
      <p>
        A Plataforma, sua marca, código, design e conteúdo são de titularidade da Velo. Os
        relatórios e planos de ação gerados para a sua conta podem ser utilizados livremente por
        você para fins profissionais, inclusive apresentação a clientes, conforme o plano
        contratado.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        O Serviço é fornecido &ldquo;no estado em que se encontra&rdquo;. Na máxima extensão
        permitida pela lei, a Velo não se responsabiliza por danos indiretos, lucros cessantes ou
        perda de oportunidade decorrentes do uso ou da indisponibilidade da Plataforma. Nada
        nestes Termos exclui responsabilidades que não possam ser limitadas nos termos da
        legislação brasileira.
      </p>

      <h2>7. Privacidade e proteção de dados</h2>
      <p>
        O tratamento de dados pessoais realizado pela Velo é descrito na nossa{" "}
        <a href="/legal/privacidade">Política de Privacidade</a> e na página{" "}
        <a href="/legal/lgpd">LGPD</a>, que integram estes Termos.
      </p>

      <h2>8. Suspensão e encerramento</h2>
      <p>
        A Velo pode suspender ou encerrar contas que violem estes Termos, mediante notificação
        quando possível. Você pode encerrar sua conta a qualquer momento pelas configurações da
        Plataforma ou pelo e-mail de contato.
      </p>

      <h2>9. Alterações destes Termos</h2>
      <p>
        Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas
        por e-mail ou aviso na Plataforma com antecedência razoável. O uso continuado após a
        vigência das alterações constitui aceite.
      </p>

      <h2>10. Legislação e foro</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
        foro do domicílio do usuário para dirimir controvérsias, quando aplicável a legislação
        consumerista, ou, nos demais casos, o foro da comarca da sede da Velo.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes Termos: <a href="mailto:contato@velo.com.br">contato@velo.com.br</a>.
      </p>
    </article>
  );
}
