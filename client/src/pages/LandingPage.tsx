import { Link } from "wouter";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="hero">
        <div className="landing-container">
          <h1 className="hero-headline" data-testid="hero-headline">
            Ve o que os teus concorrentes andam a fazer – sem perder horas no Google.
          </h1>
          <p className="hero-subheadline" data-testid="hero-subheadline">
            O Radar de Concorrencia Local analisa automaticamente os negocios a tua volta, 
            compara reviews, precos e reputacao online e envia-te um relatorio simples, 
            uma vez por mes. Para que saibas onde estas a ganhar… e onde estas a perder.
          </p>
          <ul className="hero-bullets" data-testid="hero-bullets">
            <li>Mapeia os principais concorrentes num raio a tua escolha</li>
            <li>Compara ratings, numero de reviews e nivel de preco</li>
            <li>Recebe recomendacoes praticas no teu email, todos os meses</li>
          </ul>
          <div className="hero-buttons">
            <a href="#cta-final" className="btn-primary" data-testid="link-hero-cta">
              Quero ver um exemplo de relatorio
            </a>
            <a 
              href="mailto:demo@radarlocal.pt?subject=Pedido de demo de 15 minutos" 
              className="btn-secondary-link"
              data-testid="link-hero-demo"
            >
              Ou marcar uma demo de 15 minutos
            </a>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="landing-section" data-testid="section-how-it-works">
        <div className="landing-container">
          <h2 className="section-title">Como funciona?</h2>
          <div className="steps-grid">
            <div className="step-card" data-testid="step-card-1">
              <div className="step-number">1</div>
              <h3 className="step-title">Diz-nos qual e o teu negocio</h3>
              <p className="step-text">
                Inserimos o nome, localizacao e tipo de negocio (ex.: restaurante de sushi 
                em Odivelas, clinica de estetica em Viseu, etc.).
              </p>
            </div>
            <div className="step-card" data-testid="step-card-2">
              <div className="step-number">2</div>
              <h3 className="step-title">O Radar analisa os teus concorrentes</h3>
              <p className="step-text">
                Usamos dados reais do Google para identificar os negocios a tua volta, 
                reviews, ratings, volume de comentarios e nivel de preco.
              </p>
            </div>
            <div className="step-card" data-testid="step-card-3">
              <div className="step-number">3</div>
              <h3 className="step-title">Recebes um relatorio claro, todos os meses</h3>
              <p className="step-text">
                Compilamos tudo num relatorio simples, com graficos e conclusoes em 
                linguagem humana. Sem dashboards complicados, sem folhas Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE VEM NO RELATORIO */}
      <section className="landing-section" data-testid="section-report-features">
        <div className="landing-container">
          <h2 className="section-title">O que vem no relatorio mensal?</h2>
          <p className="section-subtitle">
            Nao e mais uma folha de Excel. E um resumo que qualquer pessoa do staff consegue entender.
          </p>
          <div className="report-cards">
            <div className="report-card" data-testid="report-card-map">
              <h3 className="report-card-title">Mapa de concorrencia local</h3>
              <p className="report-card-text">
                Lista dos principais concorrentes num raio a tua escolha, com rating, 
                numero de reviews, nivel de preco e distancia.
              </p>
            </div>
            <div className="report-card" data-testid="report-card-comparison">
              <h3 className="report-card-title">Comparacao directa contigo</h3>
              <p className="report-card-text">
                Ves logo quem esta acima ou abaixo de ti em rating, reputacao e 
                quantidade de feedback.
              </p>
            </div>
            <div className="report-card" data-testid="report-card-themes">
              <h3 className="report-card-title">Analise de temas das reviews</h3>
              <p className="report-card-text">
                Identificamos padroes: os clientes elogiam o que nos outros? E em ti? 
                Servico, preco, ambiente, rapidez, qualidade da comida…
              </p>
            </div>
            <div className="report-card" data-testid="report-card-recommendations">
              <h3 className="report-card-title">3–5 recomendacoes praticas para o proximo mes</h3>
              <p className="report-card-text">
                Pistas concretas: melhorar tempo de espera, ajustar precos, reforcar 
                sobremesas, treinar equipa de sala, etc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AMOSTRA DO RELATORIO */}
      <section className="landing-section" data-testid="section-sample">
        <div className="landing-container">
          <div className="sample-section">
            <div className="sample-text">
              <h2 className="section-title">Uma pequena amostra do que vais receber</h2>
              <p>
                Na imagem de exemplo, ves um relatorio para um restaurante num raio de 3 km:
              </p>
              <p>
                – 12 concorrentes directos identificados<br />
                – ranking por rating do Google<br />
                – graficos simples com "forca da marca" na zona<br />
                – resumo de temas dominantes das reviews ("servico rapido", "preco justo", 
                "demora no atendimento", etc.)
              </p>
              <p>
                Cada relatorio e personalizado para o teu negocio e enviado em PDF para o teu email.
              </p>
            </div>
            <div className="sample-image-placeholder" data-testid="sample-image-placeholder">
              Screenshot do relatorio<br />
              (imagem de exemplo)
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM E */}
      <section className="landing-section" data-testid="section-audience">
        <div className="landing-container">
          <h2 className="section-title">Para quem e o Radar de Concorrencia Local?</h2>
          <p className="section-subtitle">
            Ideal para negocios locais que dependem de reputacao e reviews:
          </p>
          <ul className="audience-list" data-testid="audience-list">
            <li>Restaurantes, cafes e pastelarias</li>
            <li>Clinicas de estetica, cabeleireiros, barbearias</li>
            <li>Ginasios e estudios de treino</li>
            <li>Pequenos hoteis, alojamentos locais, guesthouses</li>
            <li>Lojas fisicas que competem em zonas comerciais</li>
          </ul>
          <p className="audience-final">
            Se tens um negocio local e tens concorrencia a tua volta, o Radar foi feito para ti.
          </p>
        </div>
      </section>

      {/* PLANOS & PRECOS */}
      <section className="landing-section" data-testid="section-pricing">
        <div className="landing-container">
          <h2 className="section-title">Planos e precos</h2>
          <div className="pricing-grid">
            <div className="pricing-card" data-testid="pricing-card-essential">
              <h3 className="pricing-plan-name">Essencial</h3>
              <p className="pricing-plan-subtitle">Para negocios individuais.</p>
              <ul className="pricing-features">
                <li>1 localizacao</li>
                <li>Relatorio mensal</li>
                <li>Raio ate 3 km</li>
                <li>Ate 20 concorrentes analisados</li>
                <li>Envios por email em PDF</li>
                <li>Suporte por email</li>
              </ul>
              <p className="pricing-price" data-testid="price-essential">9 EUR / mes ou 90 EUR / ano</p>
            </div>
            <div className="pricing-card featured" data-testid="pricing-card-professional">
              <h3 className="pricing-plan-name">Profissional</h3>
              <p className="pricing-plan-subtitle">Para quem tem mais de um negocio ou quer acompanhar a fundo.</p>
              <ul className="pricing-features">
                <li>Ate 3 localizacoes</li>
                <li>Relatorio mensal + botao "gerar agora" no painel</li>
                <li>Raio ate 5 km por localizacao</li>
                <li>Ate 40 concorrentes por localizacao</li>
                <li>Relatorios com seccao extra de recomendacoes</li>
                <li>Prioridade no suporte</li>
              </ul>
              <p className="pricing-price" data-testid="price-professional">19 EUR / mes ou 180 EUR / ano</p>
            </div>
          </div>
          <div className="early-bird-badge" data-testid="early-bird-badge">
            Primeiros 10 negocios com setup inicial gratuito e preco fixo vitalicio.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" data-testid="section-faq">
        <div className="landing-container">
          <h2 className="section-title">Perguntas frequentes</h2>
          <div className="faq-list">
            <div className="faq-item" data-testid="faq-item-1">
              <h3 className="faq-question">De onde vem os dados?</h3>
              <p className="faq-answer">
                Usamos dados publicos do Google Maps/Google Business (rating, numero de reviews, 
                localizacao, etc.). Nao acedemos a nada privado.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-2">
              <h3 className="faq-question">Preciso de instalar alguma coisa?</h3>
              <p className="faq-answer">
                Nao. Recebes os relatorios por email em PDF. Se quiseres, podes ter acesso a um 
                painel simples online para gerar relatorios adicionais.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-3">
              <h3 className="faq-question">Isto substitui um consultor de marketing?</h3>
              <p className="faq-answer">
                Nao. O Radar ajuda-te a perceber melhor o contexto a tua volta. Poupas horas 
                de pesquisa e ganhas clareza para tomar decisoes. O que fazes com os dados e 
                decisao tua.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-4">
              <h3 className="faq-question">Posso cancelar quando quiser?</h3>
              <p className="faq-answer">
                Sim. Nao ha fidelizacao. Se cancelares, deixas simplesmente de receber relatorios.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-5">
              <h3 className="faq-question">Posso experimentar antes de pagar?</h3>
              <p className="faq-answer">
                Podes pedir um relatorio unico experimental para a tua zona, com desconto ou 
                gratuitamente, dependendo das campanhas em vigor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final" id="cta-final" data-testid="section-cta-final">
        <div className="landing-container">
          <h2 className="section-title">
            Queres ver como estas em relacao aos teus concorrentes?
          </h2>
          <p className="cta-final-text">
            Envia o nome e localizacao do teu negocio e nos mostramos-te uma amostra real de relatorio.
          </p>
          <a 
            href="mailto:contacto@radarlocal.pt?subject=Pedido de amostra de relatorio" 
            className="btn-primary"
            data-testid="link-cta-request-sample"
          >
            Pedir amostra de relatorio
          </a>
          <p className="cta-final-subtext">
            Sem compromisso. Usamos apenas dados publicos.
          </p>
        </div>
      </section>

      {/* LINK PARA DASHBOARD */}
      <section className="dashboard-link-section" data-testid="section-dashboard-link">
        <div className="landing-container">
          <Link href="/dashboard" className="dashboard-link" data-testid="link-dashboard">
            Ja es cliente? Acede ao teu painel aqui
          </Link>
        </div>
      </section>
    </div>
  );
}
