import { ArrowRight, ArrowUpRight, Bot, CheckCircle2, FileText, Radar, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { PublicSiteHeader } from "../components/marketing/PublicSiteHeader";
import { SectionReveal } from "../components/marketing/SectionReveal";
import { SiteFooter } from "../components/layout/SiteFooter";
import {
  BLOG_ARTICLES,
  BLOG_DECISION_ARTICLE_SLUGS,
  LANDING_FAQS,
  LANDING_CAPABILITY_KEYS,
  LANDING_CRAWLER_BULLETS,
  LANDING_PLATFORM_ITEMS,
  LANDING_PROOF_ITEMS,
  LANDING_WORKFLOW_STEPS,
  PUBLIC_HOME_NAV,
} from "../content/marketing";
import { useSiteStats } from "../hooks/useSiteStats";
import { usePageMetadata } from "../hooks/usePageMetadata";
import { useI18n } from "../i18n";

const HERO_CAPABILITY_ICONS = [Search, Bot, Users];
const PROOF_ICONS = [Sparkles, ShieldCheck, FileText];

export function LandingPage() {
  const { t, locale } = useI18n();
  const { data: siteStats } = useSiteStats();
  const numberFormatter = new Intl.NumberFormat(locale);
  const featuredBlogArticle =
    BLOG_ARTICLES.find((article) => article.slug === BLOG_DECISION_ARTICLE_SLUGS[0]) ?? BLOG_ARTICLES[0]!;
  const blogPreviewArticles = BLOG_ARTICLES.filter((article) => article.slug !== featuredBlogArticle.slug).slice(0, 2);

  usePageMetadata({
    title: t("landing.metaTitle"),
    description: t("landing.metaDescription"),
    canonicalPath: "/",
  });

  return (
    <div className="min-h-screen bg-[#f6efe5] text-slate-950">
      <PublicSiteHeader items={PUBLIC_HOME_NAV} theme="dark" />

      <main className="pb-16">
        <section className="relative overflow-hidden bg-[#08141f] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(201,111,69,0.3),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(134,200,188,0.22),transparent_22%),linear-gradient(135deg,#08141f_0%,#0c2538_44%,#08141f_100%)]" />
          <div className="absolute -left-12 top-24 h-64 w-64 rounded-full bg-[#c96f45]/20 blur-3xl animate-float-slow" />
          <div className="absolute bottom-6 right-[10%] h-72 w-72 rounded-full bg-[#86c8bc]/16 blur-3xl animate-float-slower" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/12" />

          <div className="relative mx-auto grid min-h-[calc(100svh-80px)] max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)] lg:px-8 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-start pt-6 lg:pt-14"
            >
              <p className="inline-flex w-fit rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#f3dcc9]">
                {t("landing.heroEyebrow")}
              </p>
              <p className="mt-5 text-sm font-medium tracking-[0.08em] text-white/56">
                {t("landing.badge")}
              </p>
              <h1 className="font-display mt-6 max-w-5xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.04] xl:text-[3.75rem] xl:leading-[1.01]">
                {t("landing.heroTitle")}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72 sm:text-xl">
                {t("landing.heroSubtitle")}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/workspace"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f7ecde] px-5 py-3 text-sm font-semibold text-[#082032] transition-colors hover:bg-white"
                >
                  {t("landing.primaryCta")}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/28 hover:bg-white/12"
                >
                  {t("landing.blogCta")}
                </Link>
                <a
                  href="https://github.com/study8677/OpenCMO"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-transparent px-5 py-3 text-sm font-semibold text-white/78 transition-colors hover:border-white/28 hover:bg-white/10 hover:text-white"
                >
                  {t("landing.secondaryCta")}
                  <ArrowUpRight size={16} />
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {LANDING_PROOF_ITEMS.map((item, index) => {
                  const Icon = PROOF_ICONS[index] ?? Sparkles;
                  return (
                    <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#f3dcc9]">
                        <Icon size={16} />
                        <span>{t(item.title)}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">
                        {t(item.description)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-start pt-2 lg:pt-6"
            >
              <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.3)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,111,69,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_64%)]" />
                <div className="relative">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f3dcc9]">
                    {t("landing.capabilitiesTitle")}
                  </p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-[1.6rem] border border-white/10 bg-[#08141f]/60 p-5">
                      <p className="text-sm leading-7 text-white/68">
                        {t("landing.capabilitiesSubtitle")}
                      </p>
                      <div className="mt-5 space-y-3">
                        {LANDING_CAPABILITY_KEYS.map((key, index) => {
                          const Icon = HERO_CAPABILITY_ICONS[index] ?? Search;
                          return (
                            <div
                              key={key}
                              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/72"
                            >
                              <Icon size={16} className="mt-1 text-[#f3dcc9]" />
                              <p>{t(key)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
                      <div className="rounded-[1.6rem] border border-white/10 bg-[#08141f]/60 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Radar size={16} className="text-[#86c8bc]" />
                          <span>{t("landing.crawlerTitle")}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/68">
                          {t("landing.crawlerBody")}
                        </p>
                        <div className="mt-4 space-y-3">
                          {LANDING_CRAWLER_BULLETS.map((key) => (
                            <div
                              key={key}
                              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/72"
                            >
                              <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#86c8bc]" />
                              <p>{t(key)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                            {t("siteFooter.totalVisits")}
                          </p>
                          <p className="mt-2 font-display text-2xl font-semibold text-white">
                            {numberFormatter.format(siteStats?.total_visits ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                            {t("siteFooter.uniqueVisitors")}
                          </p>
                          <p className="mt-2 font-display text-2xl font-semibold text-white">
                            {numberFormatter.format(siteStats?.unique_visitors ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">
                            {t("landing.metricPipelineLabel")}
                          </p>
                          <p className="mt-2 font-display text-2xl font-semibold text-white">
                            {t("landing.metricPipelineValue")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SectionReveal>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c96f45]">
                {t("landing.proofTitle")}
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t("landing.proofSubtitle")}
              </h2>
            </div>
          </SectionReveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {LANDING_PROOF_ITEMS.map((item, index) => {
              const Icon = PROOF_ICONS[index] ?? Sparkles;
              return (
                <SectionReveal key={item.title} delay={index * 0.06}>
                  <article className="rounded-[2rem] border border-black/8 bg-white/78 p-6 shadow-[0_18px_60px_rgba(8,32,50,0.05)]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#082032] text-white">
                      <Icon size={18} />
                    </div>
                    <h3 className="font-display mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                      {t(item.title)}
                    </h3>
                    <p className="mt-3 text-base leading-8 text-slate-700">
                      {t(item.description)}
                    </p>
                  </article>
                </SectionReveal>
              );
            })}
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SectionReveal>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c96f45]">
                {t("landing.platformEyebrow")}
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t("landing.platformTitle")}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-700">
                {t("landing.platformSubtitle")}
              </p>
            </div>
          </SectionReveal>

          <div className="mt-10 divide-y divide-black/8 rounded-[2rem] border border-black/8 bg-white/70 shadow-[0_18px_60px_rgba(8,32,50,0.05)] backdrop-blur">
            {LANDING_PLATFORM_ITEMS.map((item, index) => (
              <SectionReveal key={item.title} delay={index * 0.06}>
                <article className="grid gap-4 px-6 py-6 md:grid-cols-[72px_minmax(0,220px)_minmax(0,1fr)] md:px-8">
                  <p className="font-display text-4xl font-semibold tracking-tight text-[#c96f45]">
                    0{index + 1}
                  </p>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                    {t(item.title)}
                  </h3>
                  <p className="max-w-2xl text-base leading-8 text-slate-700">
                    {t(item.description)}
                  </p>
                </article>
              </SectionReveal>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SectionReveal>
            <div className="overflow-hidden rounded-[2.4rem] border border-black/8 bg-[#efe5d6] shadow-[0_22px_70px_rgba(8,32,50,0.08)]">
              <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:px-8 lg:py-10">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c96f45]">
                    {t("landing.workflowEyebrow")}
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {t("landing.workflowTitle")}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-8 text-slate-700">
                    {t("landing.workflowSubtitle")}
                  </p>
                </div>

                <div className="space-y-3">
                  {LANDING_WORKFLOW_STEPS.map((step, index) => (
                    <motion.article
                      key={step.title}
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="grid gap-4 rounded-[1.6rem] border border-black/8 bg-white/75 px-5 py-5 sm:grid-cols-[64px_minmax(0,1fr)]"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#082032] text-sm font-semibold text-white">
                        0{index + 1}
                      </div>
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                          {t(step.title)}
                        </h3>
                        <p className="mt-2 text-base leading-7 text-slate-700">
                          {t(step.description)}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SectionReveal>
            <div className="flex flex-col gap-4 border-b border-black/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c96f45]">
                  {t("landing.blogPreviewEyebrow")}
                </p>
                <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {t("landing.blogPreviewTitle")}
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-700">
                  {t("landing.blogPreviewSubtitle")}
                </p>
              </div>

              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
              >
                {t("landing.blogPreviewCta")}
                <ArrowRight size={15} />
              </Link>
            </div>
          </SectionReveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <SectionReveal>
              <Link
                to={`/blog#${featuredBlogArticle.slug}`}
                className={`group relative overflow-hidden rounded-[2rem] border border-black/8 bg-gradient-to-br p-6 shadow-[0_18px_60px_rgba(8,32,50,0.08)] transition-transform duration-300 hover:-translate-y-1 ${featuredBlogArticle.accentClass}`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.82))]" />
                <div className="relative max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                    {t(featuredBlogArticle.category)}
                  </p>
                  <h3 className="font-display mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {t(featuredBlogArticle.title)}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-700">
                    {t(featuredBlogArticle.summary)}
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {featuredBlogArticle.takeawayKeys.map((key) => (
                      <div key={key} className="rounded-2xl border border-black/8 bg-white/72 p-4 text-sm leading-6 text-slate-700">
                        {t(key)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {t("blog.readArticleCta")}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </SectionReveal>

            <div className="space-y-4">
              {blogPreviewArticles.map((article, index) => (
                <SectionReveal key={article.slug} delay={index * 0.08}>
                  <Link
                    to={`/blog#${article.slug}`}
                    className={`group block overflow-hidden rounded-[2rem] border border-black/8 bg-gradient-to-br p-6 shadow-[0_18px_60px_rgba(8,32,50,0.06)] transition-transform duration-300 hover:-translate-y-1 ${article.accentClass}`}
                  >
                    <div className="rounded-[1.4rem] bg-white/78 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                        {t(article.category)}
                      </p>
                      <h3 className="font-display mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                        {t(article.title)}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {t(article.summary)}
                      </p>
                      <div className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>{t(article.readTime)}</span>
                        <span className="inline-flex items-center gap-2 text-slate-900">
                          {t("blog.readArticleCta")}
                          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SectionReveal>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#c96f45]">
                {t("landing.navFaq")}
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t("landing.faqTitle")}
              </h2>
            </div>
          </SectionReveal>

          <div className="mt-8 divide-y divide-black/8 rounded-[2rem] border border-black/8 bg-white/75 shadow-[0_18px_60px_rgba(8,32,50,0.05)]">
            {LANDING_FAQS.map((item, index) => (
              <SectionReveal key={item.question} delay={index * 0.05}>
                <article className="grid gap-4 px-6 py-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:px-8">
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                    {t(item.question)}
                  </h3>
                  <p className="max-w-3xl text-base leading-8 text-slate-700">
                    {t(item.answer)}
                  </p>
                </article>
              </SectionReveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SectionReveal>
            <div className="overflow-hidden rounded-[2.4rem] border border-black/8 bg-[#082032] px-6 py-8 text-white shadow-[0_24px_90px_rgba(8,32,50,0.18)] sm:px-8 sm:py-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#f3dcc9]">
                    {t("landing.finalEyebrow")}
                  </p>
                  <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {t("landing.finalTitle")}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-white/72">
                    {t("landing.finalSubtitle")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/workspace"
                    className="inline-flex items-center gap-2 rounded-full bg-[#f7ecde] px-5 py-3 text-sm font-semibold text-[#082032] transition-colors hover:bg-white"
                  >
                    {t("landing.primaryCta")}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/28 hover:bg-white/12"
                  >
                    {t("landing.blogCta")}
                  </Link>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <div className="mx-auto max-w-7xl px-4 pt-16 lg:px-8">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
