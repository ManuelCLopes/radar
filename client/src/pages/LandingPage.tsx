import { Link } from "wouter";
import { MapPin, Star, Mail, Map, BarChart3, MessageSquare, Lightbulb, Utensils, Scissors, Dumbbell, Hotel, Store } from "lucide-react";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="hero">
        <div className="landing-container">
          <h1 className="hero-headline" data-testid="hero-headline">
            Vê o que os teus concorrentes andam a fazer
          </h1>
          <p className="hero-subheadline" data-testid="hero-subheadline">
            Relatórios mensais automáticos com análise de reviews, preços e reputação dos negócios à tua volta.
          </p>
          <div className="hero-features" data-testid="hero-features">
            <div className="hero-feature">
              <MapPin className="hero-feature-icon" />
              <span>Concorrentes num raio à tua escolha</span>
            </div>
            <div className="hero-feature">
              <Star className="hero-feature-icon" />
              <span>Ratings, reviews e preços</span>
            </div>
            <div className="hero-feature">
              <Mail className="hero-feature-icon" />
              <span>Relatório mensal no teu email</span>
            </div>
          </div>
          <div className="hero-buttons">
            <a href="#cta-final" className="btn-primary" data-testid="link-hero-cta">
              Quero ver um exemplo de relatório
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
              <h3 className="step-title">Diz-nos qual é o teu negócio</h3>
              <p className="step-text">
                Inserimos o nome, localização e tipo de negócio (ex.: restaurante de sushi 
                em Odivelas, clínica de estética em Viseu, etc.).
              </p>
            </div>
            <div className="step-card" data-testid="step-card-2">
              <div className="step-number">2</div>
              <h3 className="step-title">O Radar analisa os teus concorrentes</h3>
              <p className="step-text">
                Usamos dados reais do Google para identificar os negócios à tua volta, 
                reviews, ratings, volume de comentários e nível de preço.
              </p>
            </div>
            <div className="step-card" data-testid="step-card-3">
              <div className="step-number">3</div>
              <h3 className="step-title">Recebes um relatório claro, todos os meses</h3>
              <p className="step-text">
                Compilamos tudo num relatório simples, com gráficos e conclusões em 
                linguagem humana. Sem dashboards complicados, sem folhas Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE VEM NO RELATÓRIO */}
      <section className="landing-section" data-testid="section-report-features">
        <div className="landing-container">
          <h2 className="section-title">O que vem no relatório mensal?</h2>
          <p className="section-subtitle">
            Não é mais uma folha de Excel. É um resumo que qualquer pessoa do staff consegue entender.
          </p>
          <div className="report-cards">
            <div className="report-card" data-testid="report-card-map">
              <div className="report-card-icon">
                <Map />
              </div>
              <h3 className="report-card-title">Mapa de concorrência local</h3>
              <p className="report-card-text">
                Lista dos principais concorrentes num raio à tua escolha, com rating, 
                número de reviews, nível de preço e distância.
              </p>
            </div>
            <div className="report-card" data-testid="report-card-comparison">
              <div className="report-card-icon">
                <BarChart3 />
              </div>
              <h3 className="report-card-title">Comparação directa contigo</h3>
              <p className="report-card-text">
                Vês logo quem está acima ou abaixo de ti em rating, reputação e 
                quantidade de feedback.
              </p>
            </div>
            <div className="report-card" data-testid="report-card-themes">
              <div className="report-card-icon">
                <MessageSquare />
              </div>
              <h3 className="report-card-title">Análise de temas das reviews</h3>
              <p className="report-card-text">
                Identificamos padrões: os clientes elogiam o quê nos outros? E em ti? 
                Serviço, preço, ambiente, rapidez, qualidade da comida…
              </p>
            </div>
            <div className="report-card" data-testid="report-card-recommendations">
              <div className="report-card-icon">
                <Lightbulb />
              </div>
              <h3 className="report-card-title">3–5 recomendações práticas</h3>
              <p className="report-card-text">
                Pistas concretas: melhorar tempo de espera, ajustar preços, reforçar 
                sobremesas, treinar equipa de sala, etc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AMOSTRA DO RELATÓRIO */}
      <section className="landing-section" data-testid="section-sample">
        <div className="landing-container">
          <div className="sample-section">
            <div className="sample-text">
              <h2 className="section-title">Uma pequena amostra do que vais receber</h2>
              <p>
                Na imagem de exemplo, vês um relatório para um restaurante num raio de 3 km:
              </p>
              <p>
                – 12 concorrentes directos identificados<br />
                – ranking por rating do Google<br />
                – gráficos simples com "força da marca" na zona<br />
                – resumo de temas dominantes das reviews ("serviço rápido", "preço justo", 
                "demora no atendimento", etc.)
              </p>
              <p>
                Cada relatório é personalizado para o teu negócio e enviado em PDF para o teu email.
              </p>
            </div>
            <div className="sample-image-placeholder" data-testid="sample-image-placeholder">
              Screenshot do relatório<br />
              (imagem de exemplo)
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="landing-section" data-testid="section-audience">
        <div className="landing-container">
          <h2 className="section-title">Para quem é o Radar de Concorrência Local?</h2>
          <p className="section-subtitle">
            Ideal para negócios locais que dependem de reputação e reviews:
          </p>
          <div className="audience-grid" data-testid="audience-list">
            <div className="audience-item">
              <div className="audience-icon">
                <Utensils />
              </div>
              <span>Restaurantes, cafés e pastelarias</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Scissors />
              </div>
              <span>Clínicas de estética, cabeleireiros, barbearias</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Dumbbell />
              </div>
              <span>Ginásios e estúdios de treino</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Hotel />
              </div>
              <span>Pequenos hotéis, alojamentos locais, guesthouses</span>
            </div>
            <div className="audience-item">
              <div className="audience-icon">
                <Store />
              </div>
              <span>Lojas físicas que competem em zonas comerciais</span>
            </div>
          </div>
          <p className="audience-final">
            Se tens um negócio local e tens concorrência à tua volta, o Radar foi feito para ti.
          </p>
        </div>
      </section>

      {/* PLANOS & PREÇOS */}
      <section className="landing-section" data-testid="section-pricing">
        <div className="landing-container">
          <h2 className="section-title">Planos e preços</h2>
          <div className="pricing-grid">
            <div className="pricing-card" data-testid="pricing-card-essential">
              <h3 className="pricing-plan-name">Essencial</h3>
              <p className="pricing-plan-subtitle">Para negócios individuais.</p>
              <ul className="pricing-features">
                <li>1 localização</li>
                <li>Relatório mensal</li>
                <li>Raio até 3 km</li>
                <li>Até 20 concorrentes analisados</li>
                <li>Envios por email em PDF</li>
                <li>Suporte por email</li>
              </ul>
              <p className="pricing-price" data-testid="price-essential">9€ / mês ou 90€ / ano</p>
            </div>
            <div className="pricing-card featured" data-testid="pricing-card-professional">
              <h3 className="pricing-plan-name">Profissional</h3>
              <p className="pricing-plan-subtitle">Para quem tem mais de um negócio ou quer acompanhar a fundo.</p>
              <ul className="pricing-features">
                <li>Até 3 localizações</li>
                <li>Relatório mensal + botão "gerar agora" no painel</li>
                <li>Raio até 5 km por localização</li>
                <li>Até 40 concorrentes por localização</li>
                <li>Relatórios com secção extra de recomendações</li>
                <li>Prioridade no suporte</li>
              </ul>
              <p className="pricing-price" data-testid="price-professional">19€ / mês ou 180€ / ano</p>
            </div>
          </div>
          <div className="early-bird-badge" data-testid="early-bird-badge">
            Primeiros 10 negócios com setup inicial gratuito e preço fixo vitalício.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" data-testid="section-faq">
        <div className="landing-container">
          <h2 className="section-title">Perguntas frequentes</h2>
          <div className="faq-list">
            <div className="faq-item" data-testid="faq-item-1">
              <h3 className="faq-question">De onde vêm os dados?</h3>
              <p className="faq-answer">
                Usamos dados públicos do Google Maps/Google Business (rating, número de reviews, 
                localização, etc.). Não acedemos a nada privado.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-2">
              <h3 className="faq-question">Preciso de instalar alguma coisa?</h3>
              <p className="faq-answer">
                Não. Recebes os relatórios por email em PDF. Se quiseres, podes ter acesso a um 
                painel simples online para gerar relatórios adicionais.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-3">
              <h3 className="faq-question">Isto substitui um consultor de marketing?</h3>
              <p className="faq-answer">
                Não. O Radar ajuda-te a perceber melhor o contexto à tua volta. Poupas horas 
                de pesquisa e ganhas clareza para tomar decisões. O que fazes com os dados é 
                decisão tua.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-4">
              <h3 className="faq-question">Posso cancelar quando quiser?</h3>
              <p className="faq-answer">
                Sim. Não há fidelização. Se cancelares, deixas simplesmente de receber relatórios.
              </p>
            </div>
            <div className="faq-item" data-testid="faq-item-5">
              <h3 className="faq-question">Posso experimentar antes de pagar?</h3>
              <p className="faq-answer">
                Podes pedir um relatório único experimental para a tua zona, com desconto ou 
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
            Queres ver como estás em relação aos teus concorrentes?
          </h2>
          <p className="cta-final-text">
            Envia o nome e localização do teu negócio e nós mostramos-te uma amostra real de relatório.
          </p>
          <a 
            href="mailto:contacto@radarlocal.pt?subject=Pedido de amostra de relatório" 
            className="btn-primary"
            data-testid="link-cta-request-sample"
          >
            Pedir amostra de relatório
          </a>
          <p className="cta-final-subtext">
            Sem compromisso. Usamos apenas dados públicos.
          </p>
        </div>
      </section>

      {/* LINK PARA DASHBOARD */}
      <section className="dashboard-link-section" data-testid="section-dashboard-link">
        <div className="landing-container">
          <Link href="/dashboard" className="dashboard-link" data-testid="link-dashboard">
            Já és cliente? Acede ao teu painel aqui
          </Link>
        </div>
      </section>
    </div>
  );
}
