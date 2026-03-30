import {
  Twitter,
  MessageCircle,
  Linkedin,
  Rocket,
  Newspaper,
  PenTool,
  Search,
  Globe,
  Radio,
  Sparkles,
  BookOpen,
  Camera,
  Hash,
  Code2,
  Coffee,
  MessageSquare,
  FileText,
  GitBranch,
  Zap,
  Briefcase,
  Rss,
} from "lucide-react";
import { useI18n } from "../../i18n";
import type { Locale } from "../../i18n/I18nProvider";

interface AgentCard {
  id: string;
  icon: typeof Twitter;
  color: string;
  labels: Partial<Record<Locale, string>> & { en: string };
  descs: Partial<Record<Locale, string>> & { en: string };
  prompt: string;
  priority?: number; // 1-5 stars
}

const AGENTS: AgentCard[] = [
  {
    id: "cmo",
    icon: Sparkles,
    color: "from-indigo-500 to-violet-500",
    labels: { en: "CMO Agent", zh: "CMO 总管", ja: "CMO エージェント", ko: "CMO 에이전트", es: "Agente CMO" },
    descs: { en: "Full marketing strategy & multi-channel planning", zh: "全渠道营销策略制定与规划", ja: "マーケティング戦略とマルチチャネル計画", ko: "전채널 마케팅 전략 수립", es: "Estrategia de marketing y planificación multicanal" },
    prompt: "",
  },
  // ⭐⭐⭐⭐⭐ platforms
  {
    id: "ruanyifeng",
    icon: BookOpen,
    color: "from-amber-500 to-orange-600",
    labels: { en: "阮一峰周刊", zh: "阮一峰周刊" },
    descs: { en: "Tech weekly submission via GitHub Issue", zh: "科技爱好者周刊 GitHub Issue 投稿", ja: "テック週刊の GitHub Issue 投稿", ko: "기술 위클리 GitHub Issue 투고", es: "Envío semanal tech vía GitHub Issue" },
    prompt: "我要给阮一峰科技爱好者周刊投稿。请交给阮一峰周刊专家。",
    priority: 5,
  },
  {
    id: "zhihu",
    icon: Hash,
    color: "from-blue-500 to-indigo-600",
    labels: { en: "知乎", zh: "知乎" },
    descs: { en: "Articles & Q&A for tech community", zh: "知乎文章和问答内容创作", ja: "技術コミュニティ向け記事 & Q&A", ko: "기술 커뮤니티 기사 & Q&A", es: "Artículos y Q&A para la comunidad tech" },
    prompt: "我要创建知乎内容。请交给知乎专家。",
    priority: 5,
  },
  {
    id: "xiaohongshu",
    icon: Camera,
    color: "from-rose-400 to-pink-600",
    labels: { en: "小红书", zh: "小红书" },
    descs: { en: "Image-text notes for mass audience", zh: "图文种草笔记创作", ja: "画像テキストノート作成", ko: "이미지-텍스트 노트 작성", es: "Notas visuales para audiencia masiva" },
    prompt: "我要创建小红书笔记。请交给小红书专家。",
    priority: 5,
  },
  {
    id: "producthunt",
    icon: Rocket,
    color: "from-orange-500 to-amber-600",
    labels: { en: "Product Hunt" },
    descs: { en: "Launch copy, taglines & maker comments", zh: "产品上线文案、标语和制作者评论", ja: "ローンチコピー、タグラインとメーカーコメント", ko: "런치 카피, 태그라인 & 메이커 코멘트", es: "Copy de lanzamiento, eslóganes y comentarios" },
    prompt: "I want to prepare a Product Hunt launch. Please hand off to the Product Hunt expert.",
    priority: 5,
  },
  // ⭐⭐⭐⭐ platforms
  {
    id: "hackernews",
    icon: Newspaper,
    color: "from-orange-600 to-red-600",
    labels: { en: "Hacker News" },
    descs: { en: "Show HN posts for developer audience", zh: "面向开发者的 Show HN 帖子", ja: "開発者向け Show HN 投稿", ko: "개발자를 위한 Show HN 게시물", es: "Posts Show HN para desarrolladores" },
    prompt: "I want to create a Hacker News Show HN post. Please hand off to the HN expert.",
    priority: 4,
  },
  {
    id: "v2ex",
    icon: Code2,
    color: "from-zinc-600 to-slate-800",
    labels: { en: "V2EX" },
    descs: { en: "Developer community posts (share/create)", zh: "开发者社区发帖 (分享/创造)", ja: "開発者コミュニティ投稿", ko: "개발자 커뮤니티 게시물", es: "Posts en comunidad de desarrolladores" },
    prompt: "我要在 V2EX 发帖。请交给 V2EX 专家。",
    priority: 4,
  },
  {
    id: "juejin",
    icon: PenTool,
    color: "from-blue-400 to-cyan-500",
    labels: { en: "掘金", zh: "掘金" },
    descs: { en: "Technical blog articles & tutorials", zh: "掘金技术博客文章", ja: "技術ブログ記事 & チュートリアル", ko: "기술 블로그 글 & 튜토리얼", es: "Artículos técnicos y tutoriales" },
    prompt: "我要写掘金技术文章。请交给掘金专家。",
    priority: 4,
  },
  // ⭐⭐⭐ platforms
  {
    id: "twitter",
    icon: Twitter,
    color: "from-sky-400 to-blue-500",
    labels: { en: "Twitter/X Expert", zh: "Twitter/X 专家", ja: "Twitter/X エキスパート", ko: "Twitter/X 전문가", es: "Experto Twitter/X" },
    descs: { en: "Tweets, threads & engagement strategy", zh: "推文、话题串和互动策略", ja: "ツイート、スレッド & エンゲージメント戦略", ko: "트윗, 스레드 & 참여 전략", es: "Tweets, hilos y estrategia de engagement" },
    prompt: "I want to create Twitter/X marketing content. Please hand off to the Twitter/X expert.",
    priority: 3,
  },
  {
    id: "jike",
    icon: Coffee,
    color: "from-yellow-400 to-amber-500",
    labels: { en: "即刻", zh: "即刻" },
    descs: { en: "Indie dev & startup circle posts", zh: "独立开发者 / 创业者圈子动态", ja: "インディー開発者 & スタートアップ投稿", ko: "인디 개발자 & 스타트업 게시물", es: "Posts de desarrolladores indie y startups" },
    prompt: "我要发即刻动态。请交给即刻专家。",
    priority: 3,
  },
  {
    id: "wechat",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-600",
    labels: { en: "微信公众号", zh: "微信公众号", ja: "WeChat公式アカウント", ko: "WeChat 공식계정", es: "WeChat Oficial" },
    descs: { en: "WeChat long-form tech articles", zh: "微信公众号技术长文", ja: "WeChat テック長文記事", ko: "WeChat 기술 장문 기사", es: "Artículos técnicos largos en WeChat" },
    prompt: "我要写微信公众号文章。请交给微信公众号专家。",
    priority: 3,
  },
  {
    id: "oschina",
    icon: Globe,
    color: "from-green-600 to-teal-700",
    labels: { en: "OSChina", zh: "开源中国" },
    descs: { en: "Open-source project listings", zh: "开源项目收录和推荐文", ja: "オープンソースプロジェクト掲載", ko: "오픈소스 프로젝트 등록", es: "Listados de proyectos open-source" },
    prompt: "我要在 OSChina 收录项目。请交给 OSChina 专家。",
    priority: 3,
  },
  {
    id: "sspai",
    icon: Zap,
    color: "from-red-500 to-rose-600",
    labels: { en: "少数派", zh: "少数派" },
    descs: { en: "Tool reviews & productivity articles", zh: "工具测评和效率文章投稿", ja: "ツールレビュー & 生産性記事", ko: "도구 리뷰 & 생산성 기사", es: "Reseñas de herramientas y productividad" },
    prompt: "我要给少数派投稿。请交给少数派专家。",
    priority: 3,
  },
  {
    id: "devto",
    icon: Rss,
    color: "from-slate-700 to-zinc-900",
    labels: { en: "Dev.to" },
    descs: { en: "Developer blog articles & tutorials", zh: "开发者博客文章和教程", ja: "開発者ブログ記事 & チュートリアル", ko: "개발자 블로그 글 & 튜토리얼", es: "Artículos y tutoriales para desarrolladores" },
    prompt: "I want to write a Dev.to article. Please hand off to the Dev.to expert.",
    priority: 3,
  },
  {
    id: "reddit",
    icon: MessageCircle,
    color: "from-orange-400 to-red-500",
    labels: { en: "Reddit Expert", zh: "Reddit 专家", ja: "Reddit エキスパート", ko: "Reddit 전문가", es: "Experto Reddit" },
    descs: { en: "Authentic community posts & subreddit strategy", zh: "社区帖子撰写和子版块策略", ja: "コミュニティ投稿 & サブレディット戦略", ko: "커뮤니티 게시물 & 서브레딧 전략", es: "Posts auténticos y estrategia de subreddit" },
    prompt: "I want to create Reddit posts. Please hand off to the Reddit expert.",
    priority: 3,
  },
  // ⭐⭐ platforms
  {
    id: "gitcode",
    icon: GitBranch,
    color: "from-red-600 to-orange-700",
    labels: { en: "GitCode" },
    descs: { en: "Repository mirror for CSDN users", zh: "仓库镜像 + CSDN 配套文章", ja: "CSDN ユーザー向けリポジトリミラー", ko: "CSDN 사용자를 위한 저장소 미러", es: "Mirror de repositorio para usuarios CSDN" },
    prompt: "我要在 GitCode 设置仓库。请交给 GitCode 专家。",
    priority: 2,
  },
  {
    id: "infoq",
    icon: Briefcase,
    color: "from-purple-600 to-indigo-700",
    labels: { en: "InfoQ" },
    descs: { en: "Enterprise-grade tech articles", zh: "面向架构师的深度技术文章", ja: "エンタープライズグレードの技術記事", ko: "엔터프라이즈급 기술 기사", es: "Artículos técnicos de nivel empresarial" },
    prompt: "我要给 InfoQ 投稿。请交给 InfoQ 专家。",
    priority: 2,
  },
  // Other tools (no priority — utility agents)
  {
    id: "linkedin",
    icon: Linkedin,
    color: "from-blue-500 to-blue-700",
    labels: { en: "LinkedIn Expert", zh: "LinkedIn 专家", ja: "LinkedIn エキスパート", ko: "LinkedIn 전문가", es: "Experto LinkedIn" },
    descs: { en: "Professional posts & thought leadership", zh: "专业帖子和行业领导力内容", ja: "プロフェッショナル投稿 & ソートリーダーシップ", ko: "전문 게시물 & 사고 리더십", es: "Posts profesionales y liderazgo de opinión" },
    prompt: "I want to create LinkedIn content. Please hand off to the LinkedIn expert.",
  },
  {
    id: "blog",
    icon: FileText,
    color: "from-emerald-500 to-teal-600",
    labels: { en: "Blog / SEO Writer", zh: "博客 / SEO 写手", ja: "ブログ / SEO ライター", ko: "블로그 / SEO 라이터", es: "Escritor Blog / SEO" },
    descs: { en: "Articles, SEO content & blog strategy", zh: "文章撰写、SEO 内容和博客策略", ja: "記事、SEO コンテンツ & ブログ戦略", ko: "기사, SEO 콘텐츠 & 블로그 전략", es: "Artículos, contenido SEO y estrategia de blog" },
    prompt: "I want to create blog/SEO content. Please hand off to the Blog/SEO expert.",
  },
  {
    id: "seo",
    icon: Search,
    color: "from-violet-500 to-purple-600",
    labels: { en: "SEO Auditor", zh: "SEO 审计", ja: "SEO 監査", ko: "SEO 감사", es: "Auditor SEO" },
    descs: { en: "Technical SEO analysis & recommendations", zh: "技术 SEO 分析和优化建议", ja: "テクニカル SEO 分析と最適化提案", ko: "기술 SEO 분석 & 최적화 제안", es: "Análisis SEO técnico y recomendaciones" },
    prompt: "I want a technical SEO audit. Please hand off to the SEO audit expert.",
  },
  {
    id: "geo",
    icon: Globe,
    color: "from-cyan-500 to-blue-600",
    labels: { en: "AI Visibility (GEO)", zh: "AI 可见度 (GEO)", ja: "AI 可視性 (GEO)", ko: "AI 가시성 (GEO)", es: "Visibilidad IA (GEO)" },
    descs: { en: "Check brand mentions in AI search engines", zh: "检查品牌在 AI 搜索引擎中的提及", ja: "AI 検索エンジンでのブランド言及を確認", ko: "AI 검색 엔진에서 브랜드 언급 확인", es: "Verificar menciones de marca en motores IA" },
    prompt: "I want to check AI visibility / GEO score. Please hand off to the AI visibility expert.",
  },
  {
    id: "community",
    icon: Radio,
    color: "from-pink-500 to-rose-600",
    labels: { en: "Community Monitor", zh: "社区监控", ja: "コミュニティモニター", ko: "커뮤니티 모니터", es: "Monitor de Comunidad" },
    descs: { en: "Scan discussions on Reddit, HN & Dev.to", zh: "扫描 Reddit、HN 和 Dev.to 上的讨论", ja: "Reddit、HN、Dev.to のディスカッションをスキャン", ko: "Reddit, HN & Dev.to 토론 스캔", es: "Escanear discusiones en Reddit, HN y Dev.to" },
    prompt: "I want to monitor community discussions. Please hand off to the community monitor.",
  },
];

function PriorityStars({ count }: { count: number }) {
  return (
    <span className="text-[10px] text-amber-500 ml-1">
      {"★".repeat(count)}
    </span>
  );
}

export function AgentGrid({ onSelect, projectName }: { onSelect: (prompt: string) => void; projectName?: string | null }) {
  const { locale, t } = useI18n();

  // When a project is selected, prefix prompts with project name
  const buildPrompt = (basePrompt: string) => {
    if (!projectName || !basePrompt) return basePrompt;
    return t("agentGrid.projectPrefix", { name: projectName }) + basePrompt;
  };

  // Special CMO prompt when project is selected
  const cmoPrompt = projectName
    ? t("agentGrid.cmoPrompt", { name: projectName })
    : "";

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          {t("agentGrid.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t("agentGrid.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const resolvedPrompt = agent.id === "cmo"
            ? cmoPrompt
            : buildPrompt(agent.prompt);
          return (
            <button
              key={agent.id}
              onClick={() => {
                if (resolvedPrompt) {
                  onSelect(resolvedPrompt);
                }
              }}
              disabled={!resolvedPrompt}
              className="group flex flex-col items-start rounded-xl border border-slate-100 p-4 text-left transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm disabled:cursor-default disabled:hover:border-slate-100 disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${agent.color} text-white shadow-sm`}
              >
                <Icon size={16} />
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {agent.labels[locale] ?? agent.labels.en}
                {agent.priority && <PriorityStars count={agent.priority} />}
              </span>
              <span className="mt-0.5 text-[11px] leading-tight text-slate-400">
                {agent.descs[locale] ?? agent.descs.en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
