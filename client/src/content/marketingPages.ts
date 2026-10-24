import type { RouteLocale } from "@/lib/localeRoutes";

// Copy for the public SEO landing pages. It lives here (rather than in the
// i18n JSON files) because these pages are published in English and
// Portuguese only, each on its own URL, and the same data is used by the
// React pages and by the build-time prerender.

export interface MarketingSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: { title: string; description: string }[];
}

export interface MarketingFaq {
  question: string;
  answer: string;
}

export interface MarketingPageContent {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: MarketingSection[];
  faq: MarketingFaq[];
}

export type MarketingPagePath = "/local-competitor-analysis" | "/competitor-tracker";

export const MARKETING_PAGES: Record<MarketingPagePath, Record<RouteLocale, MarketingPageContent>> = {
  "/local-competitor-analysis": {
    en: {
      seoTitle: "Local Competitor Analysis Tool | Competitor Watcher",
      seoDescription:
        "Run a free local competitor analysis. Map the competitors near your business, compare Google ratings, reviews and prices, and get location insights with AI recommendations.",
      eyebrow: "Local competitor analysis",
      h1: "Local Competitor Analysis: See Who Competes Near You",
      intro:
        "Your real competition is the business two streets away, not a national brand. Competitor Watcher finds the businesses of your type around any address, puts them on a map and compares them with you using public Google Maps data, so you know where you stand in your neighborhood.",
      sections: [
        {
          heading: "What a local competitor analysis shows you",
          paragraphs: [
            "Enter your address, choose your business type and a search radius. Competitor Watcher builds a report with every comparable business it finds inside that area:",
          ],
          bullets: [
            "Who your nearby competitors are and how far they are from you",
            "Each competitor's Google rating and total number of reviews",
            "Price level, so you can see whether you compete on value or on premium",
            "What customers praise and complain about in competitors' reviews",
            "A SWOT summary and 3–5 practical recommendations written by AI from that data",
          ],
        },
        {
          heading: "Competitor location insights on a map",
          paragraphs: [
            "Location explains a lot of local performance. The competitor map shows clusters of businesses like yours, gaps where there is little competition, and which rivals sit closest to your customers' path.",
            "Try different radii to answer different questions: 500 m–1 km shows who competes for walk-in customers, while 2–5 km shows your wider market. The free plan covers up to 5 km; paid plans go up to 50 km for regional businesses.",
          ],
        },
        {
          heading: "How to run a local competitor analysis in 3 steps",
          steps: [
            {
              title: "Add your business location",
              description: "Type the address (or use your current location) and pick your business type, such as restaurant, café, salon or gym.",
            },
            {
              title: "Choose a search radius",
              description: "Pick how far to look. Start small for street-level competition and widen it to understand the whole area.",
            },
            {
              title: "Read the report and act",
              description: "Compare ratings and review counts, scan the review themes and start with the recommendations that are easiest to apply this week.",
            },
          ],
        },
        {
          heading: "From analysis to decisions",
          paragraphs: [
            "A local competitor analysis is only useful if it changes what you do. Typical outcomes are a push for more Google reviews when competitors have far higher volume, fixing a complaint that keeps appearing in reviews in your area, adjusting prices to the local range, or highlighting something competitors are criticised for and you do well.",
          ],
        },
        {
          heading: "Who uses local competitor analysis",
          bullets: [
            "Restaurants, cafés and bakeries comparing themselves with the venues on the same street",
            "Salons, barbershops and clinics checking ratings and prices in their neighborhood",
            "Gyms, studios and small hotels deciding how to position against nearby options",
            "Shops and agencies preparing a quick, data-backed view of a local market",
          ],
        },
      ],
      faq: [
        {
          question: "How do I find my local competitors?",
          answer:
            "Enter your business address and type in Competitor Watcher and choose a search radius. The tool lists every comparable business in that area with its distance, Google rating, number of reviews and price level.",
        },
        {
          question: "What search radius should I use?",
          answer:
            "For walk-in businesses such as cafés or salons, start with 500 m to 1 km. For destinations people travel to, such as gyms or hotels, 2 to 5 km gives a better picture.",
        },
        {
          question: "Where does the competitor data come from?",
          answer: "From public sources such as Google Maps. Competitor Watcher does not access any private or confidential information.",
        },
        {
          question: "Is the local competitor analysis free?",
          answer:
            "Yes. The free plan covers one business profile, a search radius of up to 5 km and two reports per month. You can also run a quick analysis on the homepage without signing up.",
        },
      ],
    },
    pt: {
      seoTitle: "Análise de Concorrência Local | Competitor Watcher",
      seoDescription:
        "Faça uma análise de concorrentes local gratuita. Veja no mapa os concorrentes perto do seu negócio, compare avaliações, reviews e preços no Google e receba recomendações com IA.",
      eyebrow: "Análise de concorrência local",
      h1: "Análise de Concorrência Local: Descubra Quem Compete Perto de Si",
      intro:
        "A sua verdadeira concorrência é o negócio a duas ruas de distância, não uma marca nacional. O Competitor Watcher encontra os negócios do seu tipo à volta de qualquer morada, coloca-os num mapa e compara-os consigo usando dados públicos do Google Maps, para saber exatamente onde está no seu bairro.",
      sections: [
        {
          heading: "O que mostra uma análise de concorrência local",
          paragraphs: [
            "Indique a sua morada, escolha o tipo de negócio e um raio de pesquisa. O Competitor Watcher cria um relatório com todos os negócios comparáveis que encontra nessa área:",
          ],
          bullets: [
            "Quem são os seus concorrentes próximos e a que distância estão",
            "A avaliação no Google e o número total de reviews de cada concorrente",
            "O nível de preço, para perceber se compete pelo valor ou pelo segmento premium",
            "O que os clientes elogiam e criticam nas reviews dos concorrentes",
            "Uma análise SWOT e 3 a 5 recomendações práticas geradas por IA a partir desses dados",
          ],
        },
        {
          heading: "A localização dos concorrentes num mapa",
          paragraphs: [
            "A localização explica muito do desempenho de um negócio local. O mapa de concorrentes mostra zonas com muitos negócios como o seu, zonas com pouca concorrência e quais os rivais mais próximos do percurso dos seus clientes.",
            "Experimente raios diferentes para responder a perguntas diferentes: 500 m a 1 km mostra quem disputa os clientes de passagem, enquanto 2 a 5 km mostra o mercado mais alargado. O plano gratuito cobre até 5 km; os planos pagos chegam aos 50 km para negócios regionais.",
          ],
        },
        {
          heading: "Como fazer uma análise de concorrência local em 3 passos",
          steps: [
            {
              title: "Adicione a localização do negócio",
              description: "Escreva a morada (ou use a sua localização atual) e escolha o tipo de negócio, como restaurante, café, cabeleireiro ou ginásio.",
            },
            {
              title: "Escolha o raio de pesquisa",
              description: "Defina até onde procurar. Comece com um raio pequeno para a concorrência da rua e alargue-o para conhecer a zona toda.",
            },
            {
              title: "Leia o relatório e aja",
              description: "Compare avaliações e número de reviews, veja os temas das reviews e comece pelas recomendações mais fáceis de aplicar esta semana.",
            },
          ],
        },
        {
          heading: "Da análise à decisão",
          paragraphs: [
            "Uma análise de concorrência local só é útil se mudar o que faz. Resultados típicos: pedir mais reviews no Google quando os concorrentes têm muito mais volume, resolver uma queixa que se repete nas reviews da zona, ajustar preços à média local ou destacar algo em que os concorrentes são criticados e o seu negócio faz bem.",
          ],
        },
        {
          heading: "Para quem é a análise de concorrência local",
          bullets: [
            "Restaurantes, cafés e pastelarias que se comparam com os espaços da mesma rua",
            "Cabeleireiros, barbearias e clínicas que querem conhecer avaliações e preços no bairro",
            "Ginásios, estúdios e pequenos alojamentos que decidem como se posicionar face às alternativas próximas",
            "Lojas e agências que precisam de uma visão rápida e baseada em dados de um mercado local",
          ],
        },
      ],
      faq: [
        {
          question: "Como encontro os meus concorrentes locais?",
          answer:
            "Indique a morada e o tipo do seu negócio no Competitor Watcher e escolha um raio de pesquisa. A ferramenta lista todos os negócios comparáveis nessa área, com distância, avaliação no Google, número de reviews e nível de preço.",
        },
        {
          question: "Que raio de pesquisa devo usar?",
          answer:
            "Para negócios de passagem, como cafés ou cabeleireiros, comece com 500 m a 1 km. Para destinos onde as pessoas se deslocam de propósito, como ginásios ou alojamentos, 2 a 5 km dá uma imagem mais completa.",
        },
        {
          question: "De onde vêm os dados dos concorrentes?",
          answer: "De fontes públicas como o Google Maps. O Competitor Watcher não acede a informação privada ou confidencial.",
        },
        {
          question: "A análise de concorrência local é gratuita?",
          answer:
            "Sim. O plano gratuito inclui um perfil de negócio, um raio de pesquisa até 5 km e dois relatórios por mês. Também pode fazer uma análise rápida na página inicial sem criar conta.",
        },
      ],
    },
  },
  "/competitor-tracker": {
    en: {
      seoTitle: "Competitor Tracker for Local Businesses | Competitor Watcher",
      seoDescription:
        "Track and monitor your local competitors over time. Follow Google rating and review changes, spot new competitors nearby and get AI insights with Competitor Watcher.",
      eyebrow: "Competitor tracking",
      h1: "Competitor Tracker for Local Businesses",
      intro:
        "A one-off look at your competitors goes out of date fast: a new café opens down the road, a rival's rating drops after a bad month, another one doubles its reviews. Competitor Watcher keeps a history of your local market so you can watch competitors over time instead of guessing.",
      sections: [
        {
          heading: "Why track competitors instead of checking once",
          paragraphs: [
            "Local markets move slowly and then all at once. Tracking the same area regularly shows trends that a single snapshot hides: who is gaining reviews quickly, whose rating is slipping, and when a new business starts competing for your customers.",
          ],
        },
        {
          heading: "What you can track with Competitor Watcher",
          bullets: [
            "Google rating of each competitor compared with yours",
            "Review volume, to see who is winning attention in your area",
            "New businesses of your type that appear inside your search radius",
            "Price level across the local market",
            "Recurring themes in competitors' reviews, positive and negative",
          ],
        },
        {
          heading: "How competitor tracking works",
          steps: [
            {
              title: "Save your business",
              description: "Create a free account and add your business with its address, type and the radius you want to watch.",
            },
            {
              title: "Run reports over time",
              description: "Every report is stored in your history, so you can open past reports and compare how the market has changed.",
            },
            {
              title: "Follow the trends",
              description: "On the Pro plan, the trends dashboard charts the average local rating, your rating and the number of competitors over time, and a weekly report arrives by email.",
            },
          ],
        },
        {
          heading: "Plans for monitoring competitors",
          paragraphs: [
            "The free plan includes one business profile and two reports per month, which is enough to check your market regularly. The Pro and Agency plans add more reports, larger search areas, the trends dashboard, PDF export and weekly email reports; they are currently in early access, and you can request access from the pricing page.",
          ],
        },
      ],
      faq: [
        {
          question: "How often should I check my competitors?",
          answer:
            "For most local businesses, once or twice a month is enough to notice meaningful changes in ratings and reviews. In busy areas with frequent openings, weekly tracking is useful.",
        },
        {
          question: "Does Competitor Watcher send instant alerts?",
          answer:
            "No. Instead of real-time alerts, it gives you reports you can compare over time and, on the Pro plan, a weekly summary by email.",
        },
        {
          question: "Can I track competitors for several locations or clients?",
          answer: "Yes. The Pro plan supports 5 business profiles and the Agency plan supports up to 50 client locations with client-ready shared reports.",
        },
        {
          question: "Is there a free competitor tracker?",
          answer: "Yes. The free plan lets you save one business and run two reports per month, and every report stays in your history.",
        },
      ],
    },
    pt: {
      seoTitle: "Monitorização de Concorrentes para Negócios Locais | Competitor Watcher",
      seoDescription:
        "Acompanhe e monitorize os seus concorrentes locais ao longo do tempo. Siga as mudanças nas avaliações e reviews do Google, descubra novos concorrentes e receba análises com IA.",
      eyebrow: "Monitorização de concorrentes",
      h1: "Monitorização de Concorrentes para Negócios Locais",
      intro:
        "Uma análise pontual dos concorrentes fica desatualizada depressa: abre um café novo na rua, a avaliação de um rival cai depois de um mês mau, outro duplica as reviews. O Competitor Watcher guarda o histórico do seu mercado local para que possa acompanhar a concorrência ao longo do tempo em vez de adivinhar.",
      sections: [
        {
          heading: "Porque monitorizar a concorrência em vez de olhar uma vez",
          paragraphs: [
            "Os mercados locais mudam devagar e depois de repente. Acompanhar a mesma zona com regularidade revela tendências que uma fotografia única esconde: quem está a ganhar reviews depressa, quem está a perder avaliação e quando um novo negócio começa a disputar os seus clientes.",
          ],
        },
        {
          heading: "O que pode acompanhar com o Competitor Watcher",
          bullets: [
            "A avaliação no Google de cada concorrente comparada com a sua",
            "O volume de reviews, para ver quem está a ganhar atenção na zona",
            "Novos negócios do seu tipo que aparecem dentro do raio de pesquisa",
            "O nível de preço no mercado local",
            "Os temas recorrentes nas reviews dos concorrentes, positivos e negativos",
          ],
        },
        {
          heading: "Como funciona a monitorização de concorrentes",
          steps: [
            {
              title: "Guarde o seu negócio",
              description: "Crie uma conta gratuita e adicione o seu negócio com a morada, o tipo e o raio que quer acompanhar.",
            },
            {
              title: "Gere relatórios ao longo do tempo",
              description: "Cada relatório fica guardado no histórico, para poder abrir relatórios anteriores e comparar como o mercado mudou.",
            },
            {
              title: "Acompanhe as tendências",
              description: "No plano Pro, o painel de tendências mostra a evolução da avaliação média local, da sua avaliação e do número de concorrentes, e recebe um relatório semanal por email.",
            },
          ],
        },
        {
          heading: "Planos para monitorizar a concorrência",
          paragraphs: [
            "O plano gratuito inclui um perfil de negócio e dois relatórios por mês, o suficiente para verificar o mercado com regularidade. Os planos Pro e Agency acrescentam mais relatórios, áreas de pesquisa maiores, o painel de tendências, exportação em PDF e relatórios semanais por email; estão neste momento em acesso antecipado e pode pedir acesso na página de preços.",
          ],
        },
      ],
      faq: [
        {
          question: "Com que frequência devo analisar os meus concorrentes?",
          answer:
            "Para a maioria dos negócios locais, uma ou duas vezes por mês chega para notar mudanças relevantes nas avaliações e reviews. Em zonas movimentadas, com aberturas frequentes, vale a pena acompanhar semanalmente.",
        },
        {
          question: "O Competitor Watcher envia alertas instantâneos?",
          answer:
            "Não. Em vez de alertas em tempo real, dá-lhe relatórios que pode comparar ao longo do tempo e, no plano Pro, um resumo semanal por email.",
        },
        {
          question: "Posso monitorizar concorrentes de vários locais ou clientes?",
          answer: "Sim. O plano Pro suporta 5 perfis de negócio e o plano Agency até 50 locais de clientes, com relatórios partilháveis prontos para enviar.",
        },
        {
          question: "Existe uma ferramenta gratuita de monitorização de concorrentes?",
          answer: "Sim. O plano gratuito permite guardar um negócio e gerar dois relatórios por mês, e todos os relatórios ficam no seu histórico.",
        },
      ],
    },
  },
};

// Sample report (fictional data) for /competitor-analysis-report.

export interface SampleCompetitor {
  name: string;
  rating: number;
  reviews: number;
  distance: string;
  price: string;
  isYou?: boolean;
}

export interface SampleReportContent {
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  disclaimer: string;
  meta: { label: string; value: string }[];
  summaryHeading: string;
  summary: string[];
  tableHeading: string;
  tableColumns: { name: string; rating: string; reviews: string; distance: string; price: string };
  youLabel: string;
  competitors: SampleCompetitor[];
  themesHeading: string;
  positiveThemesLabel: string;
  positiveThemes: string[];
  negativeThemesLabel: string;
  negativeThemes: string[];
  swotHeading: string;
  swot: { label: string; items: string[] }[];
  recommendationsHeading: string;
  recommendations: string[];
  ctaHeading: string;
  ctaText: string;
}

const SAMPLE_COMPETITORS: SampleCompetitor[] = [
  { name: "Grão Fino Café", rating: 4.5, reviews: 276, distance: "—", price: "€€", isYou: true },
  { name: "Moinho Coffee Lab", rating: 4.7, reviews: 389, distance: "900 m", price: "€€€" },
  { name: "Café Aurora", rating: 4.6, reviews: 812, distance: "350 m", price: "€€" },
  { name: "Torra & Cia", rating: 4.4, reviews: 1204, distance: "600 m", price: "€€" },
  { name: "Pastelaria Jardim", rating: 4.2, reviews: 2310, distance: "450 m", price: "€" },
  { name: "Esquina do Pão", rating: 3.9, reviews: 640, distance: "250 m", price: "€" },
];

export const SAMPLE_REPORT: Record<RouteLocale, SampleReportContent> = {
  en: {
    seoTitle: "Competitor Analysis Report Example | Competitor Watcher",
    seoDescription:
      "See a competitor analysis report example for a local café: nearby competitors, Google ratings and reviews, review themes, SWOT and AI recommendations.",
    eyebrow: "Competitor watch example",
    h1: "Competitor Analysis Report Example",
    intro:
      "This is what a Competitor Watcher report looks like. It follows a specialty café in Lisbon and compares it with every café within 1 km, using the same sections you receive for your own business.",
    disclaimer: "Illustrative sample: the businesses and figures below are fictional.",
    meta: [
      { label: "Business", value: "Grão Fino Café (specialty coffee)" },
      { label: "Area", value: "Príncipe Real, Lisbon" },
      { label: "Search radius", value: "1 km" },
      { label: "Competitors found", value: "5" },
    ],
    summaryHeading: "Summary",
    summary: [
      "Your rating (4.5) is above the local average of 4.4, ranking 3rd of 6 cafés in the area.",
      "You have the fewest reviews (276). The two most-reviewed competitors have 4–8 times more, which gives them more visibility on Google Maps.",
      "The top-rated competitor, Moinho Coffee Lab, is also the most expensive. There is room for a high-quality, mid-price option.",
    ],
    tableHeading: "Competitor comparison",
    tableColumns: { name: "Business", rating: "Rating", reviews: "Reviews", distance: "Distance", price: "Price" },
    youLabel: "You",
    competitors: SAMPLE_COMPETITORS,
    themesHeading: "What customers say about competitors",
    positiveThemesLabel: "Praised",
    positiveThemes: ["Quality of specialty coffee", "Friendly, knowledgeable staff", "Fresh pastries baked on site"],
    negativeThemesLabel: "Criticised",
    negativeThemes: ["Slow service at weekend peaks", "Limited seating and no laptop space", "Prices rising faster than portions"],
    swotHeading: "SWOT analysis",
    swot: [
      { label: "Strengths", items: ["Above-average rating", "Competitive mid-range pricing"] },
      { label: "Weaknesses", items: ["Lowest review volume in the area", "Little visibility compared with older cafés"] },
      { label: "Opportunities", items: ["Competitors are criticised for slow weekend service", "No mid-priced specialty café with fast takeaway"] },
      { label: "Threats", items: ["Two high-volume competitors within 600 m", "A premium coffee lab attracting enthusiasts"] },
    ],
    recommendationsHeading: "Recommendations",
    recommendations: [
      "Ask satisfied customers for a Google review at the till with a QR code; aim for 50 new reviews in the next two months.",
      "Promote a fast weekend takeaway option, since slow service is the most common complaint about competitors.",
      "Keep prices in the €€ range and say so clearly: it is your main advantage over the top-rated café.",
      "Reply to every review to show the attention to service that customers say is missing nearby.",
    ],
    ctaHeading: "Get this report for your own business",
    ctaText: "Run a free analysis for your address. It takes about a minute and you don't need an account.",
  },
  pt: {
    seoTitle: "Exemplo de Relatório de Análise de Concorrência | Competitor Watcher",
    seoDescription:
      "Veja um exemplo de relatório de análise de concorrência para um café local: concorrentes próximos, avaliações e reviews no Google, temas das reviews, SWOT e recomendações com IA.",
    eyebrow: "Exemplo de relatório",
    h1: "Exemplo de Relatório de Análise de Concorrência",
    intro:
      "É assim que fica um relatório do Competitor Watcher. Acompanha um café de especialidade em Lisboa e compara-o com todos os cafés num raio de 1 km, com as mesmas secções que recebe para o seu negócio.",
    disclaimer: "Exemplo ilustrativo: os negócios e os números abaixo são fictícios.",
    meta: [
      { label: "Negócio", value: "Grão Fino Café (café de especialidade)" },
      { label: "Zona", value: "Príncipe Real, Lisboa" },
      { label: "Raio de pesquisa", value: "1 km" },
      { label: "Concorrentes encontrados", value: "5" },
    ],
    summaryHeading: "Resumo",
    summary: [
      "A sua avaliação (4,5) está acima da média local de 4,4, em 3.º lugar entre os 6 cafés da zona.",
      "Tem o menor número de reviews (276). Os dois concorrentes com mais reviews têm 4 a 8 vezes mais, o que lhes dá mais visibilidade no Google Maps.",
      "O concorrente com melhor avaliação, o Moinho Coffee Lab, é também o mais caro. Há espaço para uma opção de qualidade a preço médio.",
    ],
    tableHeading: "Comparação de concorrentes",
    tableColumns: { name: "Negócio", rating: "Avaliação", reviews: "Reviews", distance: "Distância", price: "Preço" },
    youLabel: "Você",
    competitors: SAMPLE_COMPETITORS,
    themesHeading: "O que os clientes dizem dos concorrentes",
    positiveThemesLabel: "Elogiado",
    positiveThemes: ["Qualidade do café de especialidade", "Equipa simpática e conhecedora", "Pastelaria fresca feita no local"],
    negativeThemesLabel: "Criticado",
    negativeThemes: ["Serviço lento nos picos de fim de semana", "Poucos lugares sentados e sem espaço para portátil", "Preços a subir mais do que as doses"],
    swotHeading: "Análise SWOT",
    swot: [
      { label: "Forças", items: ["Avaliação acima da média", "Preços competitivos de gama média"] },
      { label: "Fraquezas", items: ["Menor volume de reviews da zona", "Pouca visibilidade face a cafés mais antigos"] },
      { label: "Oportunidades", items: ["Concorrentes criticados pelo serviço lento ao fim de semana", "Não há café de especialidade de preço médio com take-away rápido"] },
      { label: "Ameaças", items: ["Dois concorrentes com muitas reviews a menos de 600 m", "Um coffee lab premium que atrai os entusiastas"] },
    ],
    recommendationsHeading: "Recomendações",
    recommendations: [
      "Peça uma review no Google aos clientes satisfeitos, com um código QR no balcão; o objetivo é chegar a 50 novas reviews nos próximos dois meses.",
      "Promova um take-away rápido ao fim de semana, já que o serviço lento é a queixa mais comum sobre os concorrentes.",
      "Mantenha os preços na gama €€ e comunique-o claramente: é a sua principal vantagem face ao café com melhor avaliação.",
      "Responda a todas as reviews para mostrar a atenção ao serviço que os clientes dizem faltar na zona.",
    ],
    ctaHeading: "Receba este relatório para o seu negócio",
    ctaText: "Faça uma análise gratuita para a sua morada. Demora cerca de um minuto e não precisa de conta.",
  },
};

// Shared chrome copy for the marketing pages.

export interface MarketingChrome {
  tryFree: string;
  runAnalysis: string;
  createAccount: string;
  faqHeading: string;
  relatedHeading: string;
  breadcrumbHome: string;
  pageNames: Record<"/local-competitor-analysis" | "/competitor-tracker" | "/competitor-analysis-report", string>;
}

export const MARKETING_CHROME: Record<RouteLocale, MarketingChrome> = {
  en: {
    tryFree: "Try it free",
    runAnalysis: "Run a free analysis",
    createAccount: "Create a free account",
    faqHeading: "Frequently asked questions",
    relatedHeading: "Keep exploring",
    breadcrumbHome: "Home",
    pageNames: {
      "/local-competitor-analysis": "Local competitor analysis",
      "/competitor-tracker": "Competitor tracker",
      "/competitor-analysis-report": "Sample competitor report",
    },
  },
  pt: {
    tryFree: "Experimente grátis",
    runAnalysis: "Fazer análise gratuita",
    createAccount: "Criar conta gratuita",
    faqHeading: "Perguntas frequentes",
    relatedHeading: "Continue a explorar",
    breadcrumbHome: "Início",
    pageNames: {
      "/local-competitor-analysis": "Análise de concorrência local",
      "/competitor-tracker": "Monitorização de concorrentes",
      "/competitor-analysis-report": "Exemplo de relatório",
    },
  },
};
